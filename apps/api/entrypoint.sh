#!/bin/bash
set -e

echo "Waiting for database..."
until python -c "import psycopg; psycopg.connect('$DATABASE_URL')" 2>/dev/null; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is up - starting application"
exec uvicorn app.main:app --host 0.0.0.0 --port 8000

