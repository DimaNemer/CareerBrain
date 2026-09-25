'use client'

import { useEffect, useState } from 'react'
import {
  useParams,
  useRouter,
} from 'next/navigation'
import Link from 'next/link'

const APPLICATION_STATUSES = [
  {
    value: 'submitted',
    label: 'Submitted',
  },
  {
    value: 'reviewing',
    label: 'Reviewing',
  },
  {
    value: 'shortlisted',
    label: 'Shortlisted',
  },
  {
    value: 'accepted',
    label: 'Accepted',
  },
  {
    value: 'rejected',
    label: 'Rejected',
  },
]

export default function ApplicantDetailsPage() {
  const params = useParams()
  const router = useRouter()

  const jobId = params.id
  const applicationId = params.applicationId

  const [application, setApplication] =
    useState(null)

  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] =
    useState(false)

  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] =
    useState('')

  useEffect(() => {
    async function loadApplication() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(
          `/api/employer/applications/${applicationId}`,
          {
            cache: 'no-store',
          }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Unable to load the application'
          )
        }

        if (
          String(data.application?.job_id) !==
          String(jobId)
        ) {
          throw new Error(
            'This application does not belong to the selected job'
          )
        }

        setApplication(data.application)
      } catch (loadError) {
        console.error(
          'Application load failed:',
          loadError
        )

        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    if (applicationId && jobId) {
      loadApplication()
    }
  }, [applicationId, jobId])

  async function handleStatusChange(event) {
    const newStatus = event.target.value

    if (
      !application ||
      newStatus === application.status
    ) {
      return
    }

    setUpdatingStatus(true)
    setError('')
    setStatusMessage('')

    try {
      const response = await fetch(
        `/api/employer/applications/${applicationId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Unable to update application status'
        )
      }

      setApplication(previousApplication => ({
        ...previousApplication,
        status: data.application.status,
        updated_at:
          data.application.updated_at ||
          previousApplication.updated_at,
      }))

      setStatusMessage(
        'Application status updated successfully.'
      )

      router.refresh()
    } catch (updateError) {
      console.error(
        'Application status update failed:',
        updateError
      )

      setError(updateError.message)
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingContainerStyle}>
          <div style={spinnerStyle} />

          <p style={loadingTextStyle}>
            Loading application...
          </p>
        </div>
      </main>
    )
  }

  if (error && !application) {
  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <Link
          href={`/employer/jobs/${jobId}/applicants`}
          style={backLinkStyle}
        >
          ← Back to applicants
        </Link>

        <div style={errorPageStyle}>
          <h1 style={errorTitleStyle}>
            Unable to load application
          </h1>

          <p style={errorDescriptionStyle}>
            {error}
          </p>
        </div>
      </div>
    </main>
  )
}
  if (!application) {
    return null
  }

  const applicantProfile =
    application.applicant_profile

  const job = Array.isArray(
    application.job_postings
  )
    ? application.job_postings[0]
    : application.job_postings

const applicantName =
  applicantProfile?.full_name ||
  'Candidate'

  const canViewProfile =
    job?.share_profile !== false



  return (
  <main
    className="application-details-page"
    style={pageStyle}
  >
    <style>{`
      @media screen and (max-width: 768px) {
        .application-details-page {
          padding: 32px 18px !important;
        }

        .application-header {
          flex-direction: column !important;
          gap: 20px !important;
        }

        .candidate-header {
          width: 100% !important;
          min-width: 0 !important;
        }

        .candidate-heading,
        .candidate-name-link {
          font-size: 27px !important;
          overflow-wrap: break-word !important;
        }

        .application-status-control {
          width: 100% !important;
        }

        .application-status-select {
          width: 100% !important;
          min-width: 0 !important;
        }

        .application-summary-grid {
          grid-template-columns:
            repeat(2, minmax(0, 1fr)) !important;
          gap: 10px !important;
        }

        .application-summary-card {
          padding: 14px !important;
          min-width: 0 !important;
        }

        .application-summary-value {
          font-size: 13px !important;
          overflow-wrap: break-word !important;
          word-break: normal !important;
        }

        .application-content-grid {
          display: flex !important;
          flex-direction: column !important;
          width: 100% !important;
          gap: 20px !important;
        }

        .application-main-column,
        .application-side-column {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
        }

        .application-card {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
          padding: 18px !important;
          border-radius: 16px !important;
        }

        .resume-info {
          flex-direction: column !important;
          align-items: stretch !important;
          width: 100% !important;
          gap: 14px !important;
        }

        .resume-file-info {
          width: 100% !important;
          min-width: 0 !important;
        }

        .resume-file-content {
          flex: 1 !important;
          min-width: 0 !important;
        }

        .resume-path {
          overflow-wrap: break-word !important;
          word-break: normal !important;
        }

        .resume-unavailable {
          align-self: flex-start !important;
          max-width: 100% !important;
          white-space: normal !important;
        }

        .cover-letter-text,
        .answer-text {
          width: 100% !important;
          overflow-wrap: break-word !important;
          word-break: normal !important;
        }

        .detail-row {
          width: 100% !important;
          gap: 12px !important;
        }

        .detail-label {
          min-width: 0 !important;
          flex: 1 1 45% !important;
        }

        .detail-value {
          min-width: 0 !important;
          flex: 1 1 55% !important;
          overflow-wrap: break-word !important;
          word-break: normal !important;
        }
      }

      @media screen and (max-width: 480px) {
        .application-details-page {
          padding: 26px 14px !important;
        }

        .candidate-avatar {
          width: 54px !important;
          height: 54px !important;
          border-radius: 16px !important;
          font-size: 18px !important;
        }

        .candidate-header {
          gap: 13px !important;
        }

        .candidate-heading,
        .candidate-name-link {
          font-size: 24px !important;
        }

        .application-summary-grid {
          gap: 8px !important;
        }

        .application-summary-card {
          padding: 12px !important;
          border-radius: 13px !important;
        }

        .application-summary-label {
          font-size: 10px !important;
        }

        .application-summary-value {
          font-size: 12px !important;
        }

        .application-card {
          padding: 16px !important;
        }

        .resume-info {
          padding: 13px !important;
        }
      }
    `}</style>

    <div style={containerStyle}>
        <Link
          href={`/employer/jobs/${jobId}/applicants`}
          style={backLinkStyle}
        >
          ← Back to applicants
        </Link>

       <section
  className="application-header"
  style={headerStyle}
>
         <div
  className="candidate-header"
  style={candidateHeaderStyle}
>
            <div
  className="candidate-avatar"
  style={avatarStyle}
>
              {getInitials(applicantName)}
            </div>

            <div>
              <p style={eyebrowStyle}>
                Candidate application
              </p>

             <h1
  className="candidate-heading"
  style={headingStyle}
>
      <Link
  href={`/profile/${application.applicant_id}?from=${encodeURIComponent(
    `/employer/jobs/${jobId}/applicants/${applicationId}`
  )}`}
 className="candidate-name-link"
  style={candidateNameLinkStyle}
>
  {applicantName}
</Link>
              </h1>

              <p style={headlineStyle}>
                {canViewProfile
                  ? applicantProfile?.headline ||
                    'Career Brain candidate'
                  : 'Candidate profile sharing is disabled'}
              </p>
            </div>
          </div>

         <div
  className="application-status-control"
  style={statusControlStyle}
>
            <label style={statusLabelStyle}>
              Application status
            </label>

       <select
  className="application-status-select"
  value={
    application.status || 'submitted'
  }
  onChange={handleStatusChange}
  disabled={updatingStatus}
  style={{
    ...statusSelectStyle,
    opacity: updatingStatus ? 0.65 : 1,
    cursor: updatingStatus
      ? 'not-allowed'
      : 'pointer',
  }}
>
              {APPLICATION_STATUSES.map(
                status => (
                <option
  key={status.value}
  value={status.value}
  style={{
    backgroundColor: '#111827',
    color: '#FFFFFF',
  }}
>
  {status.label}
</option>
                )
              )}
            </select>

            {updatingStatus && (
              <span style={savingTextStyle}>
                Saving...
              </span>
            )}
          </div>
        </section>

        {error && (
          <div style={errorAlertStyle}>
            {error}
          </div>
        )}

        {statusMessage && (
          <div style={successAlertStyle}>
            {statusMessage}
          </div>
        )}

      <section
  className="application-summary-grid"
  style={summaryGridStyle}
>
          <SummaryCard
            label="Job"
            value={job?.title || 'Job posting'}
          />

          <SummaryCard
            label="Applied"
            value={formatDate(
              application.created_at
            )}
          />

          <SummaryCard
            label="Current status"
            value={formatStatus(
              application.status
            )}
          />

          <SummaryCard
            label="Last updated"
            value={formatDate(
              application.updated_at ||
                application.created_at
            )}
          />
        </section>

       <section
  className="application-content-grid"
  style={contentGridStyle}
>
        <div
  className="application-main-column"
  style={mainColumnStyle}
>
           <section
  className="application-card"
  style={cardStyle}
>
              <div style={sectionHeaderStyle}>
                <div>
                  <h2 style={sectionTitleStyle}>
                    Resume
                  </h2>

                  <p
                    style={
                      sectionDescriptionStyle
                    }
                  >
                    Resume submitted with this
                    application.
                  </p>
                </div>
              </div>

            {application.cv_url ? (
  <div
  className="resume-info"
  style={resumeInfoStyle}
>
   <div
  className="resume-file-info"
  style={resumeFileInfoStyle}
>
     <div
  className="resume-icon"
  style={resumeIconStyle}
>
  PDF
</div>

      <div className="resume-file-content">
        <p style={resumeTitleStyle}>
          Candidate resume
        </p>

        <p
  className="resume-path"
  style={resumePathStyle}
>
          {getReadableFileName(
            application.cv_url
          )}
        </p>
      </div>
    </div>

    {application.resume_url ? (
      <a
        href={application.resume_url}
        target="_blank"
        rel="noopener noreferrer"
        style={primaryButtonStyle}
      >
        View resume
      </a>
    ) : (
   <span
  className="resume-unavailable"
  style={unavailableBadgeStyle}
>
  Resume temporarily unavailable
</span>
    )}
  </div>
) : (
  <div style={emptySectionStyle}>
    No resume was submitted.
  </div>
)}
            </section>

         <section
  className="application-card"
  style={cardStyle}
>
              <h2 style={sectionTitleStyle}>
                Cover letter
              </h2>

              {application.cover_letter ? (
             <div
  className="cover-letter-text"
  style={textContentStyle}
>
  {application.cover_letter}
</div>
              ) : (
                <div style={emptySectionStyle}>
                  No cover letter was submitted.
                </div>
              )}
            </section>

          <section
  className="application-card"
  style={cardStyle}
>
              <h2 style={sectionTitleStyle}>
                Screening answers
              </h2>

              {application.answers?.length >
              0 ? (
                <div style={answersListStyle}>
                  {application.answers.map(
                    (answer, index) => {
                      const question =
                        Array.isArray(
                          answer.job_application_questions
                        )
                          ? answer
                              .job_application_questions[0]
                          : answer.job_application_questions

                      return (
                        <div
                          key={
                            answer.id ||
                            answer.question_id ||
                            index
                          }
                          style={answerCardStyle}
                        >
                          <p
                            style={
                              questionNumberStyle
                            }
                          >
                            Question {index + 1}
                          </p>

                          <h3
                            style={
                              questionTextStyle
                            }
                          >
                            {question?.question_text ||
                              'Screening question'}
                          </h3>

                        <div style={answerTextStyle}>
                            {answer.answer_text ||
                              'No answer provided'}
                          </div>
                        </div>
                      )
                    }
                  )}
                </div>
              ) : (
                <div style={emptySectionStyle}>
                  No screening answers were
                  submitted.
                </div>
              )}
            </section>
          </div>

          <aside
  className="application-side-column"
  style={sideColumnStyle}
>
            <section
  className="application-card"
  style={cardStyle}
>
              <h2 style={sectionTitleStyle}>
                Candidate profile
              </h2>

              {canViewProfile ? (
                <div style={detailsListStyle}>
                  <DetailRow
                    label="Full name"
                    value={applicantName}
                  />

                

                  <DetailRow
                    label="Headline"
                    value={
                      applicantProfile?.headline ||
                      'Not provided'
                    }
                  />
                </div>
              ) : (
                <div style={emptySectionStyle}>
                  Profile sharing is disabled for
                  this job.
                </div>
              )}
            </section>

           <section
  className="application-card"
  style={cardStyle}
>
              <h2 style={sectionTitleStyle}>
                Application details
              </h2>

              <div style={detailsListStyle}>
                <DetailRow
                  label="Application ID"
                  value={shortenId(
                    application.id
                  )}
                />

                <DetailRow
                  label="Resume"
                  value={
                    application.cv_url
                      ? 'Submitted'
                      : 'Not submitted'
                  }
                />

                <DetailRow
                  label="Cover letter"
                  value={
                    application.cover_letter
                      ? 'Submitted'
                      : 'Not submitted'
                  }
                />

                <DetailRow
                  label="Screening answers"
                  value={String(
                    application.answers?.length ||
                      0
                  )}
                />
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div
      className="application-summary-card"
      style={summaryCardStyle}
    >
      <p
        className="application-summary-label"
        style={summaryLabelStyle}
      >
        {label}
      </p>

      <p
        className="application-summary-value"
        style={summaryValueStyle}
      >
        {value}
      </p>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div
      className="detail-row"
      style={detailRowStyle}
    >
      <span
        className="detail-label"
        style={detailLabelStyle}
      >
        {label}
      </span>

      <span
        className="detail-value"
        style={detailValueStyle}
      >
        {value}
      </span>
    </div>
  )
}

function getInitials(name) {
  const words = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) {
    return 'C'
  }

  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase()
  }

  return (
    words[0].charAt(0) +
    words[words.length - 1].charAt(0)
  ).toUpperCase()
}
function getReadableFileName(path) {
  if (!path) {
    return 'Candidate Resume'
  }

  const parts = String(path).split('/')
  const storedFileName =
    parts[parts.length - 1] || ''

  const cleanedFileName =
    storedFileName.replace(
      /^[0-9a-f-]{36}-/i,
      ''
    )

  return (
    cleanedFileName ||
    'Candidate Resume'
  )
}

function formatDate(value) {
  if (!value) {
    return 'Not available'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Not available'
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function formatStatus(status) {
  if (!status) {
    return 'Submitted'
  }

  return String(status)
    .split('_')
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(' ')
}

function shortenId(value) {
  if (!value) {
    return 'Not available'
  }

  const stringValue = String(value)

  if (stringValue.length <= 12) {
    return stringValue
  }

  return `${stringValue.slice(
    0,
    8
  )}...${stringValue.slice(-4)}`
}

const pageStyle = {
  minHeight: '100vh',
  padding: '48px 24px',
  background:
    'linear-gradient(135deg, #0A0F1E 0%, #0D1528 50%, #0A0F1E 100%)',
  color: '#fff',
  fontFamily: 'Inter, system-ui, sans-serif',
}

const containerStyle = {
  width: '100%',
  maxWidth: '1100px',
  margin: '0 auto',
}

const backLinkStyle = {
  display: 'inline-block',
  marginBottom: '28px',
  color: 'rgba(255,255,255,0.55)',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 600,
}

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '24px',
  marginBottom: '28px',
  flexWrap: 'wrap',
}

const candidateHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '17px',
}

const avatarStyle = {
  width: '66px',
  height: '66px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  borderRadius: '20px',
  background:
    'linear-gradient(135deg, #5B4FE8, #7C3AED)',
  color: '#fff',
  fontSize: '21px',
  fontWeight: 800,
}

const eyebrowStyle = {
  margin: '0 0 6px',
  color: '#818CF8',
  fontSize: '13px',
  fontWeight: 700,
}

const headingStyle = {
  margin: '0 0 7px',
  fontSize: '32px',
  lineHeight: 1.2,
}

const headlineStyle = {
  margin: 0,
  color: 'rgba(255,255,255,0.5)',
  fontSize: '14px',
}

const statusControlStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '7px',
}

const statusLabelStyle = {
  color: 'rgba(255,255,255,0.46)',
  fontSize: '12px',
  fontWeight: 600,
}
const candidateNameLinkStyle = {
  display: 'inline-block',
  margin: '0 0 7px',
  color: '#FFFFFF',
  fontSize: '32px',
  fontWeight: 700,
  lineHeight: 1.2,
  textDecoration: 'none',
}
const statusSelectStyle = {
  minWidth: '170px',
  padding: '12px 14px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '12px',
  color: '#fff',
  colorScheme: 'dark',
  outline: 'none',
  fontFamily: 'inherit',
  fontSize: '14px',
  fontWeight: 700,
}

const savingTextStyle = {
  color: 'rgba(255,255,255,0.4)',
  fontSize: '11px',
}

const summaryGridStyle = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '14px',
  marginBottom: '24px',
}

const summaryCardStyle = {
  padding: '18px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
}

const summaryLabelStyle = {
  margin: '0 0 7px',
  color: 'rgba(255,255,255,0.42)',
  fontSize: '12px',
}

const summaryValueStyle = {
  margin: 0,
  color: '#fff',
  fontSize: '14px',
  fontWeight: 700,
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
  gap: '24px',
  minWidth: 0,
}

const sideColumnStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  minWidth: 0,
}

const cardStyle = {
  padding: '24px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '20px',
}

const sectionHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '16px',
  marginBottom: '18px',
}

const sectionTitleStyle = {
  margin: '0 0 8px',
  color: '#fff',
  fontSize: '18px',
}

const sectionDescriptionStyle = {
  margin: 0,
  color: 'rgba(255,255,255,0.42)',
  fontSize: '12px',
}

const primaryButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '44px',
  padding: '0 19px',
  borderRadius: '12px',
  background:
    'linear-gradient(135deg, #5B4FE8, #7C3AED)',
  color: '#fff',
  textDecoration: 'none',
  fontSize: '13px',
  fontWeight: 700,
}

const resumeInfoStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '16px',
  padding: '16px',
  background: 'rgba(255,255,255,0.035)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '14px',
  flexWrap: 'wrap',
}

const resumeFileInfoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '13px',
  minWidth: 0,
}

const resumeIconStyle = {
  width: '44px',
  height: '44px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  borderRadius: '12px',
  background: 'rgba(239,68,68,0.12)',
  border: '1px solid rgba(239,68,68,0.25)',
  color: '#FCA5A5',
  fontSize: '11px',
  fontWeight: 800,
}

const resumeTitleStyle = {
  margin: '0 0 5px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 700,
}

const resumePathStyle = {
  margin: 0,
  color: 'rgba(255,255,255,0.4)',
  fontSize: '11px',
  overflowWrap: 'anywhere',
}

const unavailableBadgeStyle = {
  padding: '6px 10px',
  borderRadius: '999px',
  color: '#FCD34D',
  background: 'rgba(245,158,11,0.12)',
  border: '1px solid rgba(245,158,11,0.24)',
  fontSize: '11px',
  fontWeight: 700,
}

const textContentStyle = {
  color: 'rgba(255,255,255,0.7)',
  fontSize: '14px',
  lineHeight: 1.8,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
}

const answersListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
}

const answerCardStyle = {
  padding: '18px',
  background: 'rgba(255,255,255,0.035)',
  border: '1px solid rgba(255,255,255,0.075)',
  borderRadius: '15px',
}

const questionNumberStyle = {
  margin: '0 0 7px',
  color: '#818CF8',
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

const questionTextStyle = {
  margin: '0 0 12px',
  color: '#fff',
  fontSize: '14px',
  lineHeight: 1.5,
}

const answerTextStyle = {
  color: 'rgba(255,255,255,0.64)',
  fontSize: '13px',
  lineHeight: 1.7,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
}

const emptySectionStyle = {
  padding: '18px',
  border: '1px dashed rgba(255,255,255,0.12)',
  borderRadius: '14px',
  color: 'rgba(255,255,255,0.4)',
  fontSize: '13px',
  textAlign: 'center',
}

const detailsListStyle = {
  display: 'flex',
  flexDirection: 'column',
}

const detailRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '15px',
  padding: '12px 0',
  borderBottom: '1px solid rgba(255,255,255,0.07)',
}

const detailLabelStyle = {
  color: 'rgba(255,255,255,0.42)',
  fontSize: '12px',
}

const detailValueStyle = {
  color: 'rgba(255,255,255,0.8)',
  fontSize: '12px',
  fontWeight: 700,
  textAlign: 'right',
  overflowWrap: 'anywhere',
}


const errorAlertStyle = {
  marginBottom: '20px',
  padding: '13px 16px',
  background: 'rgba(239,68,68,0.12)',
  border: '1px solid rgba(239,68,68,0.25)',
  borderRadius: '12px',
  color: '#FCA5A5',
  fontSize: '13px',
}

const successAlertStyle = {
  marginBottom: '20px',
  padding: '13px 16px',
  background: 'rgba(16,185,129,0.12)',
  border: '1px solid rgba(16,185,129,0.25)',
  borderRadius: '12px',
  color: '#6EE7B7',
  fontSize: '13px',
}

const loadingContainerStyle = {
  minHeight: '70vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '14px',
}

const spinnerStyle = {
  width: '34px',
  height: '34px',
  border: '3px solid rgba(255,255,255,0.15)',
  borderTopColor: '#818CF8',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
}

const loadingTextStyle = {
  color: 'rgba(255,255,255,0.5)',
  fontSize: '14px',
}

const errorPageStyle = {
  padding: '40px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '20px',
  textAlign: 'center',
}

const errorTitleStyle = {
  margin: '0 0 10px',
  fontSize: '24px',
}

const errorDescriptionStyle = {
  margin: 0,
  color: '#FCA5A5',
  fontSize: '14px',
}