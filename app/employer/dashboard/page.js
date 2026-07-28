import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function EmployerDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      full_name,
      username,
      role,
      company_name,
      company_industry,
      company_location,
      company_website
    `)
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/dashboard')
  }

  if (profile.role !== 'employer') {
    redirect('/dashboard')
  }

  const { data: jobs, error: jobsError } = await supabase
    .from('job_postings')
    .select('id, title, location, employment_type, is_active, created_at')
    .eq('employer_id', user.id)
    .order('created_at', { ascending: false })

  const safeJobs = jobsError ? [] : jobs || []

  const totalJobs = safeJobs.length
  const activeJobs = safeJobs.filter(job => job.is_active).length
  const inactiveJobs = safeJobs.filter(job => !job.is_active).length

  const firstName =
    profile.full_name?.trim().split(' ')[0] ||
    profile.company_name ||
    'Employer'

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #0A0F1E 0%, #0D1528 50%, #0A0F1E 100%)',
        color: '#fff',
        padding: '40px 24px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1100px',
          margin: '0 auto',
        }}
      >
        <section
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '20px',
            marginBottom: '32px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <p
              style={{
                margin: '0 0 8px',
                color: '#818CF8',
                fontWeight: 700,
                fontSize: '14px',
              }}
            >
              Employer Dashboard
            </p>

            <h1
              style={{
                margin: '0 0 10px',
                fontSize: '32px',
                lineHeight: 1.2,
              }}
            >
              Welcome, {firstName}
            </h1>

            <p
              style={{
                margin: 0,
                color: 'rgba(255,255,255,0.5)',
                fontSize: '15px',
              }}
            >
              Manage job opportunities for{' '}
              {profile.company_name || 'your company'}.
            </p>
          </div>

          <Link
            href="/employer/jobs/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '13px 20px',
              borderRadius: '12px',
              background:
                'linear-gradient(135deg, #5B4FE8, #7C3AED)',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 700,
              boxShadow: '0 4px 16px rgba(91,79,232,0.35)',
            }}
          >
            + Create job
          </Link>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <StatCard label="Total jobs" value={totalJobs} />
          <StatCard label="Active jobs" value={activeJobs} />
          <StatCard label="Inactive jobs" value={inactiveJobs} />
        </section>

        <section
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            <div>
              <h2
                style={{
                  margin: '0 0 6px',
                  fontSize: '20px',
                }}
              >
                Your jobs
              </h2>

              <p
                style={{
                  margin: 0,
                  color: 'rgba(255,255,255,0.42)',
                  fontSize: '13px',
                }}
              >
                Jobs posted by your employer account.
              </p>
            </div>
          </div>

          {safeJobs.length === 0 ? (
            <div
              style={{
                padding: '36px 16px',
                textAlign: 'center',
                border: '1px dashed rgba(255,255,255,0.12)',
                borderRadius: '14px',
              }}
            >
              <p
                style={{
                  margin: '0 0 14px',
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                You have not created any jobs yet.
              </p>

              <Link
                href="/employer/jobs/new"
                style={{
                  color: '#818CF8',
                  textDecoration: 'none',
                  fontWeight: 700,
                }}
              >
                Create your first job
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {safeJobs.map(job => (
             <Link
  key={job.id}
  href={`/employer/jobs/${job.id}`}
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    borderRadius: '14px',
    background: 'rgba(255,255,255,0.035)',
    border: '1px solid rgba(255,255,255,0.07)',
    flexWrap: 'wrap',
    textDecoration: 'none',
    color: '#fff',
    cursor: 'pointer',
  }}
>
                  <div>
                    <h3
                      style={{
                        margin: '0 0 6px',
                        fontSize: '16px',
                      }}
                    >
                      {job.title}
                    </h3>

                    <p
                      style={{
                        margin: 0,
                        color: 'rgba(255,255,255,0.45)',
                        fontSize: '13px',
                      }}
                    >
                      {job.location || 'Location not specified'}
                      {job.employment_type
                        ? ` · ${job.employment_type}`
                        : ''}
                    </p>
                  </div>

                  <span
                    style={{
                      padding: '6px 10px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: job.is_active ? '#6EE7B7' : '#FCA5A5',
                      background: job.is_active
                        ? 'rgba(16,185,129,0.12)'
                        : 'rgba(239,68,68,0.12)',
                      border: job.is_active
                        ? '1px solid rgba(16,185,129,0.22)'
                        : '1px solid rgba(239,68,68,0.22)',
                    }}
                  >
                    {job.is_active ? 'Active' : 'Inactive'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function StatCard({ label, value }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '20px',
      }}
    >
      <p
        style={{
          margin: '0 0 8px',
          color: 'rgba(255,255,255,0.42)',
          fontSize: '13px',
        }}
      >
        {label}
      </p>

      <p
        style={{
          margin: 0,
          fontSize: '28px',
          fontWeight: 800,
        }}
      >
        {value}
      </p>
    </div>
  )
}