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
    role
  `)
  .eq('id', user.id)
  .single()

  if (profileError || !profile) {
    redirect('/dashboard')
  }

 

  const {
  data: membership,
  error: membershipError,
} = await supabase
  .from('company_members')
  .select(`
    company_id,
    role,
    job_title,
    companies (
      id,
      name,
      slug,
      logo_url,
      industry,
      company_size,
      location,
      website
    )
  `)
  .eq('user_id', user.id)
  .eq('is_current', true)
  .maybeSingle()

  if (membershipError) {
  console.error(
    'Employer company membership error:',
    membershipError.message
  )
}

if (!membership) {
  redirect('/dashboard')
}
const company = Array.isArray(membership.companies)
  ? membership.companies[0]
  : membership.companies
  if (!company) {
  redirect('/dashboard')
}
const companyRole = membership.role

const canManageTeam =
  companyRole === 'owner' ||
  companyRole === 'admin'

const canManageJobs =
  companyRole === 'owner' ||
  companyRole === 'admin' ||
  companyRole === 'recruiter'

const isReadOnly =
  companyRole === 'viewer'
  const { data: jobs, error: jobsError } = await supabase
    .from('job_postings')
    .select('id, title, location, employment_type, is_active, created_at')
   .eq('company_id', company.id)
    .order('created_at', { ascending: false })

  const safeJobs = jobsError ? [] : jobs || []

  const totalJobs = safeJobs.length
  const activeJobs = safeJobs.filter(job => job.is_active).length
  const inactiveJobs = safeJobs.filter(job => !job.is_active).length

const firstName =
  profile.full_name?.trim().split(' ')[0] ||
  'Member'

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
    <section className="employer-dashboard-header">
          <div>
            <p
              style={{
                margin: '0 0 8px',
                color: '#818CF8',
                fontWeight: 700,
                fontSize: '14px',
              }}
            >
              Company Workspace
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
           {isReadOnly
  ? `View your workspace at ${company.name}.`
  : `Manage your workspace at ${company.name}.`}
            </p>
          </div>

       <div
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  }}
>
  <Link
    href={`/profile/${user.id}?from=${encodeURIComponent(
      '/employer/dashboard'
    )}`}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '13px 18px',
      borderRadius: '12px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.10)',
      color: '#fff',
      textDecoration: 'none',
      fontWeight: 700,
    }}
  >
    My profile
  </Link>

  <Link
    href={`/company/${company.id}?from=${encodeURIComponent(
      '/employer/dashboard'
    )}`}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '13px 18px',
      borderRadius: '12px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.10)',
      color: '#fff',
      textDecoration: 'none',
      fontWeight: 700,
    }}
  >
    View company
  </Link>
{canManageTeam && (
  <Link
    href="/employer/team"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '13px 18px',
      borderRadius: '12px',
      background: 'rgba(255,255,255,0.05)',
      border:
        '1px solid rgba(255,255,255,0.10)',
      color: '#fff',
      textDecoration: 'none',
      fontWeight: 700,
    }}
  >
    Manage team
  </Link>
)}
  {canManageJobs && (
  <Link
    href="/employer/jobs/new"
    className="employer-create-job"
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
      boxShadow:
        '0 4px 16px rgba(91,79,232,0.35)',
    }}
  >
    + Create job
  </Link>
)}
</div>
        </section>

      <section className="employer-dashboard-stats">
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
              Jobs posted by {company.name}.
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

             {canManageJobs && (
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
)}
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
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '18px',
        borderRadius: '14px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        textDecoration: 'none',
        color: '#fff',
      }}
    >
      <div>
        <h3
          style={{
            margin: '0 0 7px',
            fontSize: '16px',
            fontWeight: 600,
          }}
        >
          {job.title}
        </h3>

        <p
          style={{
            margin: 0,
            color: 'rgba(255,255,255,0.5)',
            fontSize: '13px',
          }}
        >
          {job.location || 'Location not specified'}
          {' · '}
          {job.employment_type || 'Not specified'}
        </p>
      </div>

      <span
        style={{
          padding: '7px 12px',
          borderRadius: '999px',
          background: job.is_active
            ? 'rgba(16,185,129,0.14)'
            : 'rgba(148,163,184,0.12)',
          border: job.is_active
            ? '1px solid rgba(16,185,129,0.28)'
            : '1px solid rgba(148,163,184,0.20)',
          color: job.is_active
            ? '#6EE7B7'
            : '#CBD5E1',
          fontSize: '12px',
          fontWeight: 700,
          whiteSpace: 'nowrap',
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
      <style>{`
  .employer-dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 32px;
    flex-wrap: wrap;
  }

  .employer-dashboard-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 32px;
  }

  .employer-stat-card {
    min-width: 0;
  }

  @media (max-width: 600px) {
    .employer-dashboard-header {
      gap: 16px;
      margin-bottom: 24px;
    }

    .employer-dashboard-stats {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      margin-bottom: 24px;
    }

    .employer-stat-card {
      padding: 14px 10px !important;
      border-radius: 12px !important;
    }

    .employer-stat-label {
      font-size: 11px !important;
      margin-bottom: 6px !important;
    }

    .employer-stat-value {
      font-size: 22px !important;
    }

    .employer-create-job {
      padding: 11px 16px !important;
      font-size: 14px;
    }
  }

  @media (max-width: 380px) {
    .employer-dashboard-stats {
      gap: 6px;
    }

    .employer-stat-card {
      padding: 12px 7px !important;
    }

    .employer-stat-label {
      font-size: 10px !important;
    }

    .employer-stat-value {
      font-size: 20px !important;
    }
  }
`}</style>
    </main>
  )
}

function StatCard({ label, value }) {
  return (
    <div
     className="employer-stat-card"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '20px',
      }}
    >
    <p
  className="employer-stat-label"
  style={{
    margin: '0 0 8px',
    color: 'rgba(255,255,255,0.42)',
    fontSize: '13px',
  }}
>
        {label}
      </p>

   <p
  className="employer-stat-value"
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