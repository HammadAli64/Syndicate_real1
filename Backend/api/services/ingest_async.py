"""Run mindset ingest outside the HTTP request (avoids Railway/proxy timeouts on admin upload)."""
from __future__ import annotations

import logging
import threading

from django.db import close_old_connections, transaction

logger = logging.getLogger(__name__)


def schedule_ingest_after_commit(document_id: int) -> None:
    """After the current DB transaction commits, ingest in a daemon thread (closes DB conn per thread)."""

    def _work() -> None:
        close_old_connections()
        try:
            from api.models import UploadedDocument
            from api.views import run_ingest

            doc = UploadedDocument.objects.get(pk=document_id)
            ok, _data, err = run_ingest(doc)
            if ok:
                logger.info("ingest_async: ok document_id=%s", document_id)
            else:
                logger.warning("ingest_async: failed document_id=%s err=%s", document_id, err)
        except Exception:
            logger.exception("ingest_async: crashed document_id=%s", document_id)
        finally:
            close_old_connections()

    transaction.on_commit(lambda: threading.Thread(target=_work, daemon=True).start())
