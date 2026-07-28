// import { createClient } from '@/lib/supabase-server'
// import { NextResponse } from 'next/server'
// import { rateLimit } from '@/lib/rate-limit'

// export const dynamic = 'force-dynamic'

// export async function GET(request) {
//   try {
//     const supabase = await createClient()

//     const { data: { user }, error: authError } = await supabase.auth.getUser()
//     if (authError || !user?.id) {
//       return NextResponse.json(
//         { error: 'Unauthorized access denied' }, 
//         { status: 401 }
//       )
//     }

//     const { limited } = rateLimit(`list:${user.id}`, 30, 60000)
//     if (limited) {
//       return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
//     }

//     const { searchParams } = new URL(request.url)
//     const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
//     const offset = parseInt(searchParams.get('offset') || '0')
//     const sortBy = searchParams.get('sort') || 'created_at'
//     const sortDir = searchParams.get('dir') === 'asc' ? 'asc' : 'desc'
//     const sortMap = { created_at: 'created_at', company: 'company', title: 'title' }
//     const orderCol = sortMap[sortBy] || 'created_at'

//     const { data: opportunities, count, error: queryError } = await supabase
//       .from('opportunities')
//       .select(`
//         id, title, company, location, opportunity_type, description,
//         application_url, source, posted_at, created_at,
//         opportunity_skills ( importance_weight, is_mandatory, skills ( id, name ) ),
//         match_results ( match_score, estimated_time_to_close,
//           missing_skills ( id, skills ( id, name ) )
//         )
//       `, { count: 'estimated' })
//       .order(orderCol, { ascending: sortDir === 'asc', nullsFirst: false })
//       .range(offset, offset + limit - 1)

//     if (queryError) {
//       console.error('Database Retrieval Query Error:', queryError.message)
//       return NextResponse.json(
//         { error: 'Internal server query processing failure' }, 
//         { status: 500 }
//       )
//     }

//     return NextResponse.json({ opportunities, count, limit, offset }, { status: 200 })

//   } catch (err) {
//     console.error('Unexpected Global Data Fetch API Error:', err)
//     return NextResponse.json(
//       { error: 'Internal Server Error' }, 
//       { status: 500 }
//     )
//   }   
// }
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized access denied' },
        { status: 401 }
      )
    }

    const { limited } = rateLimit(
      `list:${user.id}`,
      30,
      60000
    )

    if (limited) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)

    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50'),
      200
    )

    const offset = parseInt(
      searchParams.get('offset') || '0'
    )

    const sortBy =
      searchParams.get('sort') || 'created_at'

    const sortDir =
      searchParams.get('dir') === 'asc'
        ? 'asc'
        : 'desc'

    const sortMap = {
      created_at: 'created_at',
      company: 'company',
      title: 'title',
    }

    const orderCol =
      sortMap[sortBy] || 'created_at'

    /*
     * Employer jobs must always appear before external jobs.
     *
     * First, count active employer jobs so pagination can continue
     * correctly when the user loads additional opportunities.
     */
    const {
      count: employerJobCount,
      error: employerCountError,
    } = await supabase
      .from('job_postings')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('is_active', true)

    if (employerCountError) {
      console.error(
        'Employer job count error:',
        employerCountError.message
      )

      return NextResponse.json(
        {
          error:
            'Internal server query processing failure',
        },
        { status: 500 }
      )
    }

    const totalEmployerJobs =
      employerJobCount || 0

    /*
     * Work out which part of this requested page should contain
     * employer jobs and which part should contain external jobs.
     */
    const employerStart =
      offset < totalEmployerJobs
        ? offset
        : totalEmployerJobs

    const employerJobsRemaining = Math.max(
      totalEmployerJobs - employerStart,
      0
    )

    const employerJobsToLoad = Math.min(
      employerJobsRemaining,
      limit
    )

    const externalJobsToLoad =
      limit - employerJobsToLoad

    const externalOffset = Math.max(
      offset - totalEmployerJobs,
      0
    )

    let employerJobs = []

    if (employerJobsToLoad > 0) {
      let employerQuery = supabase
        .from('job_postings')
        .select(`
          id,
          employer_id,
          title,
          company_name,
          location,
          employment_type,
          experience_level,
          description,
          requirements,
          salary_min,
          salary_max,
          is_active,
          created_at,
          updated_at
        `)
        .eq('is_active', true)

      /*
       * Employer jobs stay above API jobs, but they can still be
       * sorted among themselves using the selected sort option.
       */
      if (sortBy === 'company') {
        employerQuery = employerQuery.order(
          'company_name',
          {
            ascending: sortDir === 'asc',
            nullsFirst: false,
          }
        )
      } else if (sortBy === 'title') {
        employerQuery = employerQuery.order(
          'title',
          {
            ascending: sortDir === 'asc',
            nullsFirst: false,
          }
        )
      } else {
        employerQuery = employerQuery.order(
          'created_at',
          {
            ascending: sortDir === 'asc',
            nullsFirst: false,
          }
        )
      }

      const {
        data: employerJobRows,
        error: employerJobsError,
      } = await employerQuery.range(
        employerStart,
        employerStart + employerJobsToLoad - 1
      )

      if (employerJobsError) {
        console.error(
          'Employer jobs query error:',
          employerJobsError.message
        )

        return NextResponse.json(
          {
            error:
              'Internal server query processing failure',
          },
          { status: 500 }
        )
      }

      /*
       * Convert employer jobs to the same shape already expected
       * by app/opportunities/page.js.
       */
      employerJobs = (employerJobRows || []).map(
        job => ({
          id: job.id,
          employer_id: job.employer_id,
          title: job.title,
          company:
            job.company_name || 'Company',
          location: job.location,
          opportunity_type:
            job.employment_type,
          experience_level:
            job.experience_level,
          description: job.description,
          requirements: job.requirements,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          application_url: null,
          source: 'Employer',
          posted_at: job.created_at,
          created_at: job.created_at,
          updated_at: job.updated_at,
          is_employer_job: true,
          opportunity_skills: [],
          match_results: [],
        })
      )
    }

    let externalOpportunities = []
    let externalCount = 0

    if (externalJobsToLoad > 0) {
      const {
        data: opportunities,
        count,
        error: queryError,
      } = await supabase
        .from('opportunities')
        .select(
          `
            id,
            title,
            company,
            location,
            opportunity_type,
            description,
            application_url,
            source,
            posted_at,
            created_at,
            opportunity_skills (
              importance_weight,
              is_mandatory,
              skills (
                id,
                name
              )
            ),
            match_results (
              match_score,
              estimated_time_to_close,
              missing_skills (
                id,
                skills (
                  id,
                  name
                )
              )
            )
          `,
          { count: 'estimated' }
        )
        .order(orderCol, {
          ascending: sortDir === 'asc',
          nullsFirst: false,
        })
        .range(
          externalOffset,
          externalOffset + externalJobsToLoad - 1
        )

      if (queryError) {
        console.error(
          'Database Retrieval Query Error:',
          queryError.message
        )

        return NextResponse.json(
          {
            error:
              'Internal server query processing failure',
          },
          { status: 500 }
        )
      }

      externalOpportunities =
        opportunities || []

      externalCount = count || 0
    } else {
      /*
       * We still need the external count when the current page is
       * completely filled by employer jobs.
       */
      const {
        count,
        error: externalCountError,
      } = await supabase
        .from('opportunities')
        .select('id', {
          count: 'estimated',
          head: true,
        })

      if (externalCountError) {
        console.error(
          'External opportunity count error:',
          externalCountError.message
        )

        return NextResponse.json(
          {
            error:
              'Internal server query processing failure',
          },
          { status: 500 }
        )
      }

      externalCount = count || 0
    }

    /*
     * Employer jobs are deliberately placed first.
     * External API jobs remain below them.
     */
    const combinedOpportunities = [
      ...employerJobs,
      ...externalOpportunities,
    ]

    const combinedCount =
      totalEmployerJobs + externalCount

    return NextResponse.json(
      {
        opportunities: combinedOpportunities,
        count: combinedCount,
        employerJobCount: totalEmployerJobs,
        limit,
        offset,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error(
      'Unexpected Global Data Fetch API Error:',
      err
    )

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}