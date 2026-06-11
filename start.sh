#!/bin/sh
set -e

echo "==> Running Prisma migrations..."
prisma migrate deploy --schema=./prisma/schema.prisma 2>&1 || echo "⚠ Migration failed — check logs"

echo "==> Starting Next.js server..."
exec node server.js
