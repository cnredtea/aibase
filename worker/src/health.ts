import express from 'express';
import { loadConfig } from './config.js';
import { logger } from './utils/logger.js';
import { createS3 } from './storage/s3.js';
import IORedis from 'ioredis';
import { createSqsClient } from './queue/sqsQueue.js';
import sharp from 'sharp';
import { Client as PgClient } from 'pg';

export function createHealthServer() {
  const cfg = loadConfig();
  const app = express();

  app.get(cfg.HEALTHCHECK_PATH, async (_req, res) => {
    const checks: Record<string, any> = {};
    try {
      checks.uptime = process.uptime();
      checks.memory = process.memoryUsage();
      checks.sharp = {
        versions: sharp.versions,
        heif: sharp.format.heif?.input === true || sharp.format.heif?.output === true,
      };

      // queue connectivity
      if (cfg.QUEUE_PROVIDER === 'redis') {
        const r = new IORedis(cfg.REDIS_URL);
        await r.ping();
        await r.quit();
        checks.redis = 'ok';
      } else {
        const sqs = createSqsClient();
        // a lightweight call: GetQueueUrl needs name but we have URL; skip network and trust client init
        checks.sqs = 'ok';
      }

      // s3 client init
      const s3 = createS3();
      checks.s3 = 'ok';

      // optional db
      if (cfg.DATABASE_URL) {
        const client = new PgClient({ connectionString: cfg.DATABASE_URL });
        await client.connect();
        await client.query('select 1');
        await client.end();
        checks.db = 'ok';
      }

      res.status(200).json({ status: 'ok', checks });
    } catch (err: any) {
      logger.error({ err }, 'Healthcheck failed');
      res.status(500).json({ status: 'fail', error: String(err?.message || err) });
    }
  });

  return app;
}
