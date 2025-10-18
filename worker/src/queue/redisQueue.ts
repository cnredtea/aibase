import { Worker, QueueEvents, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { loadConfig } from '../config.js';
import { logger } from '../utils/logger.js';
import { ImageJob, QueueHandler } from './types.js';

let worker: Worker | undefined;
let queue: Queue | undefined;

export function startRedisWorker(handler: QueueHandler) {
  const cfg = loadConfig();
  const connection = new IORedis(cfg.REDIS_URL);
  queue = new Queue(cfg.QUEUE_NAME, { connection });
  const events = new QueueEvents(cfg.QUEUE_NAME, { connection });
  events.on('completed', ({ jobId }) => logger.info({ jobId }, 'Job completed'));
  events.on('failed', ({ jobId, failedReason }) => logger.error({ jobId, failedReason }, 'Job failed'));

  worker = new Worker<ImageJob>(
    cfg.QUEUE_NAME,
    async (job) => {
      await handler(job.data);
    },
    {
      connection,
      concurrent: cfg.WORKER_CONCURRENCY,
    }
  );

  worker.on('ready', () => logger.info('Redis worker ready'));
  worker.on('error', (err) => logger.error({ err }, 'Worker error'));

  return { worker, queue };
}

export function getRedisQueue() {
  if (!queue) throw new Error('Queue not initialized');
  return queue;
}
