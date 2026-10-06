#!/bin/sh
set -eu

cd /app
bun run db:push
bun run --cwd packages/db seed-admin || true
exec bun run --cwd apps/server src/index.ts
