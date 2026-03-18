# LifeBridge Deployment Guide

## Deployment Options

### Option 1: Google Cloud Run (Production)

LifeBridge is deployed as four Cloud Run services.

| Service | Source | URL |
|---------|--------|-----|
| Frontend | `apps/web` | [lifebridge-web](https://lifebridge-web-365415503294.us-central1.run.app) |
| Core API | `apps/api` | [lifebridge-api](https://lifebridge-api-365415503294.us-central1.run.app) |
| Tracker API | `apps/tracker-api` | [lifebridge-tracker](https://lifebridge-tracker-365415503294.us-central1.run.app) |
| Docgen API | `apps/docgen` | [lifebridge-docgen](https://lifebridge-docgen-365415503294.us-central1.run.app) |

#### Deploy API

```bash
gcloud run deploy lifebridge-api \
  --source apps/api \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "CORS_ORIGINS=*,GRADIENT_RUNTIME_MODE=live,SECRET_KEY=$(openssl rand -hex 32),POSTGRES_PASSWORD=$(openssl rand -hex 16)"
```

#### Deploy Tracker

```bash
gcloud run deploy lifebridge-tracker \
  --source apps/tracker-api \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "CORS_ORIGINS=*"
```

#### Deploy Docgen

```bash
gcloud run deploy lifebridge-docgen \
  --source apps/docgen \
  --region us-central1 \
  --allow-unauthenticated
```

#### Deploy Frontend

```bash
gcloud run deploy lifebridge-web \
  --source apps/web \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NEXT_PUBLIC_API_URL=https://lifebridge-api-365415503294.us-central1.run.app,TRACKER_API_URL=https://lifebridge-tracker-365415503294.us-central1.run.app,DOCGEN_API_URL=https://lifebridge-docgen-365415503294.us-central1.run.app"
```

### Option 2: Docker Compose (Local / VPS)

```bash
cp .env.example .env
# Fill in Gradient credentials for live mode
docker compose up --build
```

For a VPS deployment add a reverse proxy (Caddy or Nginx) in front for SSL:

```
yourdomain.com {
    reverse_proxy web:3000
}

api.yourdomain.com {
    reverse_proxy api:8000
}
```

### Option 3: Local Dev Ports (Demo)

```bash
# Terminal 1: Core API
CORS_ORIGINS=http://localhost:3009,http://127.0.0.1:3009 \
./.venv/bin/python -m uvicorn app.main:app --app-dir apps/api --host 127.0.0.1 --port 8009 --reload

# Terminal 2: Tracker API
cd apps/tracker-api
DATABASE_URL="sqlite:///./tracker.db" ../../.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 3100 --reload

# Terminal 3: Frontend
cd apps/web
NEXT_PUBLIC_API_URL=http://127.0.0.1:8009 npm run dev -- -p 3009
```

## Environment Variables Reference

### API Service

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `CORS_ORIGINS` | Yes | Allowed origins (comma-separated) |
| `SECRET_KEY` | Yes | Application secret (non-default in production) |
| `GRADIENT_RUNTIME_MODE` | No | `live`, `mock`, or `auto` |
| `GRADIENT_AGENT_ENDPOINT` | For live | DigitalOcean Gradient agent URL |
| `GRADIENT_AGENT_ACCESS_KEY` | For live | Gradient agent access key |

### Web Service

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Core API base URL |
| `TRACKER_API_URL` | No | Tracker API URL (for rewrites) |
| `DOCGEN_API_URL` | No | Docgen API URL (for rewrites) |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | No | Google Maps API key |

## Post-Deployment Checklist

- [ ] All four services return healthy status
- [ ] `GET /crisis/runtime/live-check` reports `ok: true`
- [ ] Frontend pages load without errors
- [ ] Frontend API rewrites proxy to backend services
- [ ] Gradient agent query returns sources and trace ID

## Health Checks

```bash
# Core API
curl https://lifebridge-api-365415503294.us-central1.run.app/health

# Tracker
curl https://lifebridge-tracker-365415503294.us-central1.run.app/health

# Docgen
curl https://lifebridge-docgen-365415503294.us-central1.run.app/health

# Frontend
curl -o /dev/null -w "%{http_code}" https://lifebridge-web-365415503294.us-central1.run.app
```

## Security Checklist

- [ ] Use strong, non-default `SECRET_KEY` and `POSTGRES_PASSWORD`
- [ ] Enable SSL/TLS for all connections
- [ ] Restrict CORS to specific domains in production
- [ ] Use environment variables for secrets (never commit)
- [ ] Setup rate limiting on API

## Support

For deployment issues:
1. Check service logs: `gcloud run services logs read <service-name>`
2. Review this guide
3. Open a GitHub issue: https://github.com/samalpartha/LifeBridge/issues
