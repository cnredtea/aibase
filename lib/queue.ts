import { Queue, QueueEvents, JobsOptions, QueueScheduler, Job } from 'bullmq'
import IORedis from 'ioredis'
import { env } from './env'

const connection = new IORedis(env.REDIS_URL)

let queue: Queue | null = null
let events: QueueEvents | null = null
let scheduler: QueueScheduler | null = null

export function getQueue(): Queue {
  if (!queue) {
    queue = new Queue(env.QUEUE_NAME, { connection })
  }
  return queue
}

export function getQueueEvents(): QueueEvents {
  if (!events) {
    events = new QueueEvents(env.QUEUE_NAME, { connection })
  }
  return events
}

export function getQueueScheduler(): QueueScheduler {
  if (!scheduler) {
    scheduler = new QueueScheduler(env.QUEUE_NAME, { connection })
  }
  return scheduler
}

export async function enqueueJob<T = any>(name: string, data: T, opts?: JobsOptions) {
  const q = getQueue()
  const defaultOpts: JobsOptions = {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 1000,
    removeOnFail: false
  }
  return q.add(name, data, { ...defaultOpts, ...(opts || {}) })
}

export async function getFailedJobs(start = 0, end = 50): Promise<Job[]> {
  const q = getQueue()
  return q.getJobs(['failed'], start, end)
}

export async function replayJob(jobId: string) {
  const q = getQueue()
  const job = await q.getJob(jobId)
  if (!job) throw new Error(`Job ${jobId} not found`)
  await job.retry()
  return jobId
}

export async function replayAllFailed(limit = 1000): Promise<number> {
  const failed = await getFailedJobs(0, limit)
  let count = 0
  for (const job of failed) {
    try {
      await job.retry()
      count += 1
    } catch (e) {
      // ignore jobs that cannot be retried
    }
  }
  return count
}
