import { z } from 'zod';

const commonSchema = z.object({
  PORT: z.coerce.number().default(8080),
  HEALTHCHECK_PATH: z.string().default('/healthz'),
  QUEUE_PROVIDER: z.enum(['redis', 'sqs']).default('redis'),
  WORKER_CONCURRENCY: z.coerce.number().min(1).max(64).default(5),
  DATABASE_URL: z.string().optional().or(z.literal('')),
});

const redisSchema = z.object({
  REDIS_URL: z.string().url().default('redis://localhost:6379/0'),
  QUEUE_NAME: z.string().default('image-jobs'),
});

const sqsSchema = z.object({
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  SQS_QUEUE_URL: z.string().url().optional(),
});

const s3Schema = z.object({
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('auto'),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET_SOURCE: z.string().default('uploads'),
  S3_BUCKET_DEST: z.string().default('processed'),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true)
});

export type AppConfig = z.infer<typeof commonSchema> & z.infer<typeof redisSchema> & z.infer<typeof sqsSchema> & z.infer<typeof s3Schema>;

export function loadConfig(): AppConfig {
  const env = { ...process.env };
  const common = commonSchema.parse(env);
  const redis = redisSchema.parse(env);
  const sqs = sqsSchema.parse(env);
  const s3 = s3Schema.parse(env);
  return { ...common, ...redis, ...sqs, ...s3 };
}
