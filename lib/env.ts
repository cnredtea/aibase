import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default('aibase'),
  DATABASE_URL: z.string().url().optional(),
  // Queue/Redis
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  QUEUE_NAME: z.string().min(1).default('jobs'),
  JOB_CONCURRENCY: z.coerce.number().default(5),
  // Metrics server for the worker
  QUEUE_METRICS_PORT: z.coerce.number().default(9464),
  // Sentry
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().default(0),
  // Simulator to generate load (for demo/dev)
  ENABLE_JOB_SIMULATOR: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  JOB_SIMULATOR_RATE_PER_MINUTE: z.coerce.number().default(30)
})

export type Env = z.infer<typeof envSchema>

let cached: Env | null = null

export function getEnv(): Env {
  if (cached) return cached
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors
    const message = Object.entries(flattened)
      .map(([k, v]) => `${k}: ${v?.join(', ')}`)
      .join('\n')
    throw new Error(`Invalid environment variables:\n${message}`)
  }
  cached = parsed.data
  return cached
}

export const env = getEnv()
