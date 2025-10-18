Queue Observability and DLQ: dashboards, alerts, and replay tooling

This repo includes a minimal queue system (BullMQ + Redis) with:
- Prometheus metrics for queue depth, job processing latency, failures, and retries
- Grafana dashboard pre-provisioned
- Alerting via Prometheus Alertmanager (PagerDuty/Email)
- Dead Letter Queue (failed jobs) with admin replay API
- Sentry performance/error monitoring for jobs

Quick start (local)
1) Copy .env.example to .env and adjust values if needed
2) docker-compose up -d
3) Open services:
   - Grafana: http://localhost:3000 (admin/admin)
   - Prometheus: http://localhost:9090
   - Alertmanager: http://localhost:9093
   - Worker metrics: http://localhost:9464/metrics
4) Enqueue a job:
   - curl -X POST http://localhost:3000/api/jobs/enqueue -H 'Content-Type: application/json' -d '{"name":"example"}'
5) DLQ admin:
   - List: curl http://localhost:3000/api/dlq/list
   - Replay one: curl -X POST http://localhost:3000/api/dlq/replay -H 'Content-Type: application/json' -d '{"jobId":"<id>"}'
   - Replay all: curl -X POST http://localhost:3000/api/dlq/replay -H 'Content-Type: application/json' -d '{"all":true}'

Environment variables
- REDIS_URL: Redis connection string (default redis://localhost:6379)
- QUEUE_NAME: Queue name (default jobs)
- JOB_CONCURRENCY: Worker concurrency (default 5)
- QUEUE_METRICS_PORT: Port for Prometheus metrics (default 9464)
- ENABLE_JOB_SIMULATOR: true/false to auto-enqueue demo jobs (default false)
- JOB_SIMULATOR_RATE_PER_MINUTE: How many demo jobs to enqueue per minute (default 30)
- SENTRY_DSN: Optional DSN to send job traces and errors to Sentry
- SENTRY_TRACES_SAMPLE_RATE: 0.0-1.0 sampling rate for tracing

Dashboards and alerts
- Grafana dashboard: config/grafana/dashboards/queue_observability.json
- Prometheus rules: config/prometheus/alerting_rules.yml
- Alertmanager config: config/alertmanager/alertmanager.yml

Runbook
See docs/runbook.md for incident response steps.

Notes
- DLQ is implemented using BullMQ failed jobs registry. Replay is safe for idempotent jobs. Ensure job handlers are idempotent or guard against duplicates.
- Sentry integration is enabled in the worker only.
