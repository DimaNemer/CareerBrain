import { Queue } from 'bullmq'

// Lazily create the Queue to avoid connecting at module import time (Next build/runtime)
let opportunitiesQueue = null
function getConnection() {
  return process.env.REDIS_URL
    ? { connection: { url: process.env.REDIS_URL } }
    : { connection: { host: '127.0.0.1', port: 6379 } }
}

function getQueue() {
  if (!opportunitiesQueue) {
    const connection = getConnection()
    opportunitiesQueue = new Queue('opportunities', connection)
  }
  return opportunitiesQueue
}

// Export a small helper to add jobs with controlled options. This will only
// instantiate the Redis connection when used at runtime, preventing build-time
// connection attempts that fail when Redis is not available.
export async function enqueueOpportunity(opportunityId, description) {
  try {
    const q = getQueue()
    return q.add('extract', { opportunityId, description }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false,
    })
  } catch (err) {
    // If Redis is unavailable, log and return a resolved promise so the API
    // path can continue. Consider adding a fallback (inline processing) if needed.
    console.error('Failed to enqueue job (Redis unavailable):', err?.message || err)
    return null
  }
}
