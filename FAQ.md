# LifeBridge - Frequently Asked Questions

## Getting Started

### Q: How do I start the application?

**A:** Simply run:
```bash
docker compose up --build
```

Then open http://localhost:3000 in your browser.

### Q: How long does it take to start?

**A:** About 30-60 seconds for all services to initialize. The API waits for the database to be ready before starting.

### Q: What if I see errors on startup?

**A:** Wait a full minute - services start in sequence. If errors persist:
1. Check logs: `docker compose logs`
2. Verify ports are available: `lsof -i :3000 -i :8000 -i :5432 -i :9000`
3. Try a clean start: `docker compose down -v && docker compose up --build`

### Q: Do I need to install anything besides Docker?

**A:** No! Everything runs in containers. You only need Docker and Docker Compose.

## Features

### Q: What file types are supported?

**A:** 
- **PDFs**: Both text-based and scanned (with OCR)
- **Images**: PNG, JPEG, JPG (with OCR)

### Q: How does OCR work?

**A:** The API uses Tesseract OCR to extract text from images and scanned PDFs. It's automatically applied when needed.

### Q: What are "evidence links"?

**A:** Every checklist item, timeline item, and risk cites the specific text chunks it's based on. Click "Why" to see the source text.

### Q: What scenarios are supported?

**A:** Three scenarios:
1. **Family Reunion** - Visa/travel support for family visits
2. **Job Onboarding** - Cross-border employment documentation
3. **Travel Support** - First-time traveler assistance

### Q: Can I add more scenarios?

**A:** Yes! Edit `apps/api/app/services/reason.py` to add custom scenarios and rules.

## Usage

### Q: How do I test the app quickly?

**A:** Click "Run demo preset" on the home page. This creates a pre-populated case instantly.

### Q: Can I upload multiple documents?

**A:** Yes! Upload one at a time. Each upload triggers re-analysis automatically.

### Q: What happens when I click "Re-analyze"?

**A:** The system:
1. Loads all text chunks from uploaded documents
2. Runs the reasoning engine
3. Generates new checklist, timeline, and risks
4. Updates the display

### Q: Where are my files stored?

**A:** Files are stored in MinIO (S3-compatible storage). Metadata is in PostgreSQL. Locally, data is in the `data/` folder.

### Q: How do I delete a case?

**A:** Currently, cases persist. To reset everything:
```bash
docker compose down -v
rm -rf data/
```

## Technical

### Q: What ports does the app use?

**A:**
- **3000**: Web UI
- **8000**: API
- **5432**: PostgreSQL
- **9000**: MinIO API
- **9001**: MinIO Console

### Q: Can I run services individually?

**A:** Yes! See `QUICKSTART.md` for instructions on running the API and web separately.

### Q: How do I access the database?

**A:**
```bash
docker compose exec db psql -U lifebridge -d lifebridge
```

### Q: How do I view MinIO files?

**A:** Open http://localhost:9001 and login with:
- Username: `minio`
- Password: `minio12345`

### Q: Where are the logs?

**A:**
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f web
```

### Q: How do I check if everything is working?

**A:** Run the test script:
```bash
./test_api.sh
```

## Development

### Q: How do I modify the reasoning logic?

**A:** Edit `apps/api/app/services/reason.py`. The `build_reasoning()` function contains all the rules.

### Q: How do I change the UI?

**A:** Edit files in `apps/web/app/`:
- `page.tsx` - Home page
- `case/[id]/page.tsx` - Case detail page

### Q: How do I add a new API endpoint?

**A:** Add it to `apps/api/app/main.py`. FastAPI will automatically add it to the docs.

### Q: How do I change the database schema?

**A:** 
1. Edit `apps/api/app/db/models.py`
2. Delete the database: `docker compose down -v`
3. Restart: `docker compose up`

(For production, use Alembic migrations)

### Q: How do I add environment variables?

**A:** Edit `docker-compose.yml` under the `environment` section for each service.

## Deployment

### Q: How do I deploy to production?

**A:** See `DEPLOYMENT.md` for detailed instructions. Recommended: Railway for API/DB, Vercel for frontend.

### Q: Do I need to change anything for production?

**A:** Yes:
1. Change database password
2. Configure production S3 (not MinIO)
3. Update CORS origins
4. Add SSL/TLS
5. Set strong secrets

### Q: How much does it cost to run in production?

**A:** Estimated monthly costs:
- **Development**: $5-10 (Railway Hobby)
- **Production (low traffic)**: $20-30
- **Production (high traffic)**: $50-100

See `DEPLOYMENT.md` for details.

### Q: Can I use AWS S3 instead of MinIO?

**A:** Yes! Set these environment variables:
```
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_REGION=us-east-1
```

### Q: How do I enable HTTPS?

**A:** Use a reverse proxy like Caddy or Nginx. See `DEPLOYMENT.md` for examples.

## Troubleshooting

### Q: "Port already in use" error

**A:** Another service is using the port. Either:
1. Stop the conflicting service
2. Change the port in `docker-compose.yml`

### Q: "Cannot connect to Docker daemon"

**A:** Docker isn't running. Start Docker Desktop or the Docker service.

### Q: API returns 500 errors

**A:** Check API logs:
```bash
docker compose logs api
```

Common causes:
- Database not ready (wait longer)
- S3 credentials wrong
- Missing dependencies

### Q: File upload fails

**A:** Check:
1. MinIO is running: `docker compose ps minio`
2. Bucket exists: Open http://localhost:9001
3. API logs: `docker compose logs api`

### Q: OCR not extracting text

**A:** Verify:
1. Tesseract is installed: `docker compose exec api which tesseract`
2. Image quality is good
3. Text is in English (default language)

### Q: Evidence links show "No evidence"

**A:** This means the reasoning engine didn't find relevant keywords in the chunks. Try:
1. Upload documents with clearer text
2. Adjust keyword matching in `reason.py`

### Q: Web UI shows "Failed to load outputs"

**A:** Check:
1. API is running: `curl http://localhost:8000/health`
2. CORS is configured: Check `docker-compose.yml`
3. Browser console for errors

### Q: Database connection fails

**A:** 
1. Wait for database to be ready (check logs)
2. Verify connection string in `docker-compose.yml`
3. Try: `docker compose restart db api`

## Performance

### Q: How fast is document processing?

**A:** Typical times:
- PDF text extraction: < 1 second
- Image OCR: 2-5 seconds
- Analysis: < 1 second
- Total: Usually under 10 seconds

### Q: What's the maximum file size?

**A:** Default is 10MB. To increase, modify FastAPI's file size limit in `main.py`.

### Q: Can it handle many users?

**A:** Yes! The API is stateless and can scale horizontally. Use a load balancer for multiple API instances.

### Q: How much storage do I need?

**A:** Depends on usage:
- Database: ~10MB per 100 cases
- Files: Varies by document size
- Recommend: Start with 10GB, monitor usage

## Data & Privacy

### Q: Where is my data stored?

**A:** 
- **Locally**: In the `data/` folder
- **Production**: PostgreSQL (metadata) + S3 (files)

### Q: Is my data encrypted?

**A:** 
- **In transit**: Use HTTPS in production
- **At rest**: Enable S3 bucket encryption

### Q: Can I export my data?

**A:** Yes! Database is PostgreSQL (standard SQL). Files are in S3 (standard format).

### Q: How do I backup my data?

**A:** See `DEPLOYMENT.md` for backup strategies. Quick backup:
```bash
# Database
docker compose exec db pg_dump -U lifebridge lifebridge > backup.sql

# Files
# Copy from data/minio/ or use S3 sync
```

### Q: Is this GDPR compliant?

**A:** The app provides the technical foundation. You need to:
1. Add user consent flows
2. Implement data deletion
3. Add privacy policy
4. Enable data export

## Integration

### Q: Can I integrate with other systems?

**A:** Yes! The API is RESTful. See http://localhost:8000/docs for the full API specification.

### Q: Can I add authentication?

**A:** Yes! Add JWT or session-based auth to the API. See `ARCHITECTURE.md` for guidance.

### Q: Can I use this with a mobile app?

**A:** Yes! The API is platform-agnostic. Build a mobile app that calls the same endpoints.

### Q: Can I add webhooks?

**A:** Yes! Modify the API to send webhooks after analysis completes.

## Advanced

### Q: How do I enable OpenAI integration?

**A:** Set the `OPENAI_API_KEY` environment variable. The app will use GPT for enhanced reasoning.

### Q: Can I use a different database?

**A:** The code uses SQLAlchemy, so you can use MySQL, SQLite, etc. Modify the `DATABASE_URL`.

### Q: Can I customize the chunk size?

**A:** Yes! Edit `chunk_size` parameter in `apps/api/app/services/extract.py`.

### Q: How do I add more languages for OCR?

**A:** Install additional Tesseract language packs in the Dockerfile:
```dockerfile
RUN apt-get install -y tesseract-ocr-spa  # Spanish
```

### Q: Can I run this on ARM (Apple Silicon)?

**A:** Yes! Docker supports ARM. All images work on Apple Silicon Macs.

### Q: How do I profile performance?

**A:** Add timing logs in the API:
```python
import time
start = time.time()
# ... code ...
print(f"Took {time.time() - start:.2f}s")
```

## Contributing

### Q: Can I contribute to this project?

**A:** Yes! This is open source (MIT license). Fork, modify, and submit pull requests.

### Q: How do I report bugs?

**A:** Open a GitHub issue with:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Logs (if applicable)

### Q: How do I request features?

**A:** Open a GitHub issue with:
1. Use case description
2. Proposed solution
3. Why it's valuable

## Miscellaneous

### Q: What's the license?

**A:** MIT License. You can use this commercially, modify it, and distribute it freely.

### Q: Who built this?

**A:** This was built for the VisaVerse AI Hackathon as a demonstration of meaningful AI in cross-border mobility.

### Q: Can I use this for my business?

**A:** Yes! MIT license allows commercial use. Consider adding authentication and proper security measures.

### Q: Is there a hosted version?

**A:** Not yet. You need to deploy your own instance. See `DEPLOYMENT.md` for instructions.

### Q: How do I get support?

**A:** 
1. Check this FAQ
2. Read the documentation (QUICKSTART.md, DEPLOYMENT.md, etc.)
3. Check logs for errors
4. Open a GitHub issue

### Q: What's the roadmap?

**A:** See `ARCHITECTURE.md` under "Future Enhancements" for planned features.

## Quick Reference

### Common Commands

```bash
# Start
docker compose up --build

# Start in background
docker compose up -d

# Stop
docker compose down

# Reset everything
docker compose down -v && rm -rf data/

# View logs
docker compose logs -f

# Test API
./test_api.sh

# Access database
docker compose exec db psql -U lifebridge -d lifebridge

# Access API container
docker compose exec api bash

# Restart a service
docker compose restart api
```

### Common URLs

- Web UI: http://localhost:3000
- API Docs: http://localhost:8000/docs
- API Health: http://localhost:8000/health
- MinIO Console: http://localhost:9001

### Common Files

- `START_HERE.md` - Quick start guide
- `README.md` - Project overview
- `QUICKSTART.md` - Detailed setup
- `TEST_PLAN.md` - Testing guide
- `DEPLOYMENT.md` - Production deployment
- `ARCHITECTURE.md` - Technical architecture
- `IMPROVEMENTS.md` - What was fixed
- `FAQ.md` - This file

---

**Still have questions?**

1. Check the documentation files listed above
2. Run `./test_api.sh` to verify your setup
3. Check `docker compose logs` for errors
4. Open a GitHub issue with details

**Ready to start?**

```bash
docker compose up --build
```

Then open http://localhost:3000 and click "Run demo preset"!

