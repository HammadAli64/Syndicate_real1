"""Save uploaded files to SYNDICATE_DATA_DIR/uploads and create UploadedDocument."""
from __future__ import annotations

import hashlib
from pathlib import Path

from django.conf import settings
from django.core.files.uploadedfile import UploadedFile

from api.models import UploadedDocument
from api.services.document_extract import extract_text

SUPPORTED_SUFFIXES = frozenset({".pdf", ".txt", ".md", ".markdown", ".docx"})


def store_uploaded_file(f: UploadedFile) -> tuple[UploadedDocument | None, str | None]:
    """
    Persist an uploaded file and create UploadedDocument.
    Returns (document, error_message). On success error_message is None.
    """
    name = getattr(f, "name", "upload") or "upload"
    suffix = Path(name).suffix.lower()
    if suffix not in SUPPORTED_SUFFIXES:
        return None, f"Unsupported type. Use one of: {', '.join(sorted(SUPPORTED_SUFFIXES))}"

    uploads = Path(settings.SYNDICATE_DATA_DIR) / "uploads"
    uploads.mkdir(parents=True, exist_ok=True)
    digest = hashlib.sha256()
    chunks: list[bytes] = []
    for chunk in f.chunks():
        digest.update(chunk)
        chunks.append(chunk)
    content_hash = digest.hexdigest()

    rel = f"uploads/{content_hash}{suffix}"
    path = Path(settings.SYNDICATE_DATA_DIR) / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("wb") as out:
        for c in chunks:
            out.write(c)

    text = extract_text(path)
    doc = UploadedDocument.objects.create(
        original_name=name,
        stored_path=str(path.relative_to(settings.SYNDICATE_DATA_DIR)).replace("\\", "/"),
        content_hash=content_hash,
        text_extracted=text,
    )
    return doc, None
