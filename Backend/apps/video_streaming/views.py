import mimetypes
import re
import time
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from botocore.exceptions import ClientError
from django.conf import settings
from django.db.models import Count, Prefetch
from django.core import signing
from django.http import FileResponse, Http404, HttpResponse, StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django.urls import reverse
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.video_streaming.models import StreamPlaylist, StreamPlaylistItem, StreamVideo
from apps.video_streaming.serializers import (
    StreamPlaylistDetailSerializer,
    StreamPlaylistListSerializer,
    StreamVideoDetailSerializer,
    StreamVideoListSerializer,
    StreamVideoStreamSerializer,
)
from apps.video_streaming.services.r2_hls import _s3_client

STREAM_TOKEN_SALT = "video_streaming.hls.v1"


def _normalize_hls_relpath(raw: str) -> str | None:
    cleaned = (raw or "").strip().replace("\\", "/").lstrip("/")
    if not cleaned:
        return None
    parts = [p for p in cleaned.split("/") if p]
    for p in parts:
        if p in (".", ".."):
            return None
    return "/".join(parts)


def _content_type_for_name(name: str) -> str:
    lower = name.lower()
    if lower.endswith(".m3u8"):
        return "application/vnd.apple.mpegurl"
    if lower.endswith(".ts"):
        return "video/mp2t"
    ct, _ = mimetypes.guess_type(name)
    return ct or "application/octet-stream"


def playback_playlist_path(video_id: int) -> str:
    """Site-relative URL (works behind Next.js proxy)."""
    return reverse("streaming-hls-media", kwargs={"video_id": video_id, "rel_path": "index.m3u8"})


def _stream_token_secret() -> str:
    return (getattr(settings, "STREAM_SIGNING_SECRET", "") or "").strip() or settings.SECRET_KEY


def _token_ttl_seconds() -> int:
    raw = str(getattr(settings, "STREAM_SIGNED_URL_TTL_SECONDS", 900)).strip() or "900"
    try:
        ttl = int(raw)
    except ValueError:
        ttl = 900
    return max(30, min(ttl, 60 * 60 * 24))


def _build_stream_token(*, user_id: int, video_id: int, exp: int) -> str:
    payload = {"u": int(user_id), "v": int(video_id), "exp": int(exp)}
    return signing.dumps(payload, key=_stream_token_secret(), salt=STREAM_TOKEN_SALT, compress=True)


def _verify_stream_token(*, token: str, video_id: int) -> dict | None:
    try:
        payload = signing.loads(token, key=_stream_token_secret(), salt=STREAM_TOKEN_SALT)
    except signing.BadSignature:
        return None
    if not isinstance(payload, dict):
        return None
    try:
        uid = int(payload.get("u"))
        vid = int(payload.get("v"))
        exp = int(payload.get("exp"))
    except (TypeError, ValueError):
        return None
    now = int(time.time())
    if vid != int(video_id) or exp <= now:
        return None
    return {"u": uid, "v": vid, "exp": exp}


def _append_query_params(url: str, extra: dict[str, str]) -> str:
    if not url:
        return url
    split = urlsplit(url)
    query = dict(parse_qsl(split.query, keep_blank_values=True))
    query.update(extra)
    return urlunsplit((split.scheme, split.netloc, split.path, urlencode(query), split.fragment))


def _rewrite_hls_manifest(content: str, token: str, exp: str) -> str:
    """
    Ensure each URI in manifest carries auth query params so `.ts` / key files
    are protected by the same signed token as `index.m3u8`.
    """
    extra = {"token": token, "expires": exp}
    out: list[str] = []
    uri_attr_re = re.compile(r'URI="([^"]+)"')
    for raw_line in content.splitlines():
        line = raw_line.strip()
        if not line:
            out.append(raw_line)
            continue
        if line.startswith("#"):
            def _replace_uri(m: re.Match[str]) -> str:
                return f'URI="{_append_query_params(m.group(1), extra)}"'

            out.append(uri_attr_re.sub(_replace_uri, raw_line))
            continue
        out.append(_append_query_params(raw_line, extra))
    # HLS parsers are happier with trailing newline.
    return "\n".join(out) + "\n"


class StreamVideoListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = StreamVideo.objects.filter(show_in_programs=True)
    serializer_class = StreamVideoListSerializer


class StreamVideoDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    queryset = StreamVideo.objects.all()
    serializer_class = StreamVideoDetailSerializer


class StreamVideoStreamView(APIView):
    """
    GET /api/streaming/videos/stream/<id>/

    Returns a site-relative HLS playlist path that is only served by StreamHlsMediaView when authenticated.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, pk: int, *args, **kwargs):
        try:
            video = StreamVideo.objects.get(pk=pk)
        except StreamVideo.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if video.status != StreamVideo.Status.READY or not (video.hls_path or "").strip():
            payload = {"id": video.id, "status": video.status, "hls_url": None}
            ser = StreamVideoStreamSerializer(payload)
            return Response(ser.data, status=status.HTTP_200_OK)

        exp = int(time.time()) + _token_ttl_seconds()
        token = _build_stream_token(user_id=request.user.id, video_id=video.pk, exp=exp)
        query = urlencode({"token": token, "expires": str(exp)})
        payload = {
            "id": video.id,
            "status": video.status,
            "hls_url": f"{playback_playlist_path(video.pk)}?{query}",
        }
        ser = StreamVideoStreamSerializer(payload)
        return Response(ser.data, status=status.HTTP_200_OK)


class StreamHlsMediaView(APIView):
    """
    Authenticated HLS delivery (playlist + segments). Use hls.js xhrSetup to send Authorization on each request.
    """

    permission_classes = [AllowAny]

    def get(self, request, video_id: int, rel_path: str, *args, **kwargs):
        token = (request.query_params.get("token") or "").strip()
        expires = (request.query_params.get("expires") or "").strip()
        if not token or not expires:
            raise Http404()
        claims = _verify_stream_token(token=token, video_id=video_id)
        if not claims:
            raise Http404()
        # If request carries a logged-in user, token must belong to same user.
        if getattr(request.user, "is_authenticated", False) and request.user.id != claims["u"]:
            raise Http404()

        video = get_object_or_404(StreamVideo, pk=video_id)
        if video.status != StreamVideo.Status.READY or not (video.hls_path or "").strip():
            raise Http404()

        sub = _normalize_hls_relpath(rel_path)
        if not sub:
            raise Http404()

        media_root = Path(settings.MEDIA_ROOT).resolve()
        base_local = media_root / "hls" / str(video_id)
        try:
            local_file = (base_local / sub).resolve()
            local_file.relative_to(base_local)
        except ValueError:
            raise Http404()

        if local_file.is_file():
            if sub.lower().endswith(".m3u8"):
                content = local_file.read_text(encoding="utf-8", errors="replace")
                rewritten = _rewrite_hls_manifest(content, token=token, exp=expires)
                resp = HttpResponse(rewritten, content_type=_content_type_for_name(sub))
            else:
                resp = FileResponse(local_file.open("rb"), content_type=_content_type_for_name(sub))
            resp["Cache-Control"] = "private, no-store"
            return resp

        bucket = (getattr(settings, "AWS_STORAGE_BUCKET_NAME", None) or "").strip()
        if getattr(settings, "USE_S3_OBJECT_STORAGE", False) and bucket:
            client = _s3_client()
            if not client:
                raise Http404()
            key = f"hls/{video_id}/{sub}"
            try:
                obj = client.get_object(Bucket=bucket, Key=key)
            except ClientError as ex:
                code = ex.response.get("Error", {}).get("Code", "")
                if code in ("404", "NoSuchKey", "NotFound"):
                    raise Http404() from ex
                raise
            body = obj["Body"]

            if sub.lower().endswith(".m3u8"):
                content = body.read().decode("utf-8", errors="replace")
                rewritten = _rewrite_hls_manifest(content, token=token, exp=expires)
                resp = HttpResponse(rewritten, content_type=_content_type_for_name(sub))
            else:
                def chunks():
                    while True:
                        data = body.read(65536)
                        if not data:
                            break
                        yield data

                resp = StreamingHttpResponse(chunks(), content_type=_content_type_for_name(sub))
            resp["Cache-Control"] = "private, no-store"
            return resp

        raise Http404()


class StreamPlaylistListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = StreamPlaylistListSerializer

    def get_queryset(self):
        qs = StreamPlaylist.objects.all()
        if not getattr(self.request.user, "is_staff", False):
            qs = qs.filter(is_published=True)
        return (
            qs.order_by("title")
            .annotate(video_count=Count("items", distinct=True))
            .prefetch_related(
                Prefetch(
                    "items",
                    queryset=StreamPlaylistItem.objects.select_related("stream_video").order_by("order", "id"),
                )
            )
        )


class StreamPlaylistDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = StreamPlaylistDetailSerializer
    lookup_field = "pk"

    def get_queryset(self):
        qs = StreamPlaylist.objects.all()
        if not getattr(self.request.user, "is_staff", False):
            qs = qs.filter(is_published=True)
        return (
            qs.annotate(video_count=Count("items", distinct=True))
            .prefetch_related(
                Prefetch(
                    "items",
                    queryset=StreamPlaylistItem.objects.select_related("stream_video").order_by("order", "id"),
                )
            )
        )
