# LifeBridge

LifeBridge is a crisis navigation and reunification platform built for the **DigitalOcean Gradient AI Hackathon**.

Repository: [https://github.com/samalpartha/LifeBridge](https://github.com/samalpartha/LifeBridge)

## Hackathon Submission Focus

**One-line pitch:** Move people in crisis to safer nearby options with live AI guidance, risk-aware routes, and family reunification support.

**Judge-facing value:**
- Crisis-first flow (`/crisis-home` -> `/crisis`) optimized for urgent action
- Live DigitalOcean Gradient runtime with retrieval and traceable tool calls
- Real-time nearby intelligence + operational fallback for resilience
- End-to-end workflows: havens, routes, check-ins, beacons, and help matching

## DigitalOcean Gradient Implementation

LifeBridge uses Gradient in live mode through a DigitalOcean Agent endpoint.

- Live runtime status: `GET /crisis/runtime`
- Live connectivity probe: `GET /crisis/runtime/live-check`
- Agent orchestration query: `POST /crisis/agent/query`
- Retrieval-aware sources and persisted traces
- Runtime modes:
  - `live`: strict live DigitalOcean mode
  - `mock`: deterministic local fallback
  - `auto`: live when configured, fallback otherwise

Core implementation:
- `apps/api/app/services/gradient_ai.py`
- `apps/api/app/api/crisis.py`
- `apps/api/app/services/crisis_kb_content.py`
- `apps/api/app/services/evaluations.py`

## What Is Implemented

- Crisis command center pages:
  - `/crisis-home` (overview and launch)
  - `/crisis` (live operations console)
- Safe haven search with verification + service metadata
- Route generation with risk-aware options
- Safety check-ins with idempotency behavior
- Family reunification beacons (`create`, `lookup`, `update`)
- Nearby help request/offer matching
- Tracker workspace for case continuity (tasks, notes, history, documents)
- Knowledge and help surfaces integrated with live runtime indicators

## Architecture

- Frontend: Next.js (`apps/web`)
- Core API: FastAPI (`apps/api`)
- Tracker API: FastAPI (`apps/tracker-api`)
- Doc generation service: FastAPI (`apps/docgen`)
- Storage layer: PostgreSQL + object storage compatible pattern

## Quick Start

### Option A: Docker

```bash
cp .env.example .env
# Fill Gradient credentials for live mode
docker compose up --build
```

### Option B: Local ports (recommended for demo)

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

## Required Environment Variables (Live Gradient)

Configure one of these live paths:

- Endpoint mode:
  - `GRADIENT_AGENT_ENDPOINT`
  - `GRADIENT_AGENT_ACCESS_KEY`
- SDK mode:
  - `GRADIENT_ACCESS_TOKEN`
  - `GRADIENT_WORKSPACE_ID`

Additional runtime:

```env
GRADIENT_RUNTIME_MODE=live
GRADIENT_AGENT_ID=
GRADIENT_KNOWLEDGE_BASE_ID=
GRADIENT_DEFAULT_RETRIEVAL_K=8
GRADIENT_SUB_QUERY_RETRIEVAL_K=12
```

## Demo Verification Checklist

1. Open `http://localhost:3009/crisis-home`
2. Launch Crisis Mode and verify live indicators on `/crisis`
3. Call live runtime probe: `http://127.0.0.1:8009/crisis/runtime/live-check`
4. Create beacon and open `/reunion/{code}`
5. Submit help request + offer and verify nearby matching
6. Open tracker pages and confirm data persists in `tracker.db`

## Testing

```bash
# Core API tests
cd apps/api && ../../.venv/bin/pytest tests -q

# Tracker API tests
cd apps/tracker-api && ../../.venv/bin/pytest tests -q

# Docgen tests
cd apps/docgen && ../../.venv/bin/pytest tests -q

# Frontend build and smoke
cd apps/web
npm run build
npx playwright test tests/smoke.spec.ts
```

## Important API Endpoints

All crisis endpoints are under `/crisis`:
- `GET /runtime`
- `GET /runtime/live-check`
- `POST /havens`
- `GET /havens/search`
- `POST /routes/generate`
- `POST /checkins`
- `POST /beacons`
- `GET /beacons/{beacon_code}`
- `POST /help/requests`
- `GET /help/requests/nearby`
- `POST /help/offers`
- `GET /help/offers/nearby`
- `POST /agent/query`
- `GET /traces`

## Links

- GitHub: [https://github.com/samalpartha/LifeBridge](https://github.com/samalpartha/LifeBridge)
- API docs (local): `http://127.0.0.1:8009/docs`
- Tracker docs (local): `http://127.0.0.1:3100/docs`

## License

MIT (`LICENSE`)
