import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default('aibase'),
  DATABASE_URL: z.string().url().optional(),
})

type Env = z.infer<typeof envSchema>

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
