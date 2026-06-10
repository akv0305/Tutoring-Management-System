#!/bin/sh
set -e

echo "==> Running Prisma migrations..."
npx prisma migrate deploy 2>&1 || echo "⚠ Migration failed — check logs"

echo "==> Starting Next.js server..."
exec node server.js
