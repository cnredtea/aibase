import { NextResponse } from 'next/server'
import { replayAllFailed, replayJob } from '@/lib/queue'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any))
  if (body.all) {
    const count = await replayAllFailed()
    return NextResponse.json({ replayed: count })
  }
  const id = body.id || body.jobId
  if (!id) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })
  }
  await replayJob(id)
  return NextResponse.json({ replayed: 1, id })
}
