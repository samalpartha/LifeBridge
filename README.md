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

The system follows a modern microservices-inspired architecture, separating core document processing from case management to ensure modularity and scalability.

```mermaid
graph TD
    User[User (Browser)]
    
    subgraph "Frontend Layer"
        NextJS[Next.js Web App<br/>(App Router)]
    end
    
    subgraph "Application Layer"
        CoreAPI[Core API<br/>(AI & Processing)]
        TrackerAPI[Tracker API<br/>(Case Management)]
    end
    
    subgraph "Data Persistence Layer"
        CoreDB[(Core DB<br/>Postgres)]
        TrackerDB[(Tracker DB<br/>Postgres)]
        ObjectStore[(MinIO<br/>S3 Object Storage)]
    end

    User -->|HTTPS| NextJS
    NextJS -->|REST / Analysis| CoreAPI
    NextJS -->|REST / CRUD| TrackerAPI
    
    CoreAPI -->|Metadata & Risks| CoreDB
    CoreAPI -->|Raw & Processed Files| ObjectStore
    
    TrackerAPI -->|Case Data & History| TrackerDB
    TrackerAPI -->|Linked Documents| ObjectStore
```

## Tech Stack Overview

LifeBridge is built with a robust, type-safe, and scalable stack designed for reliability and developer experience.

### 🎨 Frontend (Web)
*   **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Components)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **State/Data**: React Hooks, SWR (stale-while-revalidate)
*   **Animations**: Framer Motion (for smooth interactions)

### 🧠 Backend Services
*   **Core API (Python)**:
    *   **Framework**: FastAPI
    *   **OCR**: PyTesseract / PDFPlumber
    *   **Processing**: LangChain (for text splitting/chunking)
    *   **Validation**: Pydantic
*   **Tracker API (Python)**:
    *   **Framework**: FastAPI
    *   **ORM**: SQLAlchemy
    *   **Schema**: Pydantic

### 💾 Data & Infrastructure
*   **Databases**: PostgreSQL 16 (Relational Data)
*   **Storage**: MinIO (Local S3-compatible Object Storage)
*   **Containerization**: Docker & Docker Compose
*   **Routing**: Nginx (optional/production)

## Key Features & Details

### 1. Intelligent Document Processing
LifeBridge doesn't just store files; it "reads" them.
*   **OCR & Extraction**: Automatically extracts text from scanned PDFs and images.
*   **Chunking & Indexing**: Breaks down complex legal documents into manageable chunks for analysis.
*   **Risk Detection**: Identifies potential red flags (e.g., missing dates, inconsistent names) based on deterministic rules.

### 2. Comprehensive Case Management
A dedicated "Tracker" module acts as the system of record for the user's immigration journey.
*   **Case Spine**: Centralizes all events, documents, and tasks under a specific Case ID (e.g., "Spouse Visa").
*   **Timeline View**: Visualizes the entire history of a case, from filing to decision.
*   **Linked Artifacts**: Uploaded documents are strictly linked to specific cases for organized retrieval.

### 3. Accessible User Experience
*   **Voice Support**: Integrated auditory playback for case summaries and plans, making the app accessible to users with visual impairments or reading difficulties.
*   **Interactive Maps**: Direct integration with mapping services to help users locate nearby Embassies and Consulates.
*   **Multi-language Support**: Seamless toggle between English and Spanish to support diverse user bases.

## Quickstart

### 1) Prerequisites

- Docker and Docker Compose installed
- Ports 3000, 8000, 3100, 5432, 5433, 9000, 9001 available

### 2) Start the Application

From repo root:

```bash
docker compose up --build
```

Wait 30-60 seconds for all services to initialize.

### 3) Access the Application

- **Web UI**: http://localhost:3000
- **Core API docs**: http://localhost:8000/docs
- **Tracker API docs**: http://localhost:3100/docs
- **MinIO Console**: http://localhost:9001 (login: minio / minio12345)

### 4) Try the Demo

1. Open http://localhost:3000
2. Click **"Run demo preset"**
3. View the generated checklist, timeline, and risks
4. Click **"Why"** on any item to see evidence

### 5) Stop the Application

```bash
docker compose down
```

## Environment variables

For local dev via docker-compose, defaults are provided in the `docker-compose.yml`.

## Repo structure

- `apps/web`: Next.js frontend application
- `apps/api`: Core Python/FastAPI service (Document Analysis)
- `apps/tracker-api`: Tracker Python/FastAPI service (Case Management)
- `apps/docgen`: Document generation service
- `data`: Local volume data for Postgres and MinIO
- `docs`: Documentation and architecture notes

## License

MIT. See `LICENSE`.
