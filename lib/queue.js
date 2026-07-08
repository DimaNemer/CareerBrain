import { Queue } from 'bullmq'

let opportunitiesQueue = null
function getConnection() {
  if (!process.env.REDIS_URL) return null
  return { connection: { url: process.env.REDIS_URL } }
}

function getQueue() {
  if (!opportunitiesQueue) {
    const conn = getConnection()
    if (!conn) return null
    try {
      opportunitiesQueue = new Queue('opportunities', conn)
      opportunitiesQueue.on('error', () => {})
    } catch {
      return null
    }
  }
  return opportunitiesQueue
}

export async function enqueueOpportunity(opportunityId, description) {
  const q = getQueue()
  if (!q) return null
  try {
    return q.add('extract', { opportunityId, description }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false,
    })
  } catch (err) {
    console.error('Failed to enqueue job (Redis unavailable):', err?.message || err)
    return null
  }
}
