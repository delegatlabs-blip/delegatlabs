FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml /app/pyproject.toml
COPY README.md /app/README.md
COPY shared /app/shared
COPY admin /app/admin
COPY user /app/user
COPY web /app/web
COPY gateway /app/gateway
COPY alembic /app/alembic
COPY alembic.ini /app/alembic.ini
COPY tests /app/tests
COPY scripts /app/scripts

RUN pip install --upgrade pip && pip install -e .

EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && uvicorn gateway.main:app --host 0.0.0.0 --port 8000"]
