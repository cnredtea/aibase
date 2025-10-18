import { ReceiveMessageCommand, SQSClient, DeleteMessageCommand, ChangeMessageVisibilityCommand } from '@aws-sdk/client-sqs';
import { loadConfig } from '../config.js';
import { logger } from '../utils/logger.js';
import { ImageJob, QueueHandler } from './types.js';

export function createSqsClient() {
  const cfg = loadConfig();
  return new SQSClient({ region: cfg.AWS_REGION, credentials: cfg.AWS_ACCESS_KEY_ID && cfg.AWS_SECRET_ACCESS_KEY ? { accessKeyId: cfg.AWS_ACCESS_KEY_ID, secretAccessKey: cfg.AWS_SECRET_ACCESS_KEY } : undefined });
}

export function startSqsPoller(handler: QueueHandler) {
  const cfg = loadConfig();
  if (!cfg.SQS_QUEUE_URL) throw new Error('SQS_QUEUE_URL is required when QUEUE_PROVIDER=sqs');
  const client = createSqsClient();
  let stopped = false;
  const inflight = new Set<Promise<void>>();

  async function extendVisibility(receiptHandle: string) {
    const visibilityTimeout = 60; // seconds
    try {
      await client.send(new ChangeMessageVisibilityCommand({ QueueUrl: cfg.SQS_QUEUE_URL!, ReceiptHandle: receiptHandle, VisibilityTimeout: visibilityTimeout }));
    } catch (err) {
      logger.warn({ err }, 'Failed to extend message visibility');
    }
  }

  async function processMessage(raw: any) {
    const receiptHandle = raw.ReceiptHandle!;

    // periodically extend visibility while processing
    const interval = setInterval(() => void extendVisibility(receiptHandle), 30000);
    try {
      const body = JSON.parse(raw.Body || '{}');
      const msg: ImageJob = body && body.job ? body.job : body;
      await handler(msg);
      await client.send(new DeleteMessageCommand({ QueueUrl: cfg.SQS_QUEUE_URL!, ReceiptHandle: receiptHandle }));
    } catch (err) {
      logger.error({ err }, 'SQS message processing error');
      // do not delete message to allow retry via redrive policy
    } finally {
      clearInterval(interval);
    }
  }

  async function loop() {
    while (!stopped) {
      try {
        const res = await client.send(new ReceiveMessageCommand({
          QueueUrl: cfg.SQS_QUEUE_URL!,
          MaxNumberOfMessages: Math.min(10, cfg.WORKER_CONCURRENCY),
          WaitTimeSeconds: 20,
          VisibilityTimeout: 60
        }));
        const msgs = res.Messages || [];
        for (const m of msgs) {
          if (inflight.size >= cfg.WORKER_CONCURRENCY) break;
          const p = processMessage(m).finally(() => inflight.delete(p));
          inflight.add(p);
        }
        // avoid tight loop
        if (msgs.length === 0) await new Promise((r) => setTimeout(r, 1000));
      } catch (err) {
        logger.error({ err }, 'SQS poller error');
        await new Promise((r) => setTimeout(r, 2000));
      }
      // backpressure: if inflight at limit, wait until some finish
      while (inflight.size >= cfg.WORKER_CONCURRENCY) {
        await Promise.race(Array.from(inflight));
      }
    }
  }

  loop();

  return {
    stop() { stopped = true; }
  };
}
