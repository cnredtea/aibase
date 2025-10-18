import { enqueueJob } from '../lib/queue'
import { env } from '../lib/env'

async function main() {
  const rate = env.JOB_SIMULATOR_RATE_PER_MINUTE
  const intervalMs = Math.max(1000, Math.floor(60000 / Math.max(1, rate)))
  // eslint-disable-next-line no-console
  console.log(`Enqueuing example jobs every ${intervalMs}ms`)
  setInterval(async () => {
    await enqueueJob('example', { source: 'simulator' })
  }, intervalMs)
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
