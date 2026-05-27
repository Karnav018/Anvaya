#!/bin/sh
# Container entrypoint: run pending migrations, then exec gunicorn.
# `exec` replaces the shell process so SIGTERM reaches gunicorn directly
# for graceful shutdown on container stop.

set -e

echo "[entrypoint] Running migrations..."
python manage.py migrate --noinput

PORT="${PORT:-8000}"
WORKERS="${GUNICORN_WORKERS:-3}"

echo "[entrypoint] Starting gunicorn on 0.0.0.0:${PORT} with ${WORKERS} workers..."
exec gunicorn anvaya.wsgi:application \
    --bind "0.0.0.0:${PORT}" \
    --workers "${WORKERS}" \
    --access-logfile - \
    --error-logfile -
