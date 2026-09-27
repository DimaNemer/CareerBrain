import { createServiceClient } from '@/lib/supabase-service'
import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function PublicCompanyProfilePage({
  params,
  searchParams,
}) {
const publicSupabase = createServiceClient()
const supabase = await createClient()

  const { id } = await params
  const resolvedSearchParams = await searchParams

  const backUrl =
    typeof resolvedSearchParams?.from === 'string' &&
    resolvedSearchParams.from.startsWith('/')
      ? resolvedSearchParams.from
      : '/opportunities'

  const {
  data: company,
  error: companyError,
} = await publicSupabase
  .from('companies')
  .select(`
    id,
    name,
    slug,
    logo_url,
    description,
    industry,
    company_size,
    location,
    website,
    company_values,
    company_benefits,
    created_by
  `)
  .eq('id', id)
  .maybeSingle()

if (companyError) {
  console.error(
    'Public company profile error:',
    companyError.message
  )
}

if (!company) {
  notFound()
}
const {
  data: { user: viewer },
} = await supabase.auth.getUser()

let canEditCompany = false

if (viewer) {
  const { data: viewerMembership } = await publicSupabase
    .from('company_members')
    .select('role')
    .eq('company_id', company.id)
    .eq('user_id', viewer.id)
    .eq('is_current', true)
    .maybeSingle()

  canEditCompany =
    viewerMembership?.role === 'owner' ||
    viewerMembership?.role === 'admin'
}
  const {
    data: jobs,
    error: jobsError,
  } = await publicSupabase
    .from('job_postings')
    .select(`
      id,
      title,
      location,
      employment_type,
      experience_level,
      description,
      salary_min,
      salary_max,
      is_active,
      created_at
    `)
    .eq('company_id', company.id)
    .eq('is_active', true)
    .order('created_at', {
      ascending: false,
    })

  if (jobsError) {
    console.error(
      'Public company jobs error:',
      jobsError.message
    )
  }

  const {
    data: posts,
    error: postsError,
  } = await publicSupabase
    .from('company_posts')
    .select(`
      id,
      title,
      content,
      image_url,
      created_at,
      updated_at
    `)
    .eq('company_id', company.id)
    .order('created_at', {
      ascending: false,
    })

  if (postsError) {
    console.error(
      'Public company posts error:',
      postsError.message
    )
  }

const {
  data: members,
  error: membersError,
} = await publicSupabase
  .from('company_members')
  .select(`
    id,
    user_id,
    job_title,
    role,
    profiles (
      id,
      full_name,
      username,
      headline,
      location
    )
  `)
  .eq('company_id', company.id)
  .eq('is_current', true)
  .order('created_at', {
    ascending: true,
  })

if (membersError) {
  console.error(
    'Public company members error:',
    membersError.message
  )
}

const safeMembers = membersError ? [] : members || []

const ownerMembership =
  safeMembers.find(member => member.role === 'owner') ||
  null

const ownerProfile = Array.isArray(
  ownerMembership?.profiles
)
  ? ownerMembership.profiles[0]
  : ownerMembership?.profiles

  const safeJobs = jobsError ? [] : jobs || []
  const safePosts = postsError ? [] : posts || []

const safeWebsite = getSafeWebsite(
  company.website
)

  const companyDisplayName =
  company.name || 'Company'

  const companyInitials = getInitials(
    companyDisplayName
  )

 return (
  <main
    className="public-company-page"
    style={pageStyle}
  >
    <style>{`
      @media screen and (max-width: 768px) {
        .public-company-page {
          padding: 24px 16px 50px !important;
        }

        /* HERO */

        .public-company-hero {
          padding: 22px !important;
          border-radius: 20px !important;
        }

        .public-company-hero-content {
          gap: 16px !important;
          align-items: flex-start !important;
        }

        .public-company-logo {
          width: 68px !important;
          height: 68px !important;
          border-radius: 18px !important;
          font-size: 21px !important;
        }

        .public-company-identity {
          min-width: 0 !important;
          width: 100% !important;
        }

        .public-company-name {
          font-size: 27px !important;
          overflow-wrap: break-word !important;
          word-break: normal !important;
        }

        .public-company-meta {
          gap: 7px 12px !important;
        }

        .public-company-hero-stats {
          margin-top: 22px !important;
        }

        /* MAIN FIX */

        .public-company-content-grid {
          display: flex !important;
          flex-direction: column !important;
          width: 100% !important;
          gap: 18px !important;
        }

        .public-company-main-column,
        .public-company-side-column {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          gap: 18px !important;
        }

        /* MAIN SECTIONS */

        .public-company-section,
        .public-company-side-card,
        .public-company-website-card {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
          padding: 18px !important;
          border-radius: 16px !important;
        }

        .public-company-body-text,
        .public-company-post-content {
          overflow-wrap: break-word !important;
          word-break: normal !important;
        }

        /* COMPANY DETAILS */

        .public-company-detail-row {
          width: 100% !important;
          gap: 12px !important;
        }

        .public-company-detail-label {
          flex: 1 1 42% !important;
          min-width: 0 !important;
        }

        .public-company-detail-value {
          flex: 1 1 58% !important;
          min-width: 0 !important;
          overflow-wrap: break-word !important;
          word-break: normal !important;
        }

        /* OPEN POSITIONS */

        .public-company-job-card {
          padding: 14px !important;
          gap: 12px !important;
        }

        .public-company-job-main {
          width: 100% !important;
          flex: 1 1 100% !important;
          min-width: 0 !important;
        }

        .public-company-job-info {
          flex: 1 !important;
          min-width: 0 !important;
        }

        .public-company-job-title,
        .public-company-job-meta {
          overflow-wrap: break-word !important;
          word-break: normal !important;
        }

        .public-company-view-job {
          width: 100% !important;
          text-align: right !important;
        }
      }

      @media screen and (max-width: 480px) {
        .public-company-page {
          padding: 20px 14px 40px !important;
        }

        .public-company-hero {
          padding: 18px !important;
        }

        .public-company-logo {
          width: 58px !important;
          height: 58px !important;
          border-radius: 16px !important;
          font-size: 18px !important;
        }

        .public-company-name {
          font-size: 24px !important;
        }

        .public-company-hero-stat {
          padding: 12px 6px !important;
        }

        .public-company-section,
        .public-company-side-card,
        .public-company-website-card {
          padding: 16px !important;
        }

        .public-company-job-icon {
          width: 38px !important;
          height: 38px !important;
          border-radius: 10px !important;
        }
      }
    `}</style>

    <div style={containerStyle}>
        <Link
          href={backUrl}
          style={backLinkStyle}
        >
          ← Back
        </Link>

        <section
  className="public-company-hero"
  style={heroStyle}
>
          <div style={heroPatternStyle} />

         <div
  className="public-company-hero-content"
  style={heroContentStyle}
>
            <div
  className="public-company-logo"
  style={companyLogoStyle}
>
          {company.logo_url ? (
  <img
    src={company.logo_url}
    alt={`${companyDisplayName} logo`}
    style={companyLogoImageStyle}
  />
) : (
  companyInitials
)}
            </div>

           <div
  className="public-company-identity"
  style={companyIdentityStyle}
>
              <p style={eyebrowStyle}>
                Company profile
              </p>

              <h1
  className="public-company-name"
  style={companyNameStyle}
>
                {companyDisplayName}
              </h1>

    

              <div
  className="public-company-meta"
  style={companyMetaStyle}
>
        {company.industry && (
  <span>{company.industry}</span>
)}

{company.location && (
  <span>📍 {company.location}</span>
)}

{company.company_size && (
  <span>
    👥 {formatCompanySize(company.company_size)}
  </span>
)}
              </div>
<div
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginTop: '17px',
  }}
>
  {safeWebsite && (
    <a
      href={safeWebsite}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        ...websiteLinkStyle,
        marginTop: 0,
      }}
    >
      Visit company website ↗
    </a>
  )}

  {canEditCompany && (
    <Link
      href="/employer/profile/edit"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '9px 14px',
        borderRadius: '9px',
        background: '#FFFFFF',
        color: '#3730A3',
        textDecoration: 'none',
        fontSize: '12px',
        fontWeight: 700,
        border: '1px solid rgba(255,255,255,0.7)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      }}
    >
      Edit company
    </Link>
  )}
</div>
            </div>
          </div>

         <div
  className="public-company-meta"
  style={companyMetaStyle}
>
           <HeroStat
  label="Open jobs"
  value={safeJobs.length}
/>

<HeroStat
  label="Company posts"
  value={safePosts.length}
/>

<HeroStat
  label="People"
  value={safeMembers.length}
  last
/>
          </div>
        </section>

        <section
  className="public-company-content-grid"
  style={contentGridStyle}
>
         <div
  className="public-company-main-column"
  style={mainColumnStyle}
>
            {company.description && (
              <Section title="About the company">
                <p
  className="public-company-body-text"
  style={bodyTextStyle}
>
                  {company.description}
                </p>
              </Section>
            )}


            {company.company_values && (
              <Section title="Company values">
               <p
  className="public-company-body-text"
  style={bodyTextStyle}
>
                  {company.company_values}
                </p>
              </Section>
            )}

            {company.company_benefits && (
              <Section title="Benefits and workplace">
               <p
  className="public-company-body-text"
  style={bodyTextStyle}
>
                  {company.company_benefits}
                </p>
              </Section>
            )}
<Section
  title="People"
  count={safeMembers.length}
>
  {safeMembers.length === 0 ? (
    <EmptyState
      icon="👥"
      message="No team members are currently listed."
    />
  ) : (
    <div style={membersGridStyle}>
      {safeMembers.map(member => {
        const memberProfile = Array.isArray(
          member.profiles
        )
          ? member.profiles[0]
          : member.profiles

        if (!memberProfile) {
          return null
        }

        const memberName =
          memberProfile.full_name || 'Team member'

        return (
          <Link
            key={member.id}
            href={`/profile/${member.user_id}?from=${encodeURIComponent(
              `/company/${company.id}`
            )}`}
            style={memberCardStyle}
          >
            <div style={memberAvatarStyle}>
              {getInitials(memberName)}
            </div>

            <div style={memberInfoStyle}>
              <h3 style={memberNameStyle}>
                {memberName}
              </h3>

              <p style={memberJobTitleStyle}>
                {member.job_title ||
                  memberProfile.headline ||
                  'Team member'}
              </p>

              {memberProfile.location && (
                <p style={memberLocationStyle}>
                  📍 {memberProfile.location}
                </p>
              )}

              <span style={viewProfileStyle}>
                View profile →
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )}
</Section>
            <Section
              title="Company updates"
              count={safePosts.length}
            >
              {safePosts.length === 0 ? (
                <EmptyState
                  icon="📝"
                  message="This company has not shared any updates yet."
                />
              ) : (
                <div style={postsListStyle}>
                  {safePosts.map(post => (
                    <article
                      key={post.id}
                      style={postCardStyle}
                    >
                      <div style={postHeaderStyle}>
                        <div>
                          <p style={postCompanyStyle}>
                            {companyDisplayName}
                          </p>

                          <p style={postDateStyle}>
                            {formatDate(
                              post.created_at
                            )}
                          </p>
                        </div>
                      </div>

                      <h3 style={postTitleStyle}>
                        {post.title}
                      </h3>

                      <p
  className="public-company-post-content"
  style={postContentStyle}
>
                        {post.content}
                      </p>

                      {post.image_url && (
                        <div style={postImageWrapperStyle}>
                          <img
                            src={post.image_url}
                            alt={post.title}
                            style={postImageStyle}
                          />
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </Section>

            <Section
              title="Open positions"
              count={safeJobs.length}
            >
              {safeJobs.length === 0 ? (
                <EmptyState
                  icon="💼"
                  message="This company does not currently have any active job openings."
                />
              ) : (
                <div style={jobsListStyle}>
                  {safeJobs.map(job => (
                    <Link
                      key={job.id}
                      href={`/opportunities/${job.id}?from=${encodeURIComponent(
                        `/company/${company.id}`
                      )}`}
                      className="public-company-job-card"
  style={jobCardStyle}
                    >
                     <div
  className="public-company-job-main"
  style={jobMainStyle}
>
                        <div
  className="public-company-job-icon"
  style={jobIconStyle}
>
                          💼
                        </div>

                        <div
  className="public-company-job-info"
  style={jobInfoStyle}
>
                          <h3
  className="public-company-job-title"
  style={jobTitleStyle}
>
                            {job.title}
                          </h3>

                          <p
  className="public-company-job-meta"
  style={jobMetaStyle}
>
                            {job.location ||
                              'Location not specified'}

                            {job.employment_type
                              ? ` · ${formatLabel(
                                  job.employment_type
                                )}`
                              : ''}

                            {job.experience_level
                              ? ` · ${formatLabel(
                                  job.experience_level
                                )}`
                              : ''}
                          </p>

                          {hasSalary(job) && (
                            <p style={salaryStyle}>
                              {formatSalary(job)}
                            </p>
                          )}
                        </div>
                      </div>

                      <span
  className="public-company-view-job"
  style={viewJobStyle}
>
                        View job →
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </Section>
          </div>

          <aside
  className="public-company-side-column"
  style={sideColumnStyle}
>
           <section
  className="public-company-side-card"
  style={sideCardStyle}
>
              <h2 style={sideTitleStyle}>
                Company details
              </h2>

              <div style={detailsListStyle}>
             <DetailRow
  label="Company"
  value={companyDisplayName}
/>

<DetailRow
  label="Industry"
  value={
    company.industry ||
    'Not specified'
  }
/>

<DetailRow
  label="Company size"
  value={
    company.company_size
      ? formatCompanySize(
          company.company_size
        )
      : 'Not specified'
  }
/>

<DetailRow
  label="Location"
  value={
    company.location ||
    'Not specified'
  }
/>

<DetailRow
  label="Representative"
  value={
    ownerProfile?.full_name ||
    'Not specified'
  }
/>

{ownerProfile?.username && (
  <DetailRow
    label="Username"
    value={`@${ownerProfile.username}`}
  />
)}

{ownerMembership?.job_title && (
  <DetailRow
    label="Job title"
    value={ownerMembership.job_title}
  />
)}
              </div>
            </section>

            {safeWebsite && (
              <section
  className="public-company-website-card"
  style={websiteCardStyle}
>
                <p style={websiteEyebrowStyle}>
                  Official website
                </p>

                <h2 style={websiteTitleStyle}>
                  Learn more about{' '}
                  {companyDisplayName}
                </h2>

                <p style={websiteDescriptionStyle}>
                  Visit the company website for more
                  information about its services,
                  products and culture.
                </p>

                <a
                  href={safeWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={websiteButtonStyle}
                >
                  Visit website ↗
                </a>
              </section>
            )}
<section
  className="public-company-side-card"
  style={sideCardStyle}
>
              <h2 style={sideTitleStyle}>
                Hiring activity
              </h2>

              <p style={hiringTextStyle}>
                This company currently has{' '}
                <strong>
                  {safeJobs.length}
                </strong>{' '}
                active{' '}
                {safeJobs.length === 1
                  ? 'position'
                  : 'positions'}{' '}
                available.
              </p>

              <Link
                href={`/opportunities?company=${encodeURIComponent(
                  companyDisplayName
                )}`}
                style={jobsButtonStyle}
              >
                View company jobs
              </Link>
            </section>
          </aside>
        </section>
      </div>
    </main>
  )
}

function Section({
  title,
  count,
  children,
}) {
  return (
    <section
      className="public-company-section"
      style={sectionStyle}
    >
      <div style={sectionHeaderStyle}>
        <h2 style={sectionTitleStyle}>
          {title}
        </h2>

        {count !== undefined && (
          <span style={countBadgeStyle}>
            {count}
          </span>
        )}
      </div>

      {children}
    </section>
  )
}

function HeroStat({
  label,
  value,
  last = false,
  small = false,
}) {
  return (
   <div
  className="public-company-hero-stat"
  style={{
    ...heroStatStyle,
    borderRight: last
      ? 'none'
      : '1px solid rgba(255,255,255,0.08)',
  }}
>
      <p
        style={{
          ...heroStatValueStyle,
          fontSize: small ? '14px' : '24px',
        }}
      >
        {value}
      </p>

      <p style={heroStatLabelStyle}>
        {label}
      </p>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div
      className="public-company-detail-row"
      style={detailRowStyle}
    >
      <span
        className="public-company-detail-label"
        style={detailLabelStyle}
      >
        {label}
      </span>

      <span
        className="public-company-detail-value"
        style={detailValueStyle}
      >
        {value}
      </span>
    </div>
  )
}

function EmptyState({ icon, message }) {
  return (
    <div style={emptyStateStyle}>
      <div style={emptyIconStyle}>
        {icon}
      </div>

      <p style={emptyTextStyle}>
        {message}
      </p>
    </div>
  )
}

function getInitials(value) {
  return (
    String(value || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'CO'
  )
}

function getSafeWebsite(value) {
  if (!value || typeof value !== 'string') {
    return null
  }

  try {
    const url = new URL(value)

    if (
      url.protocol !== 'http:' &&
      url.protocol !== 'https:'
    ) {
      return null
    }

    return url.toString()
  } catch {
    return null
  }
}

function formatCompanySize(value) {
  if (!value) {
    return 'Not specified'
  }

  return `${value} employees`
}

function formatLabel(value) {
  if (!value) return ''

  if (value === 'mid') {
    return 'Mid-level'
  }

  return String(value)
    .split('-')
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(' ')
}

function formatDate(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function hasSalary(job) {
  return (
    job.salary_min !== null ||
    job.salary_max !== null
  )
}

function formatSalary(job) {
  if (
    job.salary_min !== null &&
    job.salary_max !== null
  ) {
    return `$${Number(
      job.salary_min
    ).toLocaleString()} – $${Number(
      job.salary_max
    ).toLocaleString()}`
  }

  if (job.salary_min !== null) {
    return `From $${Number(
      job.salary_min
    ).toLocaleString()}`
  }

  return `Up to $${Number(
    job.salary_max
  ).toLocaleString()}`
}

const pageStyle = {
  minHeight: '100vh',
  background: '#F1F3F7',
  padding: '28px 24px 60px',
  fontFamily:
    'Inter, system-ui, sans-serif',
}

const containerStyle = {
  width: '100%',
  maxWidth: '1100px',
  margin: '0 auto',
}

const backLinkStyle = {
  display: 'inline-flex',
  marginBottom: '22px',
  color: '#64748B',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 600,
}

const heroStyle = {
  position: 'relative',
  overflow: 'hidden',
  padding: '34px',
  marginBottom: '24px',
  borderRadius: '24px',
  background:
    'linear-gradient(135deg, #211D59 0%, #37319A 55%, #111936 100%)',
  color: '#FFFFFF',
  boxShadow:
    '0 16px 38px rgba(17,24,39,0.14)',
}

const heroPatternStyle = {
  position: 'absolute',
  inset: 0,
  backgroundImage:
    'radial-gradient(rgba(255,255,255,0.065) 1px, transparent 1px)',
  backgroundSize: '28px 28px',
  pointerEvents: 'none',
}

const heroContentStyle = {
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: '22px',
  flexWrap: 'wrap',
}

const companyLogoStyle = {
  width: '94px',
  height: '94px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  overflow: 'hidden',
  borderRadius: '24px',
  background:
    'linear-gradient(135deg, #5B4FE8, #818CF8)',
  border:
    '3px solid rgba(255,255,255,0.18)',
  color: '#FFFFFF',
  fontSize: '28px',
  fontWeight: 800,
  boxShadow:
    '0 8px 28px rgba(0,0,0,0.25)',
}

const companyLogoImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
}

const companyIdentityStyle = {
  flex: 1,
  minWidth: '220px',
}

const eyebrowStyle = {
  margin: '0 0 7px',
  color: '#A5B4FC',
  fontSize: '13px',
  fontWeight: 700,
}

const companyNameStyle = {
  margin: '0 0 8px',
  color: '#FFFFFF',
  fontSize: '34px',
  lineHeight: 1.2,
}

const headlineStyle = {
  margin: '0 0 14px',
  color:
    'rgba(255,255,255,0.68)',
  fontSize: '15px',
  lineHeight: 1.6,
}

const companyMetaStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px 16px',
  color:
    'rgba(255,255,255,0.48)',
  fontSize: '13px',
}

const websiteLinkStyle = {
  display: 'inline-flex',
  marginTop: '17px',
  color: '#C7D2FE',
  textDecoration: 'none',
  fontSize: '13px',
  fontWeight: 700,
}

const heroStatsStyle = {
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  gridTemplateColumns:
    'repeat(3, minmax(0, 1fr))',
  marginTop: '30px',
  borderRadius: '15px',
  background:
    'rgba(255,255,255,0.045)',
  border:
    '1px solid rgba(255,255,255,0.09)',
  overflow: 'hidden',
}

const heroStatStyle = {
  padding: '17px 12px',
  textAlign: 'center',
}

const heroStatValueStyle = {
  margin: '0 0 4px',
  color: '#FFFFFF',
  fontWeight: 800,
}

const heroStatLabelStyle = {
  margin: 0,
  color:
    'rgba(255,255,255,0.4)',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

const contentGridStyle = {
  display: 'grid',
  gridTemplateColumns:
    'minmax(0, 2fr) minmax(280px, 1fr)',
  gap: '24px',
  alignItems: 'start',
}

const mainColumnStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '18px',
  minWidth: 0,
}

const sideColumnStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '18px',
  minWidth: 0,
}

const sectionStyle = {
  padding: '24px',
  borderRadius: '20px',
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  boxShadow:
    '0 6px 18px rgba(15,23,42,0.035)',
}

const sectionHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '9px',
  marginBottom: '18px',
}

const sectionTitleStyle = {
  margin: 0,
  color: '#111827',
  fontSize: '17px',
}

const countBadgeStyle = {
  padding: '2px 8px',
  borderRadius: '20px',
  background: '#EEF2FF',
  color: '#4338CA',
  fontSize: '11px',
  fontWeight: 700,
}

const bodyTextStyle = {
  margin: 0,
  color: '#4B5563',
  fontSize: '14px',
  lineHeight: 1.85,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
}

const postsListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
}

const postCardStyle = {
  padding: '18px',
  borderRadius: '15px',
  background: '#F9FAFB',
  border: '1px solid #EEF0F3',
}

const postHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  marginBottom: '12px',
}

const postCompanyStyle = {
  margin: '0 0 3px',
  color: '#37319A',
  fontSize: '12px',
  fontWeight: 700,
}

const postDateStyle = {
  margin: 0,
  color: '#9CA3AF',
  fontSize: '11px',
}

const postTitleStyle = {
  margin: '0 0 9px',
  color: '#111827',
  fontSize: '16px',
}

const postContentStyle = {
  margin: 0,
  color: '#4B5563',
  fontSize: '14px',
  lineHeight: 1.75,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
}

const postImageWrapperStyle = {
  marginTop: '14px',
  overflow: 'hidden',
  borderRadius: '13px',
  border: '1px solid #E5E7EB',
  background: '#FFFFFF',
}

const postImageStyle = {
  display: 'block',
  width: '100%',
  maxHeight: '460px',
  objectFit: 'cover',
}

const jobsListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '11px',
}

const jobCardStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '18px',
  padding: '16px',
  borderRadius: '14px',
  background: '#F9FAFB',
  border: '1px solid #E5E7EB',
  color: '#111827',
  textDecoration: 'none',
  flexWrap: 'wrap',
}

const jobMainStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '13px',
  flex: '1 1 400px',
  minWidth: 0,
}

const jobIconStyle = {
  width: '42px',
  height: '42px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  borderRadius: '12px',
  background: '#EEF2FF',
  fontSize: '18px',
}

const jobInfoStyle = {
  minWidth: 0,
}

const jobTitleStyle = {
  margin: '0 0 5px',
  color: '#111827',
  fontSize: '15px',
}

const jobMetaStyle = {
  margin: 0,
  color: '#6B7280',
  fontSize: '12px',
  lineHeight: 1.5,
}

const salaryStyle = {
  margin: '5px 0 0',
  color: '#059669',
  fontSize: '12px',
  fontWeight: 700,
}

const viewJobStyle = {
  color: '#5B4FE8',
  fontSize: '12px',
  fontWeight: 700,
}

const sideCardStyle = {
  padding: '22px',
  borderRadius: '18px',
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
}

const sideTitleStyle = {
  margin: '0 0 16px',
  color: '#111827',
  fontSize: '16px',
}

const detailsListStyle = {
  display: 'flex',
  flexDirection: 'column',
}

const detailRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '14px',
  padding: '11px 0',
  borderBottom: '1px solid #F0F1F3',
}

const detailLabelStyle = {
  color: '#9CA3AF',
  fontSize: '12px',
}

const detailValueStyle = {
  color: '#374151',
  fontSize: '12px',
  fontWeight: 700,
  textAlign: 'right',
  overflowWrap: 'anywhere',
}

const websiteCardStyle = {
  padding: '22px',
  borderRadius: '18px',
  background:
    'linear-gradient(145deg, #EEF2FF, #F5F3FF)',
  border: '1px solid #DDE3FF',
}

const websiteEyebrowStyle = {
  margin: '0 0 7px',
  color: '#6366F1',
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

const websiteTitleStyle = {
  margin: '0 0 9px',
  color: '#1E1B4B',
  fontSize: '17px',
  lineHeight: 1.4,
}

const websiteDescriptionStyle = {
  margin: '0 0 16px',
  color: '#636B7D',
  fontSize: '12px',
  lineHeight: 1.65,
}

const websiteButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  boxSizing: 'border-box',
  padding: '11px 14px',
  borderRadius: '10px',
  background: '#4F46E5',
  color: '#FFFFFF',
  textDecoration: 'none',
  fontSize: '12px',
  fontWeight: 700,
}

const hiringTextStyle = {
  margin: '0 0 16px',
  color: '#6B7280',
  fontSize: '13px',
  lineHeight: 1.65,
}

const jobsButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  boxSizing: 'border-box',
  padding: '11px 14px',
  borderRadius: '10px',
  background: '#111827',
  color: '#FFFFFF',
  textDecoration: 'none',
  fontSize: '12px',
  fontWeight: 700,
}

const emptyStateStyle = {
  padding: '32px 18px',
  borderRadius: '14px',
  border: '1px dashed #D1D5DB',
  textAlign: 'center',
}
const membersGridStyle = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '14px',
}

const memberCardStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '14px',
  padding: '16px',
  borderRadius: '14px',
  background: '#F9FAFB',
  border: '1px solid #E5E7EB',
  textDecoration: 'none',
  color: '#111827',
}

const memberAvatarStyle = {
  width: '52px',
  height: '52px',
  minWidth: '52px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  background:
    'linear-gradient(135deg, #5B4FE8, #818CF8)',
  color: '#FFFFFF',
  fontSize: '16px',
  fontWeight: 800,
}

const memberInfoStyle = {
  minWidth: 0,
  flex: 1,
}

const memberNameStyle = {
  margin: '0 0 5px',
  color: '#111827',
  fontSize: '15px',
  fontWeight: 700,
}

const memberJobTitleStyle = {
  margin: '0 0 5px',
  color: '#4B5563',
  fontSize: '13px',
  lineHeight: 1.4,
}

const memberLocationStyle = {
  margin: '0 0 8px',
  color: '#9CA3AF',
  fontSize: '11px',
}

const viewProfileStyle = {
  color: '#5B4FE8',
  fontSize: '11px',
  fontWeight: 700,
}
const emptyIconStyle = {
  fontSize: '27px',
  marginBottom: '9px',
}

const emptyTextStyle = {
  margin: 0,
  color: '#9CA3AF',
  fontSize: '12px',
  lineHeight: 1.6,
}