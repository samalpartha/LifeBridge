# LifeBridge - Quick Start Guide

## Prerequisites

- Docker and Docker Compose installed
- Ports 3000, 8000, 5432, 9000, and 9001 available

## Start the Application

From the repository root:

```bash
docker compose up --build
```

This will start:
- **PostgreSQL** database on port 5432
- **MinIO** object storage on ports 9000 (API) and 9001 (Console)
- **FastAPI** backend on port 8000
- **Next.js** frontend on port 3000

## Access the Application

- **Web UI**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001 (login: minio / minio12345)

## Try the Demo

1. Open http://localhost:3000
2. Click **"Run demo preset"** button
3. You'll see a pre-populated case with:
   - Checklist items
   - Timeline items
   - Risk register
   - Evidence links (click "Why" to see source text)

## Upload Your Own Documents

1. Click **"Create case"** on the home page
2. Choose a scenario (family reunion, job onboarding, or travel support)
3. Click **"Create case"**
4. Upload a PDF or image file
5. The system will:
   - Extract text using OCR
   - Chunk the content
   - Generate a checklist, timeline, and risks
   - Link each item to evidence

## Supported File Types

- PDF documents (text-based or scanned)
- Images (PNG, JPEG, JPG)
- OCR is performed automatically on images and scanned PDFs

## Stop the Application

```bash
docker compose down
```

To remove all data (database and uploaded files):

```bash
docker compose down -v
rm -rf data/
```

## Troubleshooting

### Services not starting

Wait 30-60 seconds for all services to initialize. The API waits for the database to be ready.

### Port conflicts

If ports are in use, edit `docker-compose.yml` to change the port mappings.

### MinIO bucket not created

The `minio-init` service creates the bucket automatically. Check logs:

```bash
docker compose logs minio-init
```

### API errors

Check API logs:

```bash
docker compose logs api
```

### Frontend not loading

Check web logs:

```bash
docker compose logs web
```

## Development Mode

To run services individually:

### Backend only

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Set environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`

### Frontend only

```bash
cd apps/web
npm install
npm run dev
```

Set environment variable:
- `NEXT_PUBLIC_API_BASE=http://localhost:8000`

## Architecture

```
┌─────────────┐
│   Next.js   │  Port 3000
│   Frontend  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   FastAPI   │  Port 8000
│   Backend   │
└──────┬──────┘
       │
       ├──────────────┐
       ▼              ▼
┌─────────────┐  ┌─────────────┐
│  PostgreSQL │  │    MinIO    │
│  Database   │  │   Storage   │
└─────────────┘  └─────────────┘
```

## Features

1. **Document Upload**: PDF and image support
2. **OCR Extraction**: Tesseract for scanned documents
3. **Text Chunking**: Splits content into manageable pieces
4. **Reasoning Engine**: Generates checklist, timeline, and risks
5. **Evidence Linking**: Each output item links to source chunks
6. **Multiple Scenarios**: Family reunion, job onboarding, travel support

## Next Steps

- Add your OpenAI API key to enable enhanced reasoning (optional)
- Deploy to Railway (see `infra/railway/README.md`)
- Customize scenarios in `apps/api/app/services/reason.py`
- Extend the UI in `apps/web/app/`

## License

MIT - See LICENSE file

