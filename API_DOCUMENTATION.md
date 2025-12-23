# LifeBridge API Documentation

## Overview

LifeBridge API is a RESTful API that powers the AI-driven cross-border mobility assistant. It provides endpoints for document upload, text extraction, intelligent analysis, and evidence-linked outputs.

**Base URL (Local):** `http://localhost:8000`  
**API Documentation:** `http://localhost:8000/docs` (Swagger UI)  
**Alternative Docs:** `http://localhost:8000/redoc` (ReDoc)

**Version:** 1.0.0  
**License:** MIT

---

## Authentication

Currently, the API is open (no authentication required). For production, implement:
- JWT-based authentication
- API keys
- OAuth 2.0

---

## Endpoints

### Health & Monitoring

#### `GET /health`

Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "components": {
    "database": "healthy",
    "storage": "healthy"
  }
}
```

**Status Codes:**
- `200 OK` - All systems healthy
- `503 Service Unavailable` - One or more components unhealthy

---

### Cases

#### `POST /cases`

Create a new case.

**Request Body:**
```json
{
  "title": "My Family Visit Case",
  "scenario": "family_reunion"
}
```

**Scenarios:**
- `family_reunion` - Family visit visa support
- `job_onboarding` - Cross-border employment
- `travel_support` - First-time travel assistance

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "My Family Visit Case",
  "scenario": "family_reunion",
  "summary": ""
}
```

**Status Codes:**
- `201 Created` - Case created successfully
- `400 Bad Request` - Invalid input
- `500 Internal Server Error` - Server error

---

#### `GET /cases`

List all cases with pagination.

**Query Parameters:**
- `skip` (int, optional, default=0) - Number of records to skip
- `limit` (int, optional, default=50) - Max records to return

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "My Case",
    "scenario": "family_reunion",
    "summary": "Generated summary..."
  }
]
```

---

#### `GET /cases/{case_id}`

Get details of a specific case.

**Path Parameters:**
- `case_id` (string, required) - Case UUID

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "My Case",
  "scenario": "family_reunion",
  "summary": "AI-generated summary of the case..."
}
```

**Status Codes:**
- `200 OK` - Case found
- `404 Not Found` - Case doesn't exist

---

#### `DELETE /cases/{case_id}`

Delete a case and all associated data.

**Path Parameters:**
- `case_id` (string, required) - Case UUID

**Response:** No content (204)

**Status Codes:**
- `204 No Content` - Successfully deleted
- `404 Not Found` - Case doesn't exist
- `500 Internal Server Error` - Deletion failed

---

#### `GET /cases/{case_id}/statistics`

Get statistics about a case.

**Path Parameters:**
- `case_id` (string, required) - Case UUID

**Response:**
```json
{
  "case_id": "550e8400-e29b-41d4-a716-446655440000",
  "documents": 3,
  "chunks": 45,
  "checklist_items": 5,
  "timeline_items": 4,
  "total_risks": 2,
  "risk_breakdown": {
    "high": 1,
    "medium": 1,
    "low": 0
  }
}
```

---

#### `GET /cases/{case_id}/export`

Export case data in various formats.

**Path Parameters:**
- `case_id` (string, required) - Case UUID

**Query Parameters:**
- `format` (string, optional, default="json") - Export format: `json` or `markdown`

**Response:** File download
- JSON: `application/json`
- Markdown: `text/markdown`

**Usage:**
```bash
# Export as JSON
curl http://localhost:8000/cases/{case_id}/export?format=json -o case.json

# Export as Markdown
curl http://localhost:8000/cases/{case_id}/export?format=markdown -o case.md
```

---

### Documents

#### `POST /cases/{case_id}/documents`

Upload a document for processing.

**Path Parameters:**
- `case_id` (string, required) - Case UUID

**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` (binary) - PDF or image file

**Supported Formats:**
- PDF (`application/pdf`)
- PNG (`image/png`)
- JPEG (`image/jpeg`, `image/jpg`)

**File Size Limit:** 10MB

**Response:**
```json
{
  "document_id": "abc123...",
  "chunks": 12,
  "filename": "passport.pdf",
  "size_mb": 1.5
}
```

**Status Codes:**
- `201 Created` - Document uploaded and processed
- `400 Bad Request` - Invalid file type
- `404 Not Found` - Case doesn't exist
- `413 Payload Too Large` - File exceeds 10MB
- `500 Internal Server Error` - Processing failed

**Process Flow:**
1. File uploaded to server
2. Stored in S3-compatible storage
3. Text extracted via OCR (images) or PDF parser
4. Text split into 600-character chunks
5. Chunks saved to database with evidence IDs

---

### Analysis

#### `POST /cases/{case_id}/analyze`

Analyze case documents and generate outputs.

**Path Parameters:**
- `case_id` (string, required) - Case UUID

**Response:**
```json
{
  "ok": true,
  "summary": "AI-generated summary...",
  "counts": {
    "checklist": 5,
    "timeline": 4,
    "risks": 2
  }
}
```

**Status Codes:**
- `200 OK` - Analysis completed
- `404 Not Found` - Case doesn't exist
- `500 Internal Server Error` - Analysis failed

**What It Does:**
1. Clears previous analysis outputs
2. Loads all text chunks from documents
3. Runs reasoning engine based on scenario
4. Generates checklist, timeline, and risks
5. Links each output to evidence chunks
6. Saves all outputs to database

---

#### `GET /cases/{case_id}/outputs`

Get all analysis outputs for a case.

**Path Parameters:**
- `case_id` (string, required) - Case UUID

**Response:**
```json
{
  "case": {
    "id": "...",
    "title": "...",
    "scenario": "...",
    "summary": "..."
  },
  "checklist": [
    {
      "id": "...",
      "label": "Collect passport copies",
      "status": "todo",
      "notes": "Ensure validity > 6 months",
      "evidence_chunk_ids": ["chunk-1", "chunk-2"]
    }
  ],
  "timeline": [
    {
      "id": "...",
      "label": "Submit application",
      "due_date": "2025-02-01",
      "owner": "user",
      "notes": "Complete all forms first",
      "evidence_chunk_ids": ["chunk-3"]
    }
  ],
  "risks": [
    {
      "id": "...",
      "category": "documentation",
      "severity": "high",
      "statement": "Missing birth certificate",
      "reason": "No birth document detected in uploads",
      "evidence_chunk_ids": []
    }
  ],
  "chunks": {
    "chunk-1": {
      "id": "chunk-1",
      "document_id": "doc-1",
      "idx": 0,
      "text": "Passport number P123456..."
    }
  }
}
```

**Status Codes:**
- `200 OK` - Outputs retrieved
- `404 Not Found` - Case doesn't exist

---

### Statistics

#### `GET /statistics`

Get global statistics across all cases.

**Response:**
```json
{
  "total_cases": 42,
  "total_documents": 156,
  "total_chunks": 2340,
  "cases_by_scenario": {
    "family_reunion": 25,
    "job_onboarding": 12,
    "travel_support": 5
  }
}
```

---

### Search

#### `GET /search`

Search cases by title or scenario.

**Query Parameters:**
- `q` (string, required, min_length=2) - Search query

**Response:**
```json
[
  {
    "id": "...",
    "title": "Family Visit to Canada",
    "scenario": "family_reunion",
    "summary": "..."
  }
]
```

**Status Codes:**
- `200 OK` - Search completed
- `422 Unprocessable Entity` - Query too short

**Usage:**
```bash
curl "http://localhost:8000/search?q=family"
```

---

### Demo

#### `POST /demo/preset`

Create a demo case with sample data.

**Response:**
```json
{
  "case_id": "...",
  "title": "Family Reunion (Demo)",
  "message": "Demo case created and analyzed successfully"
}
```

**Status Codes:**
- `201 Created` - Demo created
- `500 Internal Server Error` - Creation failed

**What It Does:**
1. Creates a case with title "Family Reunion (Demo)"
2. Adds sample invitation letter text
3. Splits into chunks
4. Runs analysis automatically
5. Returns case ID for immediate viewing

---

## Data Models

### Case

```json
{
  "id": "string (UUID)",
  "title": "string",
  "scenario": "string (enum)",
  "summary": "string",
  "created_at": "datetime"
}
```

### Checklist Item

```json
{
  "id": "string (UUID)",
  "label": "string",
  "status": "string (todo|in_progress|done)",
  "notes": "string",
  "evidence_chunk_ids": ["string"]
}
```

### Timeline Item

```json
{
  "id": "string (UUID)",
  "label": "string",
  "due_date": "string",
  "owner": "string",
  "notes": "string",
  "evidence_chunk_ids": ["string"]
}
```

### Risk

```json
{
  "id": "string (UUID)",
  "category": "string",
  "severity": "string (low|medium|high)",
  "statement": "string",
  "reason": "string",
  "evidence_chunk_ids": ["string"]
}
```

### Chunk

```json
{
  "id": "string (UUID)",
  "document_id": "string (UUID)",
  "idx": "integer",
  "text": "string"
}
```

---

## Error Handling

All errors follow this format:

```json
{
  "detail": "Error message describing what went wrong",
  "type": "error_type (optional)"
}
```

### Common Status Codes

| Code | Meaning | When It Happens |
|------|---------|----------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created |
| 204 | No Content | Resource deleted |
| 400 | Bad Request | Invalid input |
| 404 | Not Found | Resource doesn't exist |
| 413 | Payload Too Large | File too big |
| 422 | Unprocessable Entity | Validation failed |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | System unhealthy |

---

## Rate Limiting

Currently, no rate limiting is implemented. For production:
- Recommended: 100 requests/minute per IP
- Use middleware like `slowapi`
- Return `429 Too Many Requests` when exceeded

---

## CORS

CORS is configured via `CORS_ORIGINS` environment variable.

**Default:** `http://localhost:3000`

**Example:**
```bash
CORS_ORIGINS=https://app.example.com,https://www.example.com
```

---

## Logging

All requests are logged with:
- Method
- Path
- Status code
- Duration (ms)
- Client IP
- Error details (if any)

**Log Format:** Structured JSON logs via `structlog`

**Example:**
```json
{
  "event": "request_completed",
  "method": "POST",
  "path": "/cases/123/analyze",
  "status_code": 200,
  "duration_ms": 1523.45,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

---

## Performance

### Typical Response Times

| Endpoint | Average Time |
|----------|-------------|
| GET /health | < 10ms |
| POST /cases | < 50ms |
| GET /cases/{id} | < 30ms |
| POST /cases/{id}/documents | 2-8s (depends on OCR) |
| POST /cases/{id}/analyze | < 1s |
| GET /cases/{id}/outputs | < 100ms |

### Optimization Tips

1. **Batch Operations:** Upload multiple documents, then analyze once
2. **Caching:** Results are stored in DB, re-fetching is fast
3. **Async Processing:** Consider background jobs for large files
4. **CDN:** Serve static assets via CDN in production

---

## SDK Examples

### Python

```python
import requests

BASE_URL = "http://localhost:8000"

# Create case
response = requests.post(f"{BASE_URL}/cases", json={
    "title": "My Case",
    "scenario": "family_reunion"
})
case_id = response.json()["id"]

# Upload document
with open("passport.pdf", "rb") as f:
    response = requests.post(
        f"{BASE_URL}/cases/{case_id}/documents",
        files={"file": f}
    )

# Analyze
response = requests.post(f"{BASE_URL}/cases/{case_id}/analyze")

# Get outputs
response = requests.get(f"{BASE_URL}/cases/{case_id}/outputs")
outputs = response.json()
print(f"Checklist items: {len(outputs['checklist'])}")
```

### JavaScript/TypeScript

```typescript
const BASE_URL = "http://localhost:8000";

// Create case
const createResponse = await fetch(`${BASE_URL}/cases`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "My Case",
    scenario: "family_reunion"
  })
});
const { id: caseId } = await createResponse.json();

// Upload document
const formData = new FormData();
formData.append("file", fileInput.files[0]);
await fetch(`${BASE_URL}/cases/${caseId}/documents`, {
  method: "POST",
  body: formData
});

// Analyze
await fetch(`${BASE_URL}/cases/${caseId}/analyze`, { method: "POST" });

// Get outputs
const outputsResponse = await fetch(`${BASE_URL}/cases/${caseId}/outputs`);
const outputs = await outputsResponse.json();
console.log(`Checklist: ${outputs.checklist.length} items`);
```

### curl

```bash
# Create case
CASE_ID=$(curl -X POST http://localhost:8000/cases \
  -H "Content-Type: application/json" \
  -d '{"title":"My Case","scenario":"family_reunion"}' \
  | jq -r '.id')

# Upload document
curl -X POST http://localhost:8000/cases/$CASE_ID/documents \
  -F "file=@passport.pdf"

# Analyze
curl -X POST http://localhost:8000/cases/$CASE_ID/analyze

# Get outputs
curl http://localhost:8000/cases/$CASE_ID/outputs | jq '.'
```

---

## Deployment

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `CORS_ORIGINS` | Yes | Comma-separated allowed origins |
| `S3_ENDPOINT` | Yes | S3-compatible storage endpoint |
| `S3_BUCKET` | Yes | Bucket name |
| `S3_ACCESS_KEY` | Yes | S3 access key |
| `S3_SECRET_KEY` | Yes | S3 secret key |
| `S3_REGION` | No | AWS region (default: us-east-1) |
| `S3_PUBLIC_BASE_URL` | No | Public URL for file access |
| `OPENAI_API_KEY` | No | OpenAI key for enhanced reasoning |

### Production Checklist

- [ ] Set strong database password
- [ ] Configure production CORS origins
- [ ] Use managed PostgreSQL (Railway, AWS RDS)
- [ ] Use production S3 (AWS S3, Cloudflare R2)
- [ ] Enable HTTPS (use reverse proxy)
- [ ] Add authentication
- [ ] Implement rate limiting
- [ ] Set up monitoring (Sentry, DataDog)
- [ ] Configure log aggregation
- [ ] Enable database backups
- [ ] Add API versioning

---

## Support

- **API Documentation:** http://localhost:8000/docs
- **GitHub:** https://github.com/yourusername/lifebridge
- **Issues:** https://github.com/yourusername/lifebridge/issues

---

*Generated for LifeBridge v1.0.0 - Open Source AI-Powered Cross-Border Mobility Assistant*

