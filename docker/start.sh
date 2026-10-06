#!/bin/sh
set -eu

cd /app/packages/db
bunx prisma db push
bun run ./seed-admin.ts || true

cd /app/apps/server
exec bun src/index.ts
