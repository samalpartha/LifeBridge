#!/bin/bash
set -e

echo "Waiting for database..."
until python -c "import os, psycopg; psycopg.connect(os.environ.get('DATABASE_URL').replace('+psycopg', ''))" 2>/dev/null; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is up - starting application"
exec uvicorn app.main:app --host 0.0.0.0 --port 8000

