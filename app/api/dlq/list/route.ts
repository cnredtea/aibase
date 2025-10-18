import { NextResponse } from 'next/server'
import { getFailedJobs } from '@/lib/queue'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const start = parseInt(searchParams.get('start') ?? '0', 10)
  const end = parseInt(searchParams.get('end') ?? '50', 10)
  const jobs = await getFailedJobs(start, end)
  const data = jobs.map((j) => ({
    id: j.id,
    name: j.name,
    failedReason: j.failedReason,
    attemptsMade: j.attemptsMade,
    timestamp: j.timestamp,
    data: j.data
  }))
  return NextResponse.json({ count: data.length, jobs: data })
}
