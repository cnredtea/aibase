Queue Observability, DLQ, Alerts, and Replay - Runbook

Overview
- The job queue runs on Redis using BullMQ.
- A dedicated worker processes jobs and exposes Prometheus metrics on /metrics (port 9464).
- Prometheus scrapes metrics and triggers alerts via Alertmanager.
- Grafana shows live dashboards provisioned with this repo.
- Failed jobs land in the Dead Letter Queue (BullMQ failed state) and can be replayed via API.

Key Components
- Redis: Queue backend. Default URL: redis://localhost:6379
- Worker: Processes jobs and exposes metrics. Sentry traces/errors enabled when SENTRY_DSN is set.
- Prometheus: Scrapes worker metrics and evaluates alerting rules.
- Alertmanager: Sends PagerDuty and/or Email alerts.
- Grafana: Pre-provisioned dashboard for queue health.

Runbook
1) Confirm incident scope
- Check Grafana dashboard "Queue Observability" for:
  - Queue Depth (waiting)
  - DLQ Depth (failed)
  - Job Failure Rate
  - p95 Processing Duration and Latency-to-start
- Check recent alerts in Alertmanager/Slack/PagerDuty.

2) Check worker health
- GET http://<worker-host>:9464/health should return { status: 'ok' }
- Ensure Redis is reachable and queue depth updating. If queue depth is increasing and active=0, worker may be down.

3) Inspect DLQ (failed jobs)
- List failed jobs: GET /api/dlq/list (via Next.js app) or curl:
  curl -s http://localhost:3000/api/dlq/list | jq
- Review failedReason and attemptsMade to determine whether failures are transient or permanent.

4) Replay failed jobs safely
- Replay one: POST /api/dlq/replay { "jobId": "<id>" }
- Replay all: POST /api/dlq/replay { "all": true }
- Safety: Job processing is expected to be idempotent. If the underlying job is not idempotent, ensure safeguards before replay.

5) Triage common issues
- High queue depth, low active: scale workers up; check Redis connection, CPU/memory on worker nodes.
- High failure rate: check Sentry traces for exceptions and hotspots; roll back recent changes; disable problematic job types.
- High p95 processing: identify slow job types and optimize; add concurrency; increase resources.
- DLQ growing: inspect representative failures, patch bug, then replay after verification.

6) Validating recovery
- Watch Grafana dashboard to confirm queue waiting depth drops, DLQ depth decreases, and failure rate normalizes.
- Watch Alertmanager to ensure alerts resolve.

Local testing
- docker-compose up -d
- Grafana: http://localhost:3000 (admin/admin)
- Prometheus: http://localhost:9090
- Alertmanager: http://localhost:9093
- Worker metrics: http://localhost:9464/metrics
- Enqueue sample jobs: POST http://localhost:3000/api/jobs/enqueue { "name": "example" }
- Optionally enable the built-in simulator by setting ENABLE_JOB_SIMULATOR=true in .env

Sentry
- Set SENTRY_DSN and optionally SENTRY_TRACES_SAMPLE_RATE (0.0 - 1.0) to enable performance tracing and error reporting for jobs.

KPIs
- Queue waiting depth
- DLQ depth
- Job failure rate
- p95 processing duration
- p95 latency-to-start

On-call quick actions
- Scale workers up (increase replicas)
- Pause enqueuing from upstream if needed
- Hotfix/rollback offending code
- Drain DLQ with replay after fix
- Communicate status to stakeholders
