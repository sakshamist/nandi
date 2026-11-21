#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "Building and starting services..."
docker-compose up -d --build

echo "Waiting for PostgreSQL..."
until docker-compose exec -T postgres pg_isready -U nandi -d nandi >/dev/null 2>&1; do
  sleep 2
done

echo "Applying database migrations..."
docker-compose exec -T app npx prisma migrate deploy

echo "Seeding baseline data..."
docker-compose exec -T app npm run db:seed

echo "Ingesting knowledge documents..."
docker-compose exec -T app npm run docs:ingest -- --dir /app/knowledge

echo "Deployment complete. Configure DNS for nandi.surelm.com to point to this server."
docker-compose ps
