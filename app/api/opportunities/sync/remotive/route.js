import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { extractSkillsWithAI } from '@/lib/ai-skills'

export async function POST(request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized access denied' }, { status: 401 })
    }

    const apiResponse = await fetch('https://remotive.com/api/remote-jobs?limit=10', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 0 }
    })

    if (!apiResponse.ok) throw new Error('External API service unavailable')
    
    const data = await apiResponse.json()
    const externalJobs = (data.jobs || []).slice(0, 10)

    if (externalJobs.length === 0) {
      return NextResponse.json({ message: 'No jobs found to sync' }, { status: 200 })
    }

    const formattedJobs = externalJobs.map(job => {
      const cleanDescription = job.description 
        ? job.description.replace(/<[^>]*>/g, '').substring(0, 500) + '...'
        : 'No description provided.'

      return {
        title: job.title || 'Untitled Position',
        company: job.company_name || 'Anonymous Company',
        location: job.candidate_required_location || 'Remote',
        opportunity_type: job.job_type || 'Full-time',
        description: cleanDescription,
        application_url: job.url || '',
        source: 'Remotive',
        posted_at: job.publication_date || null
      }
    })

    // Deduplicate against existing jobs (match by title + company)
    const uniqueTitles = [...new Set(formattedJobs.map(j => j.title))]
    const { data: existing } = await supabase
      .from('opportunities')
      .select('title, company')
      .in('title', uniqueTitles)

    const existingKeys = new Set((existing || []).map(j => `${j.title}|${j.company}`))
    const newJobs = formattedJobs.filter(j => !existingKeys.has(`${j.title}|${j.company}`))

    if (newJobs.length === 0) {
      return NextResponse.json({ message: 'No new remote jobs to sync (all already exist)' }, { status: 200 })
    }

    const { data: insertedData, error: dbError } = await supabase
      .from('opportunities')
      .insert(newJobs)
      .select()

    if (dbError) {
      console.error('Supabase Sync Database Error:', dbError.message)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }

    if (insertedData && insertedData.length > 0) {
      for (const job of insertedData) {
        try {
          await extractSkillsWithAI(job.id, job.description)
        } catch (individualError) {
          console.error(`Isolated pipeline failure on job ${job.id}:`, individualError.message)
        }
      }
    }

    return NextResponse.json({
      message: `Success! Synchronized ${insertedData?.length || 0} new remote opportunities.`,
      jobsAdded: insertedData?.length || 0
    }, { status: 200 })

  } catch (err) {
    console.error('Sync pipeline crash loop caught safely:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
