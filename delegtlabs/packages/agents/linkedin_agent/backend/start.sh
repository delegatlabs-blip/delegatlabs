#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
python -m app.db.migrate
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8005}"
