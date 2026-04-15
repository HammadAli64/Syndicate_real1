from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.portal.permissions import IsAuthenticatedStrict

from apps.courses.access import user_can_access_course, user_can_access_video
from apps.courses.models import Course, Video, VideoProgress
from apps.courses.serializers import (
    CourseSerializer,
    CourseWriteSerializer,
    VideoCreateSerializer,
    VideoSerializer,
    VideoProgressSerializer,
)
from apps.courses.services.vdocipher import VdoCipherError, create_otp, create_upload_credentials


class CourseListCreateView(APIView):
    """GET: list published courses (auth). POST: staff creates course."""

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdminUser()]
        return [IsAuthenticatedStrict()]

    def get(self, request):
        qs = Course.objects.all()
        if not getattr(request.user, "is_staff", False):
            qs = qs.filter(is_published=True)
        return Response(CourseSerializer(qs.order_by("title"), many=True).data)

    def post(self, request):
        ser = CourseWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        course = ser.save()
        return Response(CourseSerializer(course).data, status=status.HTTP_201_CREATED)


class CourseDetailView(APIView):
    permission_classes = [IsAuthenticatedStrict]

    def get(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        if not user_can_access_course(request.user, course):
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        return Response(CourseSerializer(course).data)


class CourseVideosListView(APIView):
    """GET /api/courses/<id>/videos/ — ordered playlist metadata."""

    permission_classes = [IsAuthenticatedStrict]

    def get(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        if not user_can_access_course(request.user, course):
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        qs = course.videos.filter(status=Video.Status.READY).order_by("order", "id")
        return Response(VideoSerializer(qs, many=True).data)


class UploadCredentialsView(APIView):
    """
    GET /api/videos/upload-credentials/?title=...
    Returns VdoCipher upload payload (uploadLink, videoId, clientPayload). Staff only.
    """

    permission_classes = [IsAdminUser]

    def get(self, request):
        title = (request.query_params.get("title") or "upload").strip() or "upload"
        folder_id = (request.query_params.get("folder_id") or "").strip() or None
        try:
            data = create_upload_credentials(title=title[:500], folder_id=folder_id)
        except VdoCipherError as e:
            return Response(
                {"detail": str(e), "vdocipher_body": e.body},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response(data)


class VideoMetadataCreateView(APIView):
    """
    POST /api/videos/
    Register metadata after direct upload to VdoCipher completed.
    """

    permission_classes = [IsAdminUser]

    def post(self, request):
        ser = VideoCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        v = ser.validated_data
        video = Video.objects.create(
            title=v["title"],
            description=(v.get("description") or "").strip(),
            course_id=v["course_id"],
            vdocipher_id=v["vdocipher_id"].strip(),
            order=v["order"],
            status=v["status"],
        )
        return Response(VideoSerializer(video).data, status=status.HTTP_201_CREATED)


class VideoOTPView(APIView):
    """
    GET /api/videos/<id>/otp/
    Proxies OTP generation (secret never exposed).
    """

    permission_classes = [IsAuthenticatedStrict]

    def get(self, request, pk):
        video = get_object_or_404(Video, pk=pk)
        if not user_can_access_video(request.user, video):
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        if video.status != Video.Status.READY:
            return Response({"detail": "Video is not ready for playback."}, status=status.HTTP_409_CONFLICT)
        try:
            otp_payload = create_otp(vdocipher_video_id=video.vdocipher_id)
        except VdoCipherError as e:
            return Response(
                {"detail": str(e), "vdocipher_body": e.body},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response(
            {
                "otp": otp_payload["otp"],
                "playbackInfo": otp_payload["playbackInfo"],
                "video_id": video.id,
                "vdocipher_id": video.vdocipher_id,
            }
        )


class VideoProgressView(APIView):
    """GET/POST /api/videos/<id>/progress/ — read or upsert watch position."""

    permission_classes = [IsAuthenticatedStrict]

    def get(self, request, pk):
        video = get_object_or_404(Video, pk=pk)
        if not user_can_access_video(request.user, video):
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        prog = VideoProgress.objects.filter(user=request.user, video=video).first()
        if not prog:
            return Response({"position_seconds": 0, "completed": False})
        return Response(VideoProgressSerializer(prog).data)

    def post(self, request, pk):
        video = get_object_or_404(Video, pk=pk)
        if not user_can_access_video(request.user, video):
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        ser = VideoProgressSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        obj, _ = VideoProgress.objects.update_or_create(
            user=request.user,
            video=video,
            defaults={
                "position_seconds": ser.validated_data.get("position_seconds", 0),
                "completed": ser.validated_data.get("completed", False),
            },
        )
        return Response(VideoProgressSerializer(obj).data)
