# LifeBridge Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         USER BROWSER                         │
│                     http://localhost:3000                    │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ HTTP/REST
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      NEXT.JS FRONTEND                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Pages:                                               │  │
│  │  • Home (page.tsx) - Create case or demo             │  │
│  │  • Case Detail ([id]/page.tsx) - View outputs        │  │
│  │                                                        │  │
│  │  Features:                                            │  │
│  │  • File upload UI                                     │  │
│  │  • Output display (checklist/timeline/risks)         │  │
│  │  • Evidence viewer (click "Why")                     │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ HTTP/REST
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      FASTAPI BACKEND                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Endpoints:                                           │  │
│  │  POST /cases              - Create case               │  │
│  │  GET  /cases/{id}         - Get case                 │  │
│  │  POST /cases/{id}/documents - Upload document        │  │
│  │  POST /cases/{id}/analyze - Generate outputs         │  │
│  │  GET  /cases/{id}/outputs - Get all outputs          │  │
│  │  POST /demo/preset        - Create demo case         │  │
│  │                                                        │  │
│  │  Services:                                            │  │
│  │  • extract.py  - OCR & text extraction               │  │
│  │  • reason.py   - Reasoning engine                    │  │
│  │  • storage.py  - S3 file storage                     │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────┬────────────────────────────┬─────────────────┘
               │                            │
               │                            │
       ┌───────▼────────┐          ┌────────▼────────┐
       │   POSTGRESQL   │          │     MINIO       │
       │   DATABASE     │          │   (S3 STORAGE)  │
       │                │          │                 │
       │  Tables:       │          │  Bucket:        │
       │  • cases       │          │  • lifebridge   │
       │  • documents   │          │                 │
       │  • chunks      │          │  Files:         │
       │  • checklist   │          │  • uploads/     │
       │  • timeline    │          │    *.pdf        │
       │  • risks       │          │    *.jpg        │
       └────────────────┘          └─────────────────┘
```

## Data Flow

### 1. Case Creation Flow

```
User → Web UI → API → Database
                 │
                 └→ Creates Case record
```

### 2. Document Upload Flow

```
User selects file
    │
    ▼
Web UI (FormData)
    │
    ▼
API /cases/{id}/documents
    │
    ├─→ Store file in MinIO (S3)
    │   └─→ Returns storage_key
    │
    ├─→ Extract text (OCR/PDF)
    │   ├─→ Tesseract for images
    │   └─→ PyPDF for PDFs
    │
    ├─→ Chunk text (600 chars each)
    │
    └─→ Save to Database
        ├─→ Document record (metadata + storage_key)
        └─→ Chunk records (text + idx)
```

### 3. Analysis Flow

```
User clicks "Analyze"
    │
    ▼
API /cases/{id}/analyze
    │
    ├─→ Load all chunks from DB
    │
    ├─→ Run reasoning engine
    │   ├─→ Detect scenario
    │   ├─→ Find keywords in chunks
    │   ├─→ Generate checklist items
    │   ├─→ Generate timeline items
    │   └─→ Generate risk items
    │
    └─→ Save outputs to DB
        ├─→ ChecklistItem records (+ evidence_chunk_ids)
        ├─→ TimelineItem records (+ evidence_chunk_ids)
        └─→ Risk records (+ evidence_chunk_ids)
```

### 4. Evidence Display Flow

```
User clicks "Why" button
    │
    ▼
Web UI looks up chunk IDs
    │
    ▼
Displays chunk text from outputs.chunks
    │
    └─→ Shows: "Chunk {idx}: {text}"
```

## Component Details

### Frontend (Next.js)

**Technology Stack**:
- Next.js 15 (App Router)
- React 18
- TypeScript
- Server-side rendering disabled (client-side only)

**Key Components**:
- `page.tsx` - Home page with case creation and demo
- `case/[id]/page.tsx` - Case detail with outputs
- `api-client/client.ts` - API communication layer
- `Evidence` component - Shows chunk text

**State Management**:
- React useState for local state
- No global state (simple app)
- Fetch on mount, refresh after mutations

### Backend (FastAPI)

**Technology Stack**:
- FastAPI (Python web framework)
- SQLAlchemy (ORM)
- Pydantic (validation)
- psycopg (PostgreSQL driver)

**Key Modules**:

1. **main.py** - API routes and endpoints
2. **db/models.py** - SQLAlchemy models
3. **db/session.py** - Database connection
4. **db/init_db.py** - Table creation
5. **services/extract.py** - Text extraction
6. **services/reason.py** - Reasoning engine
7. **services/storage.py** - S3 abstraction
8. **schemas/case.py** - Pydantic schemas

### Database (PostgreSQL)

**Schema**:

```sql
cases
  - id (PK)
  - title
  - scenario
  - summary
  - created_at

documents
  - id (PK)
  - case_id (FK → cases)
  - filename
  - content_type
  - storage_key
  - created_at

chunks
  - id (PK)
  - case_id (FK → cases)
  - document_id (FK → documents)
  - idx (order)
  - text

checklist_items
  - id (PK)
  - case_id (FK → cases)
  - label
  - status
  - notes
  - evidence_chunk_ids (comma-separated)

timeline_items
  - id (PK)
  - case_id (FK → cases)
  - label
  - due_date
  - owner
  - notes
  - evidence_chunk_ids (comma-separated)

risks
  - id (PK)
  - case_id (FK → cases)
  - category
  - severity
  - statement
  - reason
  - evidence_chunk_ids (comma-separated)
```

### Storage (MinIO)

**Structure**:
```
lifebridge/              (bucket)
  uploads/
    {uuid}.pdf
    {uuid}.jpg
    {uuid}.png
```

**Access**:
- Internal: `http://minio:9000`
- External: `http://localhost:9000`
- Console: `http://localhost:9001`

## Service Dependencies

```
web → api → db
         → minio

minio-init → minio (creates bucket)
```

**Startup Order**:
1. PostgreSQL starts
2. MinIO starts
3. minio-init creates bucket
4. API starts (waits for DB)
5. Web starts

## API Endpoints

### Cases

```
POST /cases
  Body: { title, scenario }
  Returns: { id, title, scenario, summary }

GET /cases/{case_id}
  Returns: { id, title, scenario, summary }
```

### Documents

```
POST /cases/{case_id}/documents
  Body: multipart/form-data with file
  Returns: { document_id, chunks }
```

### Analysis

```
POST /cases/{case_id}/analyze
  Returns: { ok: true }

GET /cases/{case_id}/outputs
  Returns: {
    case: { ... },
    checklist: [ ... ],
    timeline: [ ... ],
    risks: [ ... ],
    chunks: { id: { text, ... }, ... }
  }
```

### Demo

```
POST /demo/preset
  Returns: { case_id }
```

## Text Processing Pipeline

### 1. Extraction

```python
def extract_text(content_type: str, data: bytes) -> ExtractResult:
    if "pdf" in content_type:
        text = extract_text_from_pdf(data)  # PyPDF
    elif "image" in content_type:
        text = extract_text_from_image(data)  # Tesseract OCR
    
    chunks = chunk_text(text, chunk_size=600)
    return ExtractResult(full_text=text, chunks=chunks)
```

### 2. Chunking

```python
def chunk_text(text: str, chunk_size: int = 600) -> List[str]:
    # Split text into 600-character chunks
    # Preserves context for evidence linking
    chunks = []
    for i in range(0, len(text), chunk_size):
        chunks.append(text[i:i+chunk_size])
    return chunks
```

### 3. Reasoning

```python
def build_reasoning(scenario: str, chunks: List[str]) -> ReasoningResult:
    # 1. Detect scenario-specific rules
    # 2. Search chunks for keywords
    # 3. Generate checklist items with evidence
    # 4. Generate timeline items with evidence
    # 5. Generate risk items with evidence
    # 6. Return structured output
```

## Evidence Linking

**How it Works**:

1. **During Analysis**:
   - Reasoning engine searches chunks for keywords
   - Records chunk indices where keywords found
   - Stores indices as comma-separated string

2. **In Database**:
   ```
   checklist_item.evidence_chunk_ids = "chunk-uuid-1,chunk-uuid-2"
   ```

3. **In API Response**:
   ```json
   {
     "checklist": [{
       "label": "Collect passport",
       "evidence_chunk_ids": ["chunk-uuid-1"]
     }],
     "chunks": {
       "chunk-uuid-1": {
         "id": "chunk-uuid-1",
         "idx": 0,
         "text": "Passport valid until 2026..."
       }
     }
   }
   ```

4. **In UI**:
   - User clicks "Why"
   - UI looks up chunk IDs in chunks map
   - Displays chunk text

## Scenarios

### Family Reunion
- Checklist: relationship proof, travel dates, context statement
- Risks: missing birth certificate, document expiration
- Timeline: confirm dates, review fields

### Job Onboarding
- Checklist: offer letter, role details, work authorization
- Risks: missing offer letter, incomplete employment docs
- Timeline: start date preparation, document collection

### Travel Support
- Checklist: identity documents, travel plans, insurance
- Risks: passport expiration, missing travel insurance
- Timeline: booking deadlines, visa applications

## Security

### Authentication
- Currently: None (prototype)
- Production: Add JWT or session-based auth

### Authorization
- Currently: All cases public
- Production: User-based access control

### Data Protection
- Passwords: Environment variables only
- Files: S3 with access controls
- Database: Network isolated in Docker

### CORS
- Development: `http://localhost:3000`
- Production: Specific domain only

## Scaling Considerations

### Horizontal Scaling

**API**:
- Stateless design
- Can add multiple replicas
- Use load balancer

**Database**:
- Use managed service (Railway, RDS)
- Connection pooling configured
- Read replicas for heavy read loads

**Storage**:
- S3/R2 scales automatically
- No changes needed

### Vertical Scaling

**API**:
- Increase CPU for OCR processing
- Increase memory for large files

**Database**:
- Increase storage for many documents
- Increase memory for query performance

### Caching

**Potential Additions**:
- Redis for session storage
- CDN for static assets
- API response caching

## Monitoring

### Health Checks

```bash
# API health
curl http://localhost:8000/health

# Database
docker compose exec db pg_isready

# MinIO
curl http://localhost:9000/minio/health/live
```

### Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f web
```

### Metrics to Track

- API response times
- Document processing time
- Database query performance
- Storage usage
- Error rates

## Development Workflow

### Local Development

1. **Backend**:
   ```bash
   cd apps/api
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

2. **Frontend**:
   ```bash
   cd apps/web
   npm install
   npm run dev
   ```

3. **Infrastructure**:
   ```bash
   docker compose up db minio
   ```

### Testing

1. **API Tests**: `./test_api.sh`
2. **Manual Tests**: See `TEST_PLAN.md`
3. **Integration Tests**: Upload real documents

### Deployment

1. **Staging**: Railway preview deployments
2. **Production**: Railway + Vercel
3. **Monitoring**: Sentry, DataDog

## Technology Choices

### Why FastAPI?
- Fast, modern Python framework
- Automatic API documentation
- Type hints and validation
- Async support for scalability

### Why Next.js?
- React with SSR/SSG capabilities
- Great developer experience
- Easy deployment to Vercel
- Built-in routing

### Why PostgreSQL?
- Reliable, mature database
- ACID compliance
- Good performance
- Wide hosting support

### Why MinIO?
- S3-compatible API
- Easy local development
- Can swap for real S3 in production
- Open source

## Future Enhancements

### Short Term
- [ ] Add user authentication
- [ ] Implement document versioning
- [ ] Add export to PDF
- [ ] Improve OCR accuracy

### Medium Term
- [ ] Add OpenAI integration
- [ ] Implement real-time collaboration
- [ ] Create mobile app
- [ ] Add document templates

### Long Term
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Integration with government APIs
- [ ] AI-powered document generation

---

**This architecture is designed for**:
- ✅ Easy local development
- ✅ Simple deployment
- ✅ Clear separation of concerns
- ✅ Horizontal scalability
- ✅ Maintainability

