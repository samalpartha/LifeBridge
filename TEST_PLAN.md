# LifeBridge Test Plan

## Pre-Testing Checklist

1. ✅ Docker and Docker Compose installed
2. ✅ Ports 3000, 8000, 5432, 9000, 9001 available
3. ✅ No conflicting services running

## Test Procedure

### 1. Start Services

```bash
cd /Users/psama0214/Hackathon-New/lifebridge
docker compose up --build
```

**Expected Output:**
- All services start without errors
- Database initializes tables
- MinIO creates bucket
- API starts on port 8000
- Web starts on port 3000

**Verify:**
```bash
# Check all services are running
docker compose ps

# Should show:
# - db (postgres:16) - Up
# - minio - Up
# - api - Up
# - web - Up
# - minio-init - Exited (0)
```

### 2. Test Health Endpoints

```bash
# API health check
curl http://localhost:8000/health
# Expected: {"ok":true}

# API docs
open http://localhost:8000/docs
# Expected: FastAPI Swagger UI loads
```

### 3. Test Demo Preset (Critical Path)

1. Open http://localhost:3000
2. Click **"Run demo preset"** button
3. Wait for redirect to case page

**Expected Results:**
- Case ID displayed
- Summary section shows text
- Checklist section shows 2-3 items
- Timeline section shows 1-2 items
- Risks section shows 1+ items
- Each item has a "Why" button
- Clicking "Why" shows evidence chunks

**Verify Evidence Links:**
- Click "Why" on any checklist item
- Should see chunk text with "Chunk 0", "Chunk 1", etc.
- Text should match demo content (passport, invitation, etc.)

### 4. Test Document Upload Flow

1. From home page, click **"Start a new case"**
2. Enter title: "Test Case"
3. Select scenario: "Family reunion"
4. Click **"Create case"**
5. Upload a test PDF or image file

**Test Files to Use:**
- Any PDF with text
- Any image with text (passport, letter, form)
- Scanned document

**Expected Results:**
- File uploads successfully
- "Working..." indicator shows
- Page refreshes with outputs
- Checklist, timeline, and risks generated
- Evidence links work

### 5. Test Re-analyze Feature

1. On a case page with documents
2. Click **"Re-analyze"** button

**Expected Results:**
- "Working..." indicator shows
- Outputs regenerate
- New checklist/timeline/risks appear
- Evidence links still work

### 6. Test Different Scenarios

Create cases with each scenario:
- Family reunion
- Cross-border job onboarding
- First-time travel support

**Expected Results:**
- Each scenario generates different checklist items
- Scenario-specific risks appear
- Evidence linking works for all scenarios

### 7. Test OCR Functionality

Upload an image file (PNG/JPEG) with text:

**Expected Results:**
- Text extracted from image
- Chunks created
- Outputs generated with evidence

### 8. Test Error Handling

**Test Invalid File:**
- Upload a non-PDF/non-image file
- Should handle gracefully

**Test Empty Case:**
- Create case without uploading documents
- Click "Re-analyze"
- Should complete without errors (may show generic outputs)

**Test Navigation:**
- Click "Back" button
- Should return to home page
- Create new case
- Should work normally

### 9. Test MinIO Storage

```bash
# Check MinIO console
open http://localhost:9001
# Login: minio / minio12345

# Verify:
# - Bucket "lifebridge" exists
# - Uploaded files appear in uploads/ folder
```

### 10. Test Database

```bash
# Connect to database
docker compose exec db psql -U lifebridge -d lifebridge

# Run queries:
\dt  # List tables
SELECT * FROM cases;
SELECT * FROM documents;
SELECT * FROM chunks;
SELECT * FROM checklist_items;
SELECT * FROM timeline_items;
SELECT * FROM risks;

# Verify:
# - All tables exist
# - Data is properly stored
# - Foreign keys work
```

## Performance Tests

### Load Test
- Create 5 cases
- Upload 3 documents each
- Verify all process correctly

### Concurrent Upload
- Upload multiple files in quick succession
- Verify all complete successfully

## Integration Tests

### API Integration
```bash
# Create case via API
curl -X POST http://localhost:8000/cases \
  -H "Content-Type: application/json" \
  -d '{"title":"API Test","scenario":"family_reunion"}'

# Should return case ID

# Get case
curl http://localhost:8000/cases/{case_id}

# Should return case details
```

### Storage Integration
- Upload file
- Check MinIO for file
- Verify storage_key in database matches MinIO object

### Database Integration
- Create case
- Upload document
- Analyze case
- Verify all tables populated correctly

## Cleanup

```bash
# Stop services
docker compose down

# Remove all data
docker compose down -v
rm -rf data/
```

## Known Issues to Check

1. ✅ OCR dependencies installed (tesseract, poppler)
2. ✅ MinIO bucket created automatically
3. ✅ Database tables created on startup
4. ✅ CORS configured for localhost:3000
5. ✅ Environment variables set correctly
6. ✅ File uploads work with S3 storage
7. ✅ Evidence chunk IDs properly linked

## Success Criteria

- [ ] Demo preset loads in < 5 seconds
- [ ] Document upload completes in < 30 seconds
- [ ] All evidence links work
- [ ] No console errors in browser
- [ ] No errors in API logs
- [ ] All services restart cleanly
- [ ] Data persists across restarts

## Regression Tests

After any code changes, re-run:
1. Demo preset test
2. Document upload test
3. Evidence linking test

These are the critical paths that must always work.

