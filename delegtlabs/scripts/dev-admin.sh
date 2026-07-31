#!/usr/bin/env bash
# Hot-reload admin in Docker (no rebuild on every UI change).
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build admin
