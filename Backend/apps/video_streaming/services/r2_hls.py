"""
Upload generated HLS artifacts to S3-compatible storage (Cloudflare R2).

Uses the same env contract as syndicate_backend.settings._s3_object_storage_config:
AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_STORAGE_BUCKET_NAME, AWS_S3_ENDPOINT_URL, etc.
"""

from __future__ import annotations

import mimetypes
import os
from pathlib import Path
from typing import Iterable

import boto3
from botocore.config import Config as BotoConfig
from django.conf import settings


def _s3_client():
    if not getattr(settings, "USE_S3_OBJECT_STORAGE", False):
        return None
    endpoint = (getattr(settings, "AWS_S3_ENDPOINT_URL", None) or "").strip() or None
    region = (getattr(settings, "AWS_S3_REGION_NAME", None) or "auto").strip()
    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        region_name=region,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        config=BotoConfig(retries={"max_attempts": 8, "mode": "adaptive"}),
    )


def _content_type(path: Path) -> str:
    if path.suffix.lower() == ".m3u8":
        return "application/vnd.apple.mpegurl"
    if path.suffix.lower() == ".ts":
        return "video/mp2t"
    guessed, _ = mimetypes.guess_type(str(path))
    return guessed or "application/octet-stream"


def iter_hls_files(directory: Path) -> Iterable[Path]:
    for p in sorted(directory.rglob("*")):
        if p.is_file():
            yield p


def upload_hls_directory(local_dir: Path, video_id: int, bucket: str) -> None:
    """
    Upload every file under local_dir to s3://bucket/hls/<video_id>/...
    Preserves relative paths (index.m3u8, *.ts).
    """
    client = _s3_client()
    if client is None:
        raise RuntimeError("S3/R2 is not configured (USE_S3_OBJECT_STORAGE / credentials missing).")

    base_prefix = f"hls/{video_id}/"
    local_dir = local_dir.resolve()

    for path in iter_hls_files(local_dir):
        rel = path.relative_to(local_dir).as_posix()
        key = f"{base_prefix}{rel}"
        extra = {"ContentType": _content_type(path)}
        cache = (os.environ.get("HLS_S3_CACHE_CONTROL") or "").strip()
        if cache:
            extra["CacheControl"] = cache
        client.upload_file(str(path), bucket, key, ExtraArgs=extra)
