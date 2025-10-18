import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { loadConfig } from '../config.js';

export function createS3() {
  const cfg = loadConfig();
  const client = new S3Client({
    region: cfg.S3_REGION,
    endpoint: cfg.S3_ENDPOINT || undefined,
    forcePathStyle: cfg.S3_FORCE_PATH_STYLE,
    credentials: cfg.S3_ACCESS_KEY_ID && cfg.S3_SECRET_ACCESS_KEY ? {
      accessKeyId: cfg.S3_ACCESS_KEY_ID,
      secretAccessKey: cfg.S3_SECRET_ACCESS_KEY
    } : undefined
  });
  return client;
}

export async function getObjectBuffer(params: { bucket?: string; key: string; }): Promise<Buffer> {
  const cfg = loadConfig();
  const client = createS3();
  const Bucket = params.bucket || cfg.S3_BUCKET_SOURCE;
  const Key = params.key;
  const res = await client.send(new GetObjectCommand({ Bucket, Key }));
  const body = res.Body;
  if (!body) throw new Error('S3 object Body is empty');
  const chunks: Uint8Array[] = [];
  const stream = body as any as NodeJS.ReadableStream;
  await new Promise<void>((resolve, reject) => {
    stream.on('data', (c: Uint8Array) => chunks.push(c));
    stream.on('end', () => resolve());
    stream.on('error', reject);
  });
  return Buffer.concat(chunks);
}

export async function putObjectBuffer(params: { bucket?: string; key: string; body: Buffer; contentType?: string; }): Promise<void> {
  const cfg = loadConfig();
  const client = createS3();
  const Bucket = params.bucket || cfg.S3_BUCKET_DEST;
  const Key = params.key;
  await client.send(new PutObjectCommand({ Bucket, Key, Body: params.body, ContentType: params.contentType }));
}
