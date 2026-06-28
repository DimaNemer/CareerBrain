import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const supabase = await createClient()

    // 1. Strict Authorization Check
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized access denied' },
        { status: 401 }
      )
    }

    // 2. Fetch live tech jobs from the external Remotive API
    const apiResponse = await fetch('https://remotive.com/api/remote-jobs?limit=10', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 0 } 
    })

    if (!apiResponse.ok) throw new Error('External API service unavailable')
    
    const data = await apiResponse.json()
    const externalJobs = data.jobs || []

    if (externalJobs.length === 0) {
      return NextResponse.json({ message: 'No jobs found to sync' }, { status: 200 })
    }

    // 3. Data Sanitization & Mapping Original Publication Date
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
        
        // Write the remote website date field straight into your new Supabase column
        posted_at: job.publication_date || null 
      }
    })

    // 4. Secure Bulk Insertion
    const { data: insertedData, error: dbError } = await supabase
      .from('opportunities')
      .insert(formattedJobs)
      .select()

    if (dbError) {
      console.error('Supabase Sync Database Error:', dbError.message)
      return NextResponse.json(
        { error: 'Internal Server Error' }, 
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `Success! Synchronized ${insertedData?.length || 0} new opportunities.`,
      jobsAdded: insertedData?.length || 0
    }, { status: 200 })

  } catch (err) {
    console.error('Sync pipeline crashed safely:', err)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}