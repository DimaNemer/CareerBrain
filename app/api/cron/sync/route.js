import { createServiceClient } from '@/lib/supabase-service'
import { NextResponse } from 'next/server'
import { embedAllSkills } from '@/lib/embed-skills'
import { extractSkillsWithAI } from '@/lib/ai-skills'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const results = { embed: false, adzuna: 0, remotive: 0, match: false }
    const errors = []

    // 1. Seed master skills
    try {
      await embedAllSkills()
      results.embed = true
    } catch (err) { errors.push(`embed: ${err.message}`) }

    // 2. Fetch Adzuna jobs
    try {
      const adzunaUrl = new URL('https://api.adzuna.com/v1/api/jobs/gb/search/1')
      adzunaUrl.searchParams.set('app_id', process.env.ADZUNA_APP_ID)
      adzunaUrl.searchParams.set('app_key', process.env.ADZUNA_APP_KEY)
      adzunaUrl.searchParams.set('results_per_page', '10')
      adzunaUrl.searchParams.set('content-type', 'application/json')
      const apiRes = await fetch(adzunaUrl.toString())
      if (apiRes.ok) {
        const data = await apiRes.json()
        const jobs = (data.results || []).slice(0, 10)
        const insertedJobs = []
        for (const job of jobs) {
          const cleanDesc = (job.description || '').replace(/<[^>]*>/g, '').substring(0, 500)
          const { data: inserted } = await supabase.from('opportunities')
            .upsert({
              title: job.title || 'Untitled',
              company: job.company?.display_name || 'Unknown',
              location: job.location?.display_name || 'Remote',
              opportunity_type: job.contract_type || 'Full-time',
              description: cleanDesc,
              application_url: job.redirect_url || '',
              source: 'Adzuna',
              posted_at: job.created || null
            }, { onConflict: 'title,company', ignoreDuplicates: true })
            .select('id, description')
          if (inserted) {
            insertedJobs.push(...inserted.filter(j => j.description))
            results.adzuna += inserted.length
          }
        }
        const batchSize = 3
        for (let i = 0; i < insertedJobs.length; i += batchSize) {
          await Promise.allSettled(
            insertedJobs.slice(i, i + batchSize).map(j => extractSkillsWithAI(j.id, j.description))
          )
        }
      }
    } catch (err) { errors.push(`adzuna: ${err.message}`) }

    // 3. Fetch Remotive jobs
    try {
      const apiRes = await fetch('https://remotive.com/api/remote-jobs?limit=10')
      if (apiRes.ok) {
        const data = await apiRes.json()
        const jobs = (data.jobs || []).slice(0, 10)
        const insertedJobs = []
        for (const job of jobs) {
          const cleanDesc = (job.description || '').replace(/<[^>]*>/g, '').substring(0, 500)
          const { data: inserted } = await supabase.from('opportunities')
            .upsert({
              title: job.title || 'Untitled',
              company: job.company_name || 'Unknown',
              location: job.candidate_required_location || 'Remote',
              opportunity_type: job.job_type || 'Full-time',
              description: cleanDesc,
              application_url: job.url || '',
              source: 'Remotive',
              posted_at: job.publication_date || null
            }, { onConflict: 'title,company', ignoreDuplicates: true })
            .select('id, description')
          if (inserted) {
            insertedJobs.push(...inserted.filter(j => j.description))
            results.remotive += inserted.length
          }
        }
        const batchSize = 3
        for (let i = 0; i < insertedJobs.length; i += batchSize) {
          await Promise.allSettled(
            insertedJobs.slice(i, i + batchSize).map(j => extractSkillsWithAI(j.id, j.description))
          )
        }
      }
    } catch (err) { errors.push(`remotive: ${err.message}`) }

    // 4. Try match (runs per-user externally, this is best-effort)
    try {
      const { error: rpcErr } = await supabase.rpc('calculate_user_job_matches', { target_user_id: null })
      if (rpcErr && !rpcErr.message.includes('violates')) {
        errors.push(`match: ${rpcErr.message}`)
      } else {
        results.match = true
      }
    } catch (err) { errors.push(`match: ${err.message}`) }

    const ok = results.embed || results.adzuna > 0 || results.remotive > 0
    return NextResponse.json({
      message: ok ? 'Cron sync completed' : 'Cron sync had errors',
      results,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    }, { status: ok ? 200 : 500 })
  } catch (err) {
    console.error('Cron sync error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
