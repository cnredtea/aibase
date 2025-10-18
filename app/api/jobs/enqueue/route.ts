import { NextResponse } from 'next/server'
import { enqueueJob } from '@/lib/queue'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any))
  const name = body.name || body.type || 'example'
  const data = body.data || { source: 'api' }
  const attempts = body.attempts ?? 3
  const backoff = body.backoff ?? { type: 'exponential', delay: 5000 }

  const job = await enqueueJob(name, data, { attempts, backoff })
  return NextResponse.json({ id: job.id, name: job.name, data: job.data })
}
