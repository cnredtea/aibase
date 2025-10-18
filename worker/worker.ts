import { Worker, Queue, QueueEvents } from 'bullmq'
import { env } from '../lib/env'
import { getQueue } from '../lib/queue'
import express from 'express'
import client from 'prom-client'
import * as Sentry from '@sentry/node'

const queue: Queue = getQueue()
const queueEvents: QueueEvents = new QueueEvents(env.QUEUE_NAME, { connection: (queue as any).opts.connection })

// Sentry setup
if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
    environment: env.NODE_ENV
  })
}

// Prometheus metrics
client.collectDefaultMetrics()
const register = client.register

const jobProcessingDuration = new client.Histogram({
  name: 'queue_job_processing_duration_seconds',
  help: 'Duration of job processing in seconds',
  labelNames: ['job_name']
})

const jobLatencyToStart = new client.Histogram({
  name: 'queue_job_latency_to_start_seconds',
  help: 'Time from enqueue to start of processing in seconds',
  labelNames: ['job_name']
})

const jobsEnqueued = new client.Counter({
  name: 'queue_jobs_enqueued_total',
  help: 'Total number of jobs enqueued',
  labelNames: ['job_name']
})

const jobsCompleted = new client.Counter({
  name: 'queue_jobs_completed_total',
  help: 'Total number of jobs completed successfully',
  labelNames: ['job_name']
})

const jobsFailed = new client.Counter({
  name: 'queue_jobs_failed_total',
  help: 'Total number of jobs failed',
  labelNames: ['job_name']
})

const jobsRetried = new client.Counter({
  name: 'queue_jobs_retried_total',
  help: 'Total number of retries attempted for jobs',
  labelNames: ['job_name']
})

const queueDepth = new client.Gauge({
  name: 'queue_depth',
  help: 'Number of jobs by status in the queue',
  labelNames: ['status']
})

// Track enqueued jobs via queue events
queueEvents.on('waiting', ({ jobId, prev }) => {
  // prev can be 'waiting-children' etc.
  // We can't get name from this event easily, but we can fetch the job
  queue.getJob(jobId).then((job) => {
    if (job) {
      jobsEnqueued.labels(job.name).inc()
    }
  })
})

queueEvents.on('failed', async ({ jobId, failedReason }) => {
  const job = await queue.getJob(jobId)
  if (job) {
    jobsFailed.labels(job.name).inc()
    const attempts = job.attemptsMade
    const max = job.opts.attempts || 0
    if (attempts < max) {
      jobsRetried.labels(job.name).inc()
    }
  }
})

queueEvents.on('completed', async ({ jobId }) => {
  const job = await queue.getJob(jobId)
  if (job) {
    jobsCompleted.labels(job.name).inc()
  }
})

// Periodic queue depth updater
async function updateQueueDepth() {
  const counts = await queue.getJobCounts('active', 'waiting', 'delayed', 'completed', 'failed')
  queueDepth.labels('active').set(counts.active)
  queueDepth.labels('waiting').set(counts.waiting)
  queueDepth.labels('delayed').set(counts.delayed)
  queueDepth.labels('completed').set(counts.completed)
  queueDepth.labels('failed').set(counts.failed)
}
setInterval(() => {
  updateQueueDepth().catch(() => {})
}, 5000)

// Define processors
function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

async function processExampleJob(data: any) {
  // Simulate variable work and occasional failures
  const timeMs = 200 + Math.floor(Math.random() * 1000)
  await sleep(timeMs)
  if (Math.random() < 0.2) {
    throw new Error('Random failure for demo')
  }
  return { ok: true, tookMs: timeMs }
}

const processor = async (job: any) => {
  const start = Date.now()
  const name = job.name
  const enqTsMs = job.timestamp || start
  const latencySec = (start - enqTsMs) / 1000
  jobLatencyToStart.labels(name).observe(latencySec)

  const transaction = env.SENTRY_DSN
    ? Sentry.startTransaction({ op: 'queue.job', name })
    : null

  try {
    let result: any
    switch (name) {
      case 'example':
        result = await processExampleJob(job.data)
        break
      default:
        throw new Error(`Unknown job name: ${name}`)
    }
    const durationSec = (Date.now() - start) / 1000
    jobProcessingDuration.labels(name).observe(durationSec)
    transaction?.finish()
    return result
  } catch (err) {
    Sentry.captureException(err)
    const durationSec = (Date.now() - start) / 1000
    jobProcessingDuration.labels(name).observe(durationSec)
    transaction?.finish()
    throw err
  }
}

// Create the worker
const worker = new Worker(env.QUEUE_NAME, processor, {
  connection: (queue as any).opts.connection,
  concurrency: env.JOB_CONCURRENCY
})

worker.on('failed', (job, err) => {
  if (job) {
    // Already accounted for in queueEvents, but keeping here if needed for future
  }
})

worker.on('completed', () => {
  // No-op
})

// Metrics server
const app = express()
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
})
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(env.QUEUE_METRICS_PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Metrics server on :${env.QUEUE_METRICS_PORT}`)
})

// Optional simulator to generate load
if (env.ENABLE_JOB_SIMULATOR) {
  const rate = env.JOB_SIMULATOR_RATE_PER_MINUTE
  const intervalMs = Math.max(1000, Math.floor(60000 / Math.max(1, rate)))
  setInterval(async () => {
    try {
      await queue.add('example', { source: 'simulator' }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } })
    } catch {}
  }, intervalMs)
}
