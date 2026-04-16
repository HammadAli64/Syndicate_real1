#!/bin/sh
set -eu

cd "$(dirname "$0")"

echo "celery_worker_start: installing requirements"
pip install -r requirements.txt

echo "celery_worker_start: starting Celery worker (HLS pipeline)"
exec celery -A syndicate_backend worker \
  --loglevel="${CELERY_LOG_LEVEL:-info}" \
  --concurrency="${CELERY_CONCURRENCY:-1}" \
  --max-tasks-per-child="${CELERY_MAX_TASKS_PER_CHILD:-5}"
