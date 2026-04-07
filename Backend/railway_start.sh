#!/bin/sh
set -eu

cd "$(dirname "$0")"
PORT="${PORT:-8080}"

echo "railway_start: installing requirements"
pip install -r requirements.txt

if [ -z "${DATABASE_URL:-}" ] && [ -z "${DATABASE_PRIVATE_URL:-}" ] && [ -z "${DATABASE_PUBLIC_URL:-}" ] && [ -z "${PGHOST:-}" ]; then
  echo "railway_start: WARNING: no Postgres env; Django may use SQLite for migrate."
fi

mkdir -p staticfiles

echo "railway_start: collectstatic (clear + rebuild)"
python manage.py collectstatic --noinput --clear

echo "railway_start: migrate"
python manage.py migrate --noinput --verbosity 1

echo "railway_start: ensure_superuser"
python manage.py ensure_superuser

echo "railway_start: gunicorn"
exec python -m gunicorn syndicate_backend.wsgi:application \
  --bind "0.0.0.0:${PORT}" \
  --workers 2 \
  --threads 4 \
  --timeout 300 \
  --preload
