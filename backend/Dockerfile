# syntax=docker/dockerfile:1.7

# --- Stage 1: builder ---------------------------------------------------------
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Build deps required for psycopg, cryptography wheels, etc.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /src

# Copy project metadata + source so `pip install .` can resolve the package.
COPY pyproject.toml ./
COPY anvaya ./anvaya
COPY apps ./apps
COPY manage.py ./

# Install the project and its dependencies into a self-contained tree.
RUN pip install --target=/install .

# Collect static files using the builder's installed deps.
# STATIC_ROOT is derived from BASE_DIR (no env required) so this is safe.
ENV PYTHONPATH=/install
RUN DJANGO_SETTINGS_MODULE=anvaya.settings.base \
    DJANGO_SECRET_KEY=collectstatic-dummy-key-not-used-at-runtime \
    python manage.py collectstatic --noinput

# --- Stage 2: runtime ---------------------------------------------------------
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Runtime libs only (libpq for psycopg).
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libpq5 \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system anvaya \
    && useradd --system --gid anvaya --home-dir /app --shell /usr/sbin/nologin anvaya

WORKDIR /app

# Make /app writable by anvaya. WORKDIR creates the dir as root:root,
# but gunicorn 23+ writes a control-server socket to $HOME/.gunicorn,
# and $HOME == /app for this user. Without this chown, every boot logs
# "Control server error: [Errno 13] Permission denied: '/app/.gunicorn'".
RUN chown anvaya:anvaya /app

# Bring installed packages and their console scripts into the runtime image.
COPY --from=builder /install /usr/local/lib/python3.12/site-packages
COPY --from=builder /install/bin/ /usr/local/bin/

# Application source.
COPY --chown=anvaya:anvaya anvaya ./anvaya
COPY --chown=anvaya:anvaya apps ./apps
COPY --chown=anvaya:anvaya manage.py ./
COPY --chown=anvaya:anvaya pyproject.toml ./
COPY --chown=anvaya:anvaya entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Collected static from the builder stage.
COPY --from=builder --chown=anvaya:anvaya /src/staticfiles ./staticfiles

USER anvaya

EXPOSE 8000

# Entrypoint runs migrate, then execs gunicorn. Render's dockerCommand
# overrides CMD/ENTRYPOINT, so render.yaml MUST NOT set dockerCommand for
# this entrypoint to take effect.
ENTRYPOINT ["./entrypoint.sh"]
