import { Worker, QueueScheduler } from 'bullmq'
import { extractSkillsWithAI } from './ai-skills'

const connection = process.env.REDIS_URL
  ? { connection: { url: process.env.REDIS_URL } }
  : { connection: { host: '127.0.0.1', port: 6379 } }

// Ensure delayed jobs are properly scheduled
new QueueScheduler('opportunities', connection)

const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '4', 10)

const worker = new Worker(
  'opportunities',
  async (job) => {
    const { opportunityId, description } = job.data
    console.log(`Worker processing job ${job.id} -> opportunity ${opportunityId}`)

    try {
      await extractSkillsWithAI(opportunityId, description)
      return { success: true }
    } catch (err) {
      console.error(`Worker failed on opportunity ${opportunityId}:`, err)
      throw err
    }
  },
  { connection, concurrency }
)

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed after attempts:`, err?.message || err)
})

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed for opportunity ${job.data.opportunityId}`)
})

console.log('AI worker started, waiting for jobs...')
