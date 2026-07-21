#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

export PYTHONPATH="${PYTHONPATH:-.}:."

uvicorn gateway.main:app --host "${HOST:-0.0.0.0}" --port "${PORT:-8000}" --reload
