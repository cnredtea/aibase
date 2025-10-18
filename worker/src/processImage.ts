import sharp from 'sharp';
import { logger } from './utils/logger.js';
import { ImageJob } from './queue/types.js';
import { getObjectBuffer, putObjectBuffer } from './storage/s3.js';
import { loadConfig } from './config.js';
import { fetch } from 'undici';

export async function fetchSource(job: ImageJob): Promise<Buffer> {
  if (job.source.type === 's3') {
    if (!job.source.key) throw new Error('source.key required for s3');
    return await getObjectBuffer({ bucket: job.source.bucket, key: job.source.key });
  }
  if (job.source.type === 'url') {
    if (!job.source.url) throw new Error('source.url required for url');
    const res = await fetch(job.source.url);
    if (!res.ok) throw new Error(`Failed to fetch URL ${job.source.url}: ${res.status}`);
    const arr = await res.arrayBuffer();
    return Buffer.from(arr);
  }
  throw new Error('Unsupported source type');
}

export async function processImage(job: ImageJob): Promise<void> {
  const cfg = loadConfig();
  const input = await fetchSource(job);

  const meta = await sharp(input).metadata();
  logger.debug({ meta }, 'Input metadata');

  let pipeline = sharp(input, { failOn: 'none' });

  if (job.operations?.resize) {
    const { width, height, fit } = job.operations.resize;
    pipeline = pipeline.resize(width, height, { fit });
  }

  if (job.target?.format) {
    const quality = job.operations?.quality ?? 80;
    switch (job.target.format) {
      case 'jpeg': pipeline = pipeline.jpeg({ quality }); break;
      case 'png': pipeline = pipeline.png(); break;
      case 'webp': pipeline = pipeline.webp({ quality }); break;
      case 'avif': pipeline = pipeline.avif({ quality }); break;
      case 'heif': pipeline = pipeline.heif({ quality }); break;
      default: break;
    }
  }

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  logger.info({ format: info.format, size: info.size, width: info.width, height: info.height }, 'Processed image');

  // save to S3 if target provided
  if (job.target?.key) {
    const key = job.target.key;
    const bucket = job.target.bucket || cfg.S3_BUCKET_DEST;
    const format = job.target.format || info.format as any;
    const contentType = job.target.contentType || contentTypeForFormat(format);
    await putObjectBuffer({ bucket, key, body: data, contentType });
    logger.info({ bucket, key }, 'Uploaded to storage');
  }
}

function contentTypeForFormat(fmt?: string) {
  switch (fmt) {
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
    case 'avif': return 'image/avif';
    case 'heif': return 'image/heif';
    case 'tiff': return 'image/tiff';
    default: return 'application/octet-stream';
  }
}
