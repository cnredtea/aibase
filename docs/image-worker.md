Image Processing Worker (libvips + HEIC/HEIF)

Overview
- Dockerized Node.js worker that processes images using sharp (libvips) with HEIC/HEIF support.
- Supports queue backends: Redis (BullMQ) or AWS SQS.
- Stores outputs to S3-compatible storage (AWS S3, Cloudflare R2, MinIO, etc.).
- Provides HTTP health endpoint for Fly.io/Railway deployment checks.

Folder
- worker/: standalone TypeScript project with its own Dockerfile

Environment variables
Create worker/.env from worker/.env.example and adjust as needed.

Required (common)
- PORT: default 8080
- HEALTHCHECK_PATH: default /healthz
- QUEUE_PROVIDER: redis or sqs
- WORKER_CONCURRENCY: e.g. 5

Redis
- REDIS_URL: e.g. redis://localhost:6379/0
- QUEUE_NAME: default image-jobs

SQS
- AWS_REGION
- AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
- SQS_QUEUE_URL

S3/R2
- S3_ENDPOINT: e.g. https://<accountid>.r2.cloudflarestorage.com or http://localhost:9000 for MinIO
- S3_REGION
- S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
- S3_BUCKET_SOURCE, S3_BUCKET_DEST
- S3_FORCE_PATH_STYLE: true for MinIO/R2

Optional DB
- DATABASE_URL (Postgres) used for health check only

Job payload format
{
  "source": { "type": "s3", "bucket": "uploads", "key": "input/sample.heic" },
  "target": { "bucket": "processed", "key": "output/sample.jpg", "format": "jpeg" },
  "operations": {
    "resize": { "width": 1600, "height": 900, "fit": "inside" },
    "quality": 82
  }
}
- Alternatively use source: { type: 'url', url: 'https://example.com/image.heic' }

Local development
1) Install deps and build
   cd worker
   npm install
   npm run build

2) Run locally
   cp .env.example .env
   npm run dev

3) Healthcheck
   curl -s http://localhost:8080/healthz | jq .

4) Enqueue a test job (Redis)
   - Start Redis locally (e.g., docker run -p 6379:6379 redis:7)
   - Use Node REPL snippet:
     node -e "(async()=>{const {Queue}=require('bullmq');const q=new Queue(process.env.QUEUE_NAME||'image-jobs',{connection:{host:'127.0.0.1',port:6379}});await q.add('resize',{source:{type:'url',url:'https://raw.githubusercontent.com/lovell/sharp/refs/heads/main/test/fixtures/alpha-premultiplication-yes.heic'},target:{key:'example.jpg',format:'jpeg'}});process.exit(0)})()"

Docker build and run
- Build: docker build -t image-worker:dev -f worker/Dockerfile worker
- Run: docker run --rm -p 8080:8080 --env-file worker/.env image-worker:dev

Deployment
Fly.io
- Ensure you have flyctl installed and logged in
- Edit fly.worker.toml, set app name
- Deploy: fly launch --config fly.worker.toml --now
- Health checks: HTTP GET /healthz
- Concurrency: soft/hard limits set in fly.worker.toml (tune as needed)

Railway
- Connect repo to Railway
- Select Dockerfile build and point to worker/Dockerfile
- Configure environment variables in the Railway dashboard
- Health checks: set /healthz path (Railway will use container port 8080)

HEIC/HEIF support notes
- The Docker image installs libvips + libheif; sharp also bundles prebuilt libvips.
- The health endpoint exposes sharp.format.heif flags; ensure true for HEIF.

Security & performance
- Non-root user inside container
- WORKER_CONCURRENCY controls concurrent jobs; adjust based on CPU/memory
- For SQS, visibility timeout is extended periodically during processing

