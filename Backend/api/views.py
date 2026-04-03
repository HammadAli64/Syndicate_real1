"""REST API for document upload, mindset ingest, and syndicate bootstrap."""
from __future__ import annotations

from pathlib import Path

from django.conf import settings
from django.core.files.storage import default_storage
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.challenges.models import GeneratedChallenge
from apps.challenges.services import ensure_daily_challenges_for_device

from .models import MindsetKnowledge, UploadedDocument
from .services.document_extract import extract_text, extract_text_from_bytes, file_sha256, truncate
from .services.openai_client import extract_mindsets_from_document
from .services.upload_store import SUPPORTED_SUFFIXES, store_uploaded_file


def _data_path(rel: str) -> Path:
    return Path(settings.SYNDICATE_DATA_DIR) / rel.replace("\\", "/")


def _uploads_dir() -> Path:
    return Path(settings.SYNDICATE_DATA_DIR) / "uploads"


def _register_file_from_disk(abs_path: Path) -> UploadedDocument:
    """Create or return existing UploadedDocument for a file already under data/."""
    data_dir = Path(settings.SYNDICATE_DATA_DIR)
    rel = abs_path.relative_to(data_dir)
    rel_str = rel.as_posix()
    h = file_sha256(abs_path)
    existing = UploadedDocument.objects.filter(content_hash=h).first()
    if existing:
        return existing
    text = extract_text(abs_path)
    return UploadedDocument.objects.create(
        original_name=abs_path.name,
        stored_path=rel_str,
        content_hash=h,
        text_extracted=text,
    )


def run_ingest(doc: UploadedDocument) -> tuple[bool, dict | None, str | None]:
    """Ingest uses text_extracted when set; else local file under data/, else object storage (S3/Tigris)."""
    raw = (doc.text_extracted or "").strip()
    if not raw:
        path = _data_path(doc.stored_path)
        if path.is_file():
            raw = extract_text(path)
        elif getattr(settings, "USE_S3_OBJECT_STORAGE", False) and default_storage.exists(doc.stored_path):
            with default_storage.open(doc.stored_path, "rb") as fh:
                blob = fh.read()
            suf = Path(doc.stored_path).suffix.lower() or Path(doc.original_name).suffix.lower()
            if suf not in {".pdf", ".txt", ".md", ".markdown", ".docx"}:
                suf = ".pdf"
            raw = extract_text_from_bytes(blob, suf)
        else:
            return False, None, (
                "No document text in database and source file is missing "
                "(not on disk or object storage)."
            )
        doc.text_extracted = raw
        doc.save(update_fields=["text_extracted"])

    text = truncate(raw)
    try:
        payload = extract_mindsets_from_document(text)
    except RuntimeError as e:
        return False, None, str(e)
    except Exception as e:
        return False, None, str(e)

    mind, _created = MindsetKnowledge.objects.update_or_create(
        source=doc,
        defaults={
            "payload": payload,
            "model_used": getattr(settings, "OPENAI_MODEL", "gpt-4o-mini"),
        },
    )
    return True, {
        "mindset_id": mind.id,
        "document_id": doc.id,
        "updated_at": mind.updated_at.isoformat(),
        "mindset_preview": {
            "mindset_count": len((payload or {}).get("mindsets", [])),
            "themes": (payload or {}).get("themes", [])[:5],
        },
    }, None


@api_view(["GET"])
def health(_request):
    return Response({"ok": True, "service": "syndicate-api"})


@api_view(["GET"])
def mindset_status(_request):
    """Whether mindsets are loaded and from which file."""
    latest = MindsetKnowledge.objects.select_related("source").order_by("-updated_at").first()
    if not latest:
        return Response(
            {
                "ready": False,
                "message": "No document ingested yet. Add a file under data/uploads/ and sync, or upload in the UI.",
            }
        )
    return Response(
        {
            "ready": True,
            "source_filename": latest.source.original_name,
            "content_hash": latest.source.content_hash,
            "updated_at": latest.updated_at.isoformat(),
            "model_used": latest.model_used,
        }
    )


@api_view(["POST"])
def upload_document(request):
    """Multipart: field `file` (pdf, txt, md, docx)."""
    f = request.FILES.get("file")
    if not f:
        return Response({"detail": "Missing file field."}, status=status.HTTP_400_BAD_REQUEST)

    doc, err = store_uploaded_file(f)
    if err:
        return Response({"detail": err}, status=status.HTTP_400_BAD_REQUEST)

    return Response(
        {
            "id": doc.id,
            "original_name": doc.original_name,
            "content_hash": doc.content_hash,
            "char_count": len(doc.text_extracted or ""),
            "created_at": doc.created_at.isoformat(),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
def ingest_document(request):
    """Process uploaded document: extract mindsets via OpenAI."""
    doc_id = request.data.get("document_id")
    if not doc_id:
        return Response({"detail": "document_id required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        doc = UploadedDocument.objects.get(pk=doc_id)
    except UploadedDocument.DoesNotExist:
        return Response({"detail": "Document not found"}, status=status.HTTP_404_NOT_FOUND)

    ok, data, err = run_ingest(doc)
    if not ok:
        code = status.HTTP_503_SERVICE_UNAVAILABLE if err and "OPENAI_API_KEY" in (err or "") else status.HTTP_502_BAD_GATEWAY
        return Response({"detail": err}, status=code)

    return Response(data)


@api_view(["POST"])
def syndicate_bootstrap(request):
    """
    Scan data/uploads/, register files, optionally ingest + generate today's challenge.

    Body: auto_ingest (default true), auto_challenge (default true), mood (default "stressed"),
          force_reingest (default false).
    """
    auto_ingest = request.data.get("auto_ingest", True)
    auto_challenge = request.data.get("auto_challenge", True)
    force_reingest = request.data.get("force_reingest", False)

    uploads = _uploads_dir()
    uploads.mkdir(parents=True, exist_ok=True)

    synced_files: list[str] = []
    primary_doc: UploadedDocument | None = None
    newest_mtime = -1.0

    for path in sorted(uploads.iterdir(), key=lambda p: p.name.lower()):
        if not path.is_file():
            continue
        if path.suffix.lower() not in SUPPORTED_SUFFIXES:
            continue
        try:
            doc = _register_file_from_disk(path)
        except Exception as e:
            return Response(
                {"ok": False, "detail": f"Could not read {path.name}: {e}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        synced_files.append(path.name)
        mtime = path.stat().st_mtime
        if mtime >= newest_mtime:
            newest_mtime = mtime
            primary_doc = doc

    if not primary_doc:
        return Response(
            {
                "ok": False,
                "detail": "No supported files in data/uploads/. Add .pdf, .txt, .md, or .docx",
                "synced_files": [],
                "data_path": str(uploads.as_posix()),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    ingested = False
    ingest_error: str | None = None
    mindset_ok = MindsetKnowledge.objects.filter(source=primary_doc).exists()

    if auto_ingest and (force_reingest or not mindset_ok):
        ok, _, err = run_ingest(primary_doc)
        ingested = ok
        ingest_error = err
        mindset_ok = ok

    if not mindset_ok and not auto_ingest:
        mindset_ok = MindsetKnowledge.objects.filter(source=primary_doc).exists()

    if not mindset_ok and ingest_error:
        return Response(
            {
                "ok": False,
                "detail": ingest_error,
                "document_id": primary_doc.id,
                "synced_files": synced_files,
                "ingested": False,
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE if ingest_error and "OPENAI_API_KEY" in ingest_error else status.HTTP_502_BAD_GATEWAY,
        )

    today_rows: list[dict] = []
    generated_today = False

    if auto_challenge and mindset_ok:
        before = GeneratedChallenge.objects.filter(challenge_date=timezone.localdate()).count()
        device_key = f"user:{request.user.id}"
        ok, rows, err = ensure_daily_challenges_for_device(device_key, force_regenerate=False, user=request.user)
        if not ok and err:
            return Response(
                {
                    "ok": False,
                    "detail": err,
                    "document_id": primary_doc.id,
                    "synced_files": synced_files,
                    "ingested": ingested,
                    "mindsets_ready": True,
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE if err and "OPENAI_API_KEY" in err else status.HTTP_502_BAD_GATEWAY,
            )
        today_rows = rows
        after = GeneratedChallenge.objects.filter(challenge_date=timezone.localdate()).count()
        generated_today = after > before

    latest = MindsetKnowledge.objects.select_related("source").order_by("-updated_at").first()
    return Response(
        {
            "ok": True,
            "document_id": primary_doc.id,
            "synced_files": synced_files,
            "primary_file": primary_doc.original_name,
            "ingested": ingested,
            "mindsets_ready": mindset_ok,
            "generated_today": generated_today,
            "today_challenges": today_rows,
            "recent_challenges": today_rows,
            "source_filename": latest.source.original_name if latest else None,
        }
    )
