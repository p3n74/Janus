#!/bin/sh
set -eu

cd /app/packages/db
bunx drizzle-kit migrate

cd /app/apps/server
exec bun src/index.ts
