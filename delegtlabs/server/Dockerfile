FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app \
    AGENTS_DIR=/app/packages/agents

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Build context is the monorepo root (delegtlabs/)
COPY server/pyproject.toml /app/pyproject.toml
COPY server/README.md /app/README.md
COPY server/shared /app/shared
COPY server/admin /app/admin
COPY server/user /app/user
COPY server/web /app/web
COPY server/gateway /app/gateway
COPY server/alembic /app/alembic
COPY server/alembic.ini /app/alembic.ini
COPY server/tests /app/tests
COPY server/scripts /app/scripts
COPY server/worker_main.py /app/worker_main.py
COPY packages /app/packages

RUN pip install --upgrade pip && pip install -e .

EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && uvicorn gateway.main:app --host 0.0.0.0 --port 8000"]
