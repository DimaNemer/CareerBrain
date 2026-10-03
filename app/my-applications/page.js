'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

/**
 * The applicant's own applications and where each one stands.
 *
 * This is what an acceptance, rejection or shortlisting notification links to.
 * It used to point at /my-applications, which did not exist, so clicking it
 * 404'd; it was temporarily repointed at /dashboard, which showed the
 * applicant nothing about the decision they had just been told.
 */

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Not selected' },
]

const STATUS_META = {
  submitted: {
    label: 'Applied',
    icon: '📄',
    accent: '#94A3B8',
    background: 'rgba(148,163,184,0.12)',
    border: 'rgba(148,163,184,0.24)',
  },
  reviewing: {
    label: 'Under review',
    icon: '👀',
    accent: '#60A5FA',
    background: 'rgba(96,165,250,0.12)',
    border: 'rgba(96,165,250,0.26)',
  },
  shortlisted: {
    label: 'Shortlisted',
    icon: '⭐',
    accent: '#F59E0B',
    background: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.26)',
  },
  accepted: {
    label: 'Accepted',
    icon: '🎉',
    accent: '#34D399',
    background: 'rgba(52,211,153,0.14)',
    border: 'rgba(52,211,153,0.30)',
  },
  rejected: {
    label: 'Not selected',
    icon: '😔',
    accent: '#F87171',
    background: 'rgba(248,113,113,0.10)',
    border: 'rgba(248,113,113,0.24)',
  },
}

// Anything still moving forward is grouped as active.
const TERMINAL = ['accepted', 'rejected']

function ApplicationsContent() {
  const searchParams = useSearchParams()
  const highlight = searchParams?.get('application')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [applications, setApplications] = useState([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch(
          `/api/applications?application=${
            highlight || ''
          }`,
          { cache: 'no-store' }
        )

        const data = await response.json()

        if (cancelled) return

        if (!response.ok) {
          setError(
            data.error ||
              'Unable to load your applications'
          )
          return
        }

        setApplications(data.applications || [])
      } catch (err) {
        if (cancelled) return

        console.error(
          'Applications page load error:',
          err
        )

        setError(
          'Unable to load your applications'
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [highlight])

  const visible = useMemo(() => {
    if (filter === 'all') return applications

    if (filter === 'active') {
      return applications.filter(
        app => !TERMINAL.includes(app.status)
      )
    }

    return applications.filter(
      app => app.status === filter
    )
  }, [applications, filter])

  const counts = useMemo(() => {
    const total = applications.length

    const accepted = applications.filter(
      app => app.status === 'accepted'
    ).length

    const active = applications.filter(
      app => !TERMINAL.includes(app.status)
    ).length

    return { total, accepted, active }
  }, [applications])

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <p style={loadingStyle}>
            Loading your applications...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <div style={topBarStyle}>
          <Link
            href="/dashboard"
            style={backLinkStyle}
          >
            ← Back to dashboard
          </Link>
        </div>

        <section style={headerStyle}>
          <p style={eyebrowStyle}>
            Your applications
          </p>

          <h1 style={titleStyle}>
            Application tracker
          </h1>

          <p style={subtitleStyle}>
            Track every role you have applied for
            and see exactly where each one
            stands.
          </p>
        </section>

        <section style={statsStyle}>
          <StatCard
            label="Total applications"
            value={counts.total}
          />

          <StatCard
            label="Still active"
            value={counts.active}
          />

          <StatCard
            label="Accepted"
            value={counts.accepted}
          />
        </section>

        {error && (
          <div style={errorStyle}>{error}</div>
        )}

        {applications.length > 0 && (
          <div style={filterRowStyle}>
            {FILTERS.map(option => {
              const isActive = filter === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setFilter(option.value)
                  }
                  style={{
                    ...filterButtonStyle,
                    ...(isActive
                      ? filterButtonActiveStyle
                      : null),
                  }}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        )}

        {visible.length === 0 ? (
          <section style={emptyCardStyle}>
            <div style={emptyIconStyle}>
              {applications.length === 0
                ? '📮'
                : '🔍'}
            </div>

            <h2 style={emptyTitleStyle}>
              {applications.length === 0
                ? 'No applications yet'
                : 'Nothing in this filter'}
            </h2>

            <p style={emptyTextStyle}>
              {applications.length === 0
                ? 'When you apply to a job it will appear here, and you will be notified the moment the employer responds.'
                : 'Try a different filter to see your other applications.'}
            </p>

            {applications.length === 0 && (
              <Link
                href="/opportunities"
                style={browseButtonStyle}
              >
                Browse jobs
              </Link>
            )}
          </section>
        ) : (
          <div style={listStyle}>
            {visible.map(application => (
              <ApplicationCard
                key={application.id}
                application={application}
                highlighted={
                  application.id === highlight
                }
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function ApplicationCard({
  application,
  highlighted,
}) {
  const job = Array.isArray(application.job_postings)
    ? application.job_postings[0]
    : application.job_postings

  const status =
    STATUS_META[application.status] ||
    STATUS_META.submitted

  const companyName =
    job?.company_name || 'Company'

  return (
    <article
      style={{
        ...cardStyle,
        ...(highlighted
          ? cardHighlightedStyle
          : null),
      }}
    >
      {highlighted && (
        <div style={highlightBannerStyle}>
          This is the application from your
          notification
        </div>
      )}

      <div style={cardTopStyle}>
        <div style={companyAvatarStyle}>
          {getInitials(companyName)}
        </div>

        <div
          style={{
            minWidth: 0,
            flex: 1,
          }}
        >
          <p style={cardLabelStyle}>
            {job?.employment_type
              ? formatLabel(job.employment_type)
              : 'Application'}
          </p>

          <h2 style={jobTitleStyle}>
            {job?.title || 'Untitled role'}
          </h2>

          <p style={companyMetaStyle}>
            {companyName}
            {job?.location
              ? ` · 📍 ${job.location}`
              : ''}
          </p>
        </div>

        <span
          style={{
            ...statusBadgeStyle,
            color: status.accent,
            background: status.background,
            borderColor: status.border,
          }}
        >
          {status.icon} {status.label}
        </span>
      </div>

      <div style={detailsStyle}>
        <DetailRow
          label="Applied"
          value={formatDate(application.created_at)}
        />

        {application.updated_at &&
          application.updated_at !==
            application.created_at && (
            <DetailRow
              label="Last update"
              value={formatDate(
                application.updated_at
              )}
            />
          )}

        <DetailRow
          label="Reference"
          value={
            application.id.slice(0, 8).toUpperCase()
          }
        />
      </div>

      <div style={actionRowStyle}>
        {application.cv_url && (
          <a
            href={application.cv_url}
            target="_blank"
            rel="noopener noreferrer"
            style={cvButtonStyle}
          >
            View CV sent
          </a>
        )}

        {job?.id && (
          <Link
            href={`/opportunities/${job.id}`}
            style={viewJobButtonStyle}
          >
            View job
          </Link>
        )}
      </div>
    </article>
  )
}

function StatCard({ label, value }) {
  return (
    <div style={statCardStyle}>
      <span style={statValueStyle}>
        {value}
      </span>

      <span style={statLabelStyle}>
        {label}
      </span>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div style={detailRowStyle}>
      <span style={detailLabelStyle}>
        {label}
      </span>

      <span style={detailValueStyle}>
        {value}
      </span>
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

function formatLabel(value) {
  if (!value) return ''

  return String(value)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(' ')
}

function formatDate(value) {
  if (!value) return 'Unknown'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Unknown'
  }

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function MyApplicationsPage() {
  return (
    <Suspense
      fallback={
        <main style={pageStyle}>
          <div style={containerStyle}>
            <p style={loadingStyle}>
              Loading your applications...
            </p>
          </div>
        </main>
      }
    >
      <ApplicationsContent />
    </Suspense>
  )
}

const pageStyle = {
  minHeight: '100vh',
  background:
    'linear-gradient(135deg, #0A0F1E 0%, #0D1528 50%, #0A0F1E 100%)',
  color: '#FFFFFF',
  padding: '40px 24px 60px',
  fontFamily: 'Inter, system-ui, sans-serif',
}

const containerStyle = {
  width: '100%',
  maxWidth: '850px',
  margin: '0 auto',
}

const topBarStyle = {
  marginBottom: '24px',
}

const backLinkStyle = {
  color: 'rgba(255,255,255,0.55)',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 600,
}

const headerStyle = {
  marginBottom: '24px',
}

const eyebrowStyle = {
  margin: '0 0 7px',
  color: '#818CF8',
  fontSize: '13px',
  fontWeight: 700,
}

const titleStyle = {
  margin: '0 0 8px',
  fontSize: '30px',
  lineHeight: 1.2,
}

const subtitleStyle = {
  margin: 0,
  color: 'rgba(255,255,255,0.48)',
  fontSize: '14px',
  lineHeight: 1.6,
}

const statsStyle = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(140px, 1fr))',
  gap: '12px',
  marginBottom: '24px',
}

const statCardStyle = {
  padding: '18px 16px',
  borderRadius: '16px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
}

const statValueStyle = {
  fontSize: '26px',
  fontWeight: 800,
  lineHeight: 1,
}

const statLabelStyle = {
  color: 'rgba(255,255,255,0.42)',
  fontSize: '12px',
}

const filterRowStyle = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  marginBottom: '20px',
}

const filterButtonStyle = {
  padding: '8px 14px',
  borderRadius: '999px',
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.05)',
  color: 'rgba(255,255,255,0.62)',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
}

const filterButtonActiveStyle = {
  background:
    'linear-gradient(135deg, #5B4FE8, #7C3AED)',
  borderColor: 'transparent',
  color: '#FFFFFF',
}

const listStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
}

const cardStyle = {
  padding: '22px',
  borderRadius: '20px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
}

const cardHighlightedStyle = {
  borderColor: 'rgba(129,140,248,0.55)',
  boxShadow:
    '0 0 0 3px rgba(129,140,248,0.12)',
}

const highlightBannerStyle = {
  margin: '-4px 0 16px',
  padding: '8px 12px',
  borderRadius: '9px',
  background: 'rgba(129,140,248,0.14)',
  border:
    '1px solid rgba(129,140,248,0.30)',
  color: '#C7D2FE',
  fontSize: '11px',
  fontWeight: 700,
}

const cardTopStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
  marginBottom: '20px',
  flexWrap: 'wrap',
}

const companyAvatarStyle = {
  width: '58px',
  height: '58px',
  minWidth: '58px',
  borderRadius: '15px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background:
    'linear-gradient(135deg, #5B4FE8, #818CF8)',
  color: '#FFFFFF',
  fontSize: '18px',
  fontWeight: 800,
}

const cardLabelStyle = {
  margin: '0 0 4px',
  color: '#818CF8',
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const jobTitleStyle = {
  margin: '0 0 5px',
  fontSize: '20px',
}

const companyMetaStyle = {
  margin: '0',
  color: 'rgba(255,255,255,0.42)',
  fontSize: '12px',
}

const statusBadgeStyle = {
  padding: '7px 12px',
  borderRadius: '999px',
  border: '1px solid',
  fontSize: '11px',
  fontWeight: 700,
  whiteSpace: 'nowrap',
  flexShrink: 0,
}

const detailsStyle = {
  marginBottom: '18px',
  padding: '14px 16px',
  borderRadius: '13px',
  background: 'rgba(255,255,255,0.025)',
  border: '1px solid rgba(255,255,255,0.06)',
}

const detailRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '20px',
  padding: '8px 0',
}

const detailLabelStyle = {
  color: 'rgba(255,255,255,0.38)',
  fontSize: '12px',
}

const detailValueStyle = {
  color: '#FFFFFF',
  fontSize: '12px',
  fontWeight: 700,
  textAlign: 'right',
}

const actionRowStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
  flexWrap: 'wrap',
}

const cvButtonStyle = {
  padding: '10px 15px',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.05)',
  color: '#FFFFFF',
  fontSize: '12px',
  fontWeight: 700,
  textDecoration: 'none',
}

const viewJobButtonStyle = {
  padding: '10px 16px',
  borderRadius: '10px',
  background:
    'linear-gradient(135deg, #5B4FE8, #7C3AED)',
  color: '#FFFFFF',
  fontSize: '12px',
  fontWeight: 700,
  textDecoration: 'none',
  boxShadow: '0 4px 16px rgba(91,79,232,0.25)',
}

const loadingStyle = {
  color: 'rgba(255,255,255,0.6)',
}

const errorStyle = {
  marginBottom: '20px',
  padding: '12px 14px',
  borderRadius: '10px',
  background: 'rgba(239,68,68,0.10)',
  border: '1px solid rgba(239,68,68,0.20)',
  color: '#FCA5A5',
  fontSize: '13px',
}

const emptyCardStyle = {
  padding: '48px 24px',
  borderRadius: '20px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  textAlign: 'center',
}

const emptyIconStyle = {
  fontSize: '32px',
  marginBottom: '12px',
}

const emptyTitleStyle = {
  margin: '0 0 7px',
  fontSize: '17px',
}

const emptyTextStyle = {
  margin: '0 auto',
  maxWidth: '430px',
  color: 'rgba(255,255,255,0.4)',
  fontSize: '12px',
  lineHeight: 1.7,
}

const browseButtonStyle = {
  display: 'inline-block',
  marginTop: '18px',
  padding: '11px 18px',
  borderRadius: '10px',
  background:
    'linear-gradient(135deg, #5B4FE8, #7C3AED)',
  color: '#FFFFFF',
  fontSize: '13px',
  fontWeight: 700,
  textDecoration: 'none',
}