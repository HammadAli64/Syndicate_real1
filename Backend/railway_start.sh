#!/bin/sh
# Railway/Nixpacks: use this as the only web start command (nixpacks.toml [start] + railway.toml).
# If migrations still do not apply, clear any custom "Start Command" in the Railway service settings.
set -eu
cd "$(dirname "$0")"
PORT="${PORT:-8080}"

if [ -z "${DATABASE_URL:-}" ] && [ -z "${DATABASE_PRIVATE_URL:-}" ] && [ -z "${DATABASE_PUBLIC_URL:-}" ] && [ -z "${PGHOST:-}" ]; then
  echo "railway_start: WARNING: no Postgres env; Django may use SQLite for migrate."
fi

mkdir -p staticfiles
echo "railway_start: migrate (shell)"
python manage.py migrate --noinput --verbosity 1
echo "railway_start: collectstatic"
python manage.py collectstatic --noinput
echo "railway_start: ensure_superuser (if DJANGO_SUPERUSER_* set)"
python manage.py ensure_superuser
echo "railway_start: gunicorn --preload (migrations also run in wsgi.py)"
exec python -m gunicorn syndicate_backend.wsgi:application --bind "0.0.0.0:${PORT}" --workers 2 --threads 4 --timeout 300 --preload
