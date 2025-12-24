# LifeBridge

LifeBridge is an end-to-end, open-source prototype that helps people navigate cross-border mobility. It turns documents and a short intake into a clear checklist, timeline, and risk register, with evidence-linked citations.

## What this build includes

- A web app (Next.js) that guides the user through intake, upload, and results.
- A Python API (FastAPI) that runs OCR, extraction, and reasoning.
- A Postgres database for cases, documents, chunks, decisions, risks, and timeline items.
- S3-compatible object storage for uploaded files (local MinIO in development).
- A demo preset called "Family Reunion" to make judging fast.
- **New**: Voice Support (listen to plans).
- **New**: Location Intelligence (Find Embassies on Map).
- **New**: Multi-language Support (English/Spanish toggle).

## Target Audience

LifeBridge is built for anyone navigating complex immigration bureaucracies:

- **Students**: Managing F-1 visas, OPT applications, and university admissions.
- **Professionals**: Tracking H-1B, O-1, or Green Card timelines and employer documents.
- **Global Citizens**: Digital nomads and travelers organizing visas and travel history.
- **Families**: Coordinating marriage-based adjustments or sponsoring relatives.

## User Journeys

The application supports three core workflows:

1.  **Discovery**: Users start with the **Checklist** wizard to identify their specific path and requirements.
2.  **Management**: Users convert checklist steps into **Tasks**, track their **Case Status**, and maintain a digital **Vault** of verified documents.
3.  **Support**: Users can locate embassies via the **Map** or connect with verified **Attorneys** for legal assistance.

## Architecture

- Web: Next.js (TypeScript)
- API: FastAPI (Python)
- DB: Postgres
- Storage: S3-compatible (MinIO locally, Cloudflare R2 or AWS S3 in prod)

Data flow:
1. Web uploads a file to the API.
2. API stores the raw file in object storage and writes metadata to Postgres.
3. API extracts text, splits it into chunks, and stores chunk IDs.
4. API produces checklist items, timeline items, and risks, each with chunk IDs as evidence.
5. Web renders results and shows "Why" with evidence snippets.

## Meaningful AI

LifeBridge uses AI in a way that is visible and testable:
- OCR for images and scanned PDFs.
- Entity extraction into a normalized schema.
- Conflict and missing-item detection.
- Risk register generation with reasons.
- Evidence-linked citations to extracted text chunks.
- **Voice Interaction**: Auditory playback of case summaries.
- **Geospatial Context**: Visual mapping of embassy locations.
- **Global Reach**: Instant localization (i18n).

This prototype ships with a deterministic rules layer so the demo stays stable. If you set an LLM key, the reasoning step becomes more adaptive and will ask targeted follow-up questions when confidence drops.

## Quickstart

### 1) Prerequisites

- Docker and Docker Compose installed
- Ports 3000, 8000, 5432, 9000, 9001 available

### 2) Start the Application

From repo root:

```bash
docker compose up --build
```

Wait 30-60 seconds for all services to initialize.

### 3) Access the Application

- **Web UI**: http://localhost:3000
- **API docs**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001 (login: minio / minio12345)

### 4) Try the Demo

1. Open http://localhost:3000
2. Click **"Run demo preset"**
3. View the generated checklist, timeline, and risks
4. Click **"Why"** on any item to see evidence

### 5) Upload Your Own Documents

1. Click **"Start a new case"** on the home page
2. Choose a scenario and create the case
3. Upload a PDF or image file
4. View the generated outputs with evidence links

### 6) Stop the Application

```bash
docker compose down
```

## Environment variables

For local dev via docker-compose, defaults are provided. For a hosted deployment:

API:
- DATABASE_URL
- S3_ENDPOINT
- S3_BUCKET
- S3_ACCESS_KEY
- S3_SECRET_KEY
- S3_REGION (optional)
- S3_PUBLIC_BASE_URL (optional)
- OPENAI_API_KEY (optional)

Web:
- NEXT_PUBLIC_API_BASE_URL

## Deploy on Railway

Railway works well for:
- Postgres
- FastAPI service

Suggested deployment:
- Railway project with a Postgres plugin.
- API deployed as a Railway service.
- Web deployed on Vercel (fastest) or as a second Railway service.

See `infra/railway/RAILWAY.md`.

## Repo structure

- `apps/web` Next.js UI
- `apps/api` FastAPI service
- `packages/core` shared types and scoring helpers
- `infra/db` database notes
- `infra/railway` Railway deployment notes
- `samples/cases` demo presets
- `docs/ROADMAP.md` future vision and scalability plan
- `docs` extra documentation

## License

MIT. See `LICENSE`.

## Advanced Setup

For development without Docker, see `QUICKSTART.md` for detailed instructions on running services individually.

## License

MIT. See `LICENSE`.
