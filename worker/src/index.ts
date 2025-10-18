import 'dotenv/config';
import { loadConfig } from './config.js';
import { logger } from './utils/logger.js';
import { processImage } from './processImage.js';
import { startRedisWorker } from './queue/redisQueue.js';
import { startSqsPoller } from './queue/sqsQueue.js';
import { createHealthServer } from './health.js';
import sharp from 'sharp';

async function main() {
  const cfg = loadConfig();

  logger.info({ versions: sharp.versions, heif: sharp.format.heif }, 'Sharp/libvips loaded');

  const handler = async (job: any) => {
    await processImage(job);
  };

  if (cfg.QUEUE_PROVIDER === 'redis') {
    startRedisWorker(handler);
  } else {
    startSqsPoller(handler);
  }

  const app = createHealthServer();
  app.listen(cfg.PORT, () => logger.info({ port: cfg.PORT, path: cfg.HEALTHCHECK_PATH }, 'Health server listening'));
}

main().catch((err) => {
  logger.error({ err }, 'Fatal error');
  process.exit(1);
});
