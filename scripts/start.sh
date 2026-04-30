#!/bin/bash
# scripts/start.sh — Production startup for Render
set -e

echo "🚀 Starting BrandPoster AI..."

# On Render, persistent disk is mounted at /data
# Set the SQLite database to the persistent disk
if [ "$NODE_ENV" = "production" ] && [ -d "/data" ]; then
  export DATABASE_URL="file:/data/production.db"
  echo "✅ Using persistent disk database: $DATABASE_URL"
fi

# Run Prisma migrations / push schema
echo "📦 Running database migrations..."
npx prisma db push --accept-data-loss

# Seed campaign templates if needed
echo "🌱 Seeding campaign templates..."
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts 2>/dev/null || echo "⚠️  Seed skipped (ts-node not available, templates may already exist)"

# Ensure upload directories exist
mkdir -p public/uploads public/generated
echo "📁 Storage directories ready"

# Start Next.js
echo "🎯 Starting Next.js server..."
exec node .next/standalone/server.js
