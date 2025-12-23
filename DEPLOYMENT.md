# LifeBridge Deployment Guide

## Deployment Options

### Option 1: Railway (Recommended)

Railway provides easy deployment for the API and database.

#### 1. Deploy Database

1. Create a new Railway project
2. Add a PostgreSQL plugin
3. Note the `DATABASE_URL` connection string

#### 2. Deploy API

1. In your Railway project, create a new service
2. Connect to your GitHub repository
3. Set the root directory to `apps/api`
4. Add environment variables:

```
DATABASE_URL=<from Railway Postgres>
CORS_ORIGINS=https://your-frontend-domain.com
S3_ENDPOINT=<your S3 endpoint>
S3_BUCKET=<your bucket name>
S3_ACCESS_KEY=<your access key>
S3_SECRET_KEY=<your secret key>
S3_PUBLIC_BASE_URL=<public URL for files>
```

5. Railway will automatically detect the Dockerfile and deploy

#### 3. Setup Object Storage

**Option A: Cloudflare R2**
1. Create an R2 bucket
2. Generate API tokens
3. Use these in API environment variables

**Option B: AWS S3**
1. Create an S3 bucket
2. Create IAM user with S3 access
3. Use credentials in API environment variables

#### 4. Deploy Frontend

**Option A: Vercel (Fastest)**
1. Connect your GitHub repository to Vercel
2. Set root directory to `apps/web`
3. Add environment variable:
   ```
   NEXT_PUBLIC_API_BASE=https://your-api-domain.railway.app
   ```
4. Deploy

**Option B: Railway**
1. Create a new service in Railway
2. Connect to your repository
3. Set root directory to `apps/web`
4. Add environment variable
5. Deploy

### Option 2: Docker Compose (VPS)

For deployment on a VPS (DigitalOcean, Linode, etc.):

#### 1. Prepare Server

```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

#### 2. Clone Repository

```bash
git clone https://github.com/yourusername/lifebridge.git
cd lifebridge
```

#### 3. Configure Environment

Edit `docker-compose.yml` to use production values:

```yaml
services:
  api:
    environment:
      DATABASE_URL: postgresql+psycopg://lifebridge:STRONG_PASSWORD@db:5432/lifebridge
      CORS_ORIGINS: https://yourdomain.com
      # Add S3 credentials
```

#### 4. Setup SSL with Caddy

Create `Caddyfile`:

```
yourdomain.com {
    reverse_proxy web:3000
}

api.yourdomain.com {
    reverse_proxy api:8000
}
```

Add Caddy to `docker-compose.yml`:

```yaml
  caddy:
    image: caddy:2
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - api
      - web

volumes:
  caddy_data:
  caddy_config:
```

#### 5. Start Services

```bash
docker compose up -d
```

### Option 3: Kubernetes

For production-scale deployment:

#### 1. Create Kubernetes Manifests

See `infra/k8s/` directory for example manifests:
- `postgres-deployment.yaml`
- `api-deployment.yaml`
- `web-deployment.yaml`
- `ingress.yaml`

#### 2. Deploy to Cluster

```bash
kubectl apply -f infra/k8s/
```

## Environment Variables Reference

### API Service

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql+psycopg://user:pass@host:5432/db` |
| `CORS_ORIGINS` | Yes | Allowed origins (comma-separated) | `https://app.com,https://www.app.com` |
| `S3_ENDPOINT` | Yes | S3-compatible endpoint | `https://s3.amazonaws.com` |
| `S3_BUCKET` | Yes | Bucket name | `lifebridge-prod` |
| `S3_ACCESS_KEY` | Yes | S3 access key | `AKIAIOSFODNN7EXAMPLE` |
| `S3_SECRET_KEY` | Yes | S3 secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `S3_REGION` | No | S3 region | `us-east-1` |
| `S3_PUBLIC_BASE_URL` | No | Public URL for files | `https://cdn.example.com` |
| `OPENAI_API_KEY` | No | OpenAI API key for enhanced reasoning | `sk-...` |

### Web Service

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE` | Yes | API base URL | `https://api.yourdomain.com` |

## Post-Deployment Checklist

- [ ] Database tables created (check API logs)
- [ ] S3 bucket accessible
- [ ] CORS configured correctly
- [ ] SSL certificates active
- [ ] Health endpoint responds: `curl https://api.yourdomain.com/health`
- [ ] Web UI loads
- [ ] Demo preset works
- [ ] Document upload works
- [ ] Evidence links work

## Monitoring

### Health Checks

```bash
# API health
curl https://api.yourdomain.com/health

# Database connection
docker compose exec api python -c "from app.db.session import engine; engine.connect()"

# S3 connection
docker compose exec api python -c "from app.services.storage import get_store; store = get_store(); print('OK')"
```

### Logs

```bash
# Docker Compose
docker compose logs -f api
docker compose logs -f web

# Railway
# View logs in Railway dashboard

# Kubernetes
kubectl logs -f deployment/api
kubectl logs -f deployment/web
```

### Metrics

Consider adding:
- Application Performance Monitoring (APM): Sentry, DataDog
- Uptime monitoring: UptimeRobot, Pingdom
- Log aggregation: Logtail, Papertrail

## Backup Strategy

### Database Backups

**Railway:**
- Automatic backups included
- Manual backup: Use Railway dashboard

**Docker Compose:**
```bash
# Backup
docker compose exec db pg_dump -U lifebridge lifebridge > backup.sql

# Restore
docker compose exec -T db psql -U lifebridge lifebridge < backup.sql
```

### File Storage Backups

**S3/R2:**
- Enable versioning on bucket
- Setup lifecycle rules for old versions
- Consider cross-region replication

## Scaling

### Horizontal Scaling

1. **API**: Add more replicas
   ```yaml
   # docker-compose.yml
   api:
     deploy:
       replicas: 3
   ```

2. **Database**: Use managed service (Railway, AWS RDS)

3. **Storage**: S3/R2 scales automatically

### Vertical Scaling

Increase resources for containers:
```yaml
api:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 4G
```

## Security Checklist

- [ ] Use strong database passwords
- [ ] Enable SSL/TLS for all connections
- [ ] Restrict CORS to specific domains
- [ ] Use environment variables for secrets (never commit)
- [ ] Enable S3 bucket encryption
- [ ] Setup firewall rules (only ports 80, 443 public)
- [ ] Regular security updates
- [ ] Setup rate limiting on API
- [ ] Enable API authentication (if needed)
- [ ] Regular backup testing

## Troubleshooting

### API won't start

1. Check database connection:
   ```bash
   docker compose logs db
   ```

2. Check environment variables:
   ```bash
   docker compose exec api env | grep DATABASE_URL
   ```

3. Check S3 credentials:
   ```bash
   docker compose exec api python -c "from app.services.storage import get_store; store = get_store()"
   ```

### Frontend can't reach API

1. Check CORS settings
2. Verify `NEXT_PUBLIC_API_BASE` is correct
3. Check API is accessible from browser
4. Check browser console for errors

### File uploads fail

1. Check S3 credentials
2. Verify bucket exists and is accessible
3. Check bucket permissions
4. Review API logs for errors

### OCR not working

1. Verify tesseract is installed in container:
   ```bash
   docker compose exec api which tesseract
   ```

2. Check API logs for OCR errors

## Cost Optimization

### Railway
- Use Hobby plan for development ($5/month)
- Pro plan for production ($20/month + usage)

### Cloudflare R2
- 10 GB free storage
- No egress fees
- $0.015/GB/month after free tier

### Vercel
- Free tier includes:
  - 100 GB bandwidth
  - Unlimited deployments
  - SSL certificates

### Total Estimated Cost
- Development: $5-10/month
- Production (low traffic): $20-30/month
- Production (high traffic): $50-100/month

## Support

For deployment issues:
1. Check logs first
2. Review this guide
3. Check Railway/Vercel documentation
4. Open GitHub issue with logs and error messages

