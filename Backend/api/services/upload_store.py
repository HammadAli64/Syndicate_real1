"""Create UploadedDocument from uploads: text in DB; raw bytes on S3 when configured, else inline path only."""
from __future__ import annotations

import hashlib
import logging
import uuid
from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import UploadedFile

from api.models import UploadedDocument
from api.services.document_extract import extract_text_from_bytes

logger = logging.getLogger(__name__)

SUPPORTED_SUFFIXES = frozenset({".pdf", ".txt", ".md", ".markdown", ".docx"})


def store_upload_bytes(data: bytes, original_name: str) -> tuple[UploadedDocument | None, str | None]:
    """Persist raw bytes + extracted text (admin uses this from form.clean() so errors show on the form)."""
    name = (original_name or "upload").strip() or "upload"
    suffix = Path(name).suffix.lower()
    if suffix not in SUPPORTED_SUFFIXES:
        return None, f"Unsupported type. Use one of: {', '.join(sorted(SUPPORTED_SUFFIXES))}"
    if not data:
        return None, "Empty file."
    content_hash = hashlib.sha256(data).hexdigest()

    try:
        text = extract_text_from_bytes(data, suffix)
    except ValueError as e:
        return None, str(e)
    except Exception as e:
        return None, f"Could not read this document (corrupt or unsupported content): {e}"

    if getattr(settings, "USE_S3_OBJECT_STORAGE", False):
        key = f"uploads/{content_hash}-{uuid.uuid4().hex[:12]}{suffix}"
        try:
            stored_path = default_storage.save(key, ContentFile(data))
        except Exception as e:
            logger.exception("Object storage upload failed for key=%s", key)
            return None, f"Could not store file in object storage: {e}"
    else:
        stored_path = f"inline/{content_hash}{suffix}"
    try:
        doc = UploadedDocument.objects.create(
            original_name=name,
            stored_path=stored_path,
            content_hash=content_hash,
            text_extracted=text,
        )
    except Exception as e:
        return None, f"Could not save document record: {e}"
    return doc, None


def store_uploaded_file(f: UploadedFile) -> tuple[UploadedDocument | None, str | None]:
    """
    Read upload in memory, extract text, save UploadedDocument.
    Does not write under data/uploads/ (avoids read-only / ephemeral disk issues on Railway).
    """
    name = getattr(f, "name", "upload") or "upload"
    data = b"".join(f.chunks())
    return store_upload_bytes(data, name)
