# Railway deployment

Railway can host the API and Postgres.

## API

1. Create a Railway project.
2. Add a Postgres service.
3. Add a new service from this repo and set the root directory to `apps/api`.
4. Set environment variables:

- DATABASE_URL: use the value provided by Railway Postgres.
- CORS_ORIGINS: your web URL.

Optional S3-style storage
- Set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY.
- For Cloudflare R2, use its S3 endpoint.

## Web

Deploy the Next.js app on Vercel or Netlify.

- Root directory: `apps/web`
- NEXT_PUBLIC_API_BASE: Railway API public URL
