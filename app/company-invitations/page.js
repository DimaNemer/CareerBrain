'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function CompanyInvitationsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [invitations, setInvitations] = useState([])
  const [actionLoadingId, setActionLoadingId] =
    useState(null)
  const [successMessage, setSuccessMessage] =
    useState('')

  useEffect(() => {
    let cancelled = false

    async function loadInvitations() {
      try {
        const response = await fetch(
          '/api/company-invitations',
          {
            method: 'GET',
            cache: 'no-store',
          }
        )

        const data = await response.json()

        if (cancelled) return

        if (!response.ok) {
          setError(
            data.error ||
              'Unable to load company invitations'
          )
          return
        }

        setInvitations(
          data.invitations || []
        )
      } catch (error) {
        if (cancelled) return

        console.error(
          'Invitation page load error:',
          error
        )

        setError(
          'Unable to load company invitations'
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadInvitations()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleInvitationAction(
    invitationId,
    action
  ) {
    setActionLoadingId(invitationId)
    setError('')
    setSuccessMessage('')

    try {
      const response = await fetch(
        `/api/company-invitations/${invitationId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            action,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(
          data.error ||
            'Unable to update invitation'
        )
        return
      }

      setInvitations(previous =>
        previous.filter(
          invitation =>
            invitation.id !==
            invitationId
        )
      )

      if (action === 'accept') {
        setSuccessMessage(
          'Invitation accepted successfully. You are now part of the company.'
        )
      } else {
        setSuccessMessage(
          'Invitation declined.'
        )
      }
    } catch (error) {
      console.error(
        'Invitation action error:',
        error
      )

      setError(
        'Unable to update invitation'
      )
    } finally {
      setActionLoadingId(null)
    }
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <p style={loadingStyle}>
            Loading invitations...
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
            Company invitations
          </p>

          <h1 style={titleStyle}>
            Your invitations
          </h1>

          <p style={subtitleStyle}>
            Review invitations from companies
            that would like you to join their
            team.
          </p>
        </section>

        {error && (
          <div style={errorStyle}>
            {error}
          </div>
        )}

        {successMessage && (
          <div style={successStyle}>
            {successMessage}
          </div>
        )}

        {invitations.length === 0 ? (
          <section style={emptyCardStyle}>
            <div style={emptyIconStyle}>
              ✉️
            </div>

            <h2 style={emptyTitleStyle}>
              No pending invitations
            </h2>

            <p style={emptyTextStyle}>
              You do not currently have any
              company invitations waiting for
              your response.
            </p>
          </section>
        ) : (
          <div style={invitationListStyle}>
            {invitations.map(
              invitation => {
                const company =
                  Array.isArray(
                    invitation.companies
                  )
                    ? invitation.companies[0]
                    : invitation.companies

                const inviter =
                  Array.isArray(
                    invitation.inviter
                  )
                    ? invitation.inviter[0]
                    : invitation.inviter

                const companyName =
                  company?.name ||
                  'Company'

                const inviterName =
                  inviter?.full_name ||
                  inviter?.username ||
                  'Company representative'

                const isLoading =
                  actionLoadingId ===
                  invitation.id

                return (
                  <article
                    key={invitation.id}
                    style={
                      invitationCardStyle
                    }
                  >
                    <div
                      style={
                        invitationTopStyle
                      }
                    >
                      <div
                        style={
                          companyAvatarStyle
                        }
                      >
                        {company?.logo_url ? (
                          <img
                            src={
                              company.logo_url
                            }
                            alt={`${companyName} logo`}
                            style={
                              companyAvatarImageStyle
                            }
                          />
                        ) : (
                          getInitials(
                            companyName
                          )
                        )}
                      </div>

                      <div
                        style={{
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        <p
                          style={
                            invitationLabelStyle
                          }
                        >
                          Team invitation
                        </p>

                        <h2
                          style={
                            companyNameStyle
                          }
                        >
                          {companyName}
                        </h2>

                        {company?.industry && (
                          <p
                            style={
                              companyMetaStyle
                            }
                          >
                            {
                              company.industry
                            }
                          </p>
                        )}

                        {company?.location && (
                          <p
                            style={
                              companyMetaStyle
                            }
                          >
                            📍{' '}
                            {
                              company.location
                            }
                          </p>
                        )}
                      </div>
                    </div>

                    <div
                      style={
                        invitationDetailsStyle
                      }
                    >
                      <DetailRow
                        label="Job title"
                        value={
                          invitation.job_title ||
                          'Not specified'
                        }
                      />

                      <DetailRow
                        label="Permission"
                        value={formatLabel(
                          invitation.role
                        )}
                      />

                      <DetailRow
                        label="Invited by"
                        value={inviterName}
                      />
                    </div>

                    <p style={messageStyle}>
                      {companyName} invited you
                      to join their team as{' '}
                      <strong>
                        {invitation.job_title ||
                          'a team member'}
                      </strong>
                      .
                    </p>

                    <div
                      style={
                        actionRowStyle
                      }
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleInvitationAction(
                            invitation.id,
                            'decline'
                          )
                        }
                        disabled={isLoading}
                        style={{
                          ...declineButtonStyle,
                          opacity: isLoading
                            ? 0.6
                            : 1,
                        }}
                      >
                        {isLoading
                          ? 'Please wait...'
                          : 'Decline'}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleInvitationAction(
                            invitation.id,
                            'accept'
                          )
                        }
                        disabled={isLoading}
                        style={{
                          ...acceptButtonStyle,
                          opacity: isLoading
                            ? 0.6
                            : 1,
                        }}
                      >
                        {isLoading
                          ? 'Please wait...'
                          : 'Accept invitation'}
                      </button>
                    </div>
                  </article>
                )
              }
            )}
          </div>
        )}
      </div>
    </main>
  )
}

function DetailRow({
  label,
  value,
}) {
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
  if (!value) return 'Not specified'

  return String(value)
    .split('-')
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(' ')
}

const pageStyle = {
  minHeight: '100vh',
  background:
    'linear-gradient(135deg, #0A0F1E 0%, #0D1528 50%, #0A0F1E 100%)',
  color: '#FFFFFF',
  padding: '40px 24px 60px',
  fontFamily:
    'Inter, system-ui, sans-serif',
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
  marginBottom: '28px',
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

const invitationListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
}

const invitationCardStyle = {
  padding: '22px',
  borderRadius: '20px',
  background: 'rgba(255,255,255,0.04)',
  border:
    '1px solid rgba(255,255,255,0.08)',
}

const invitationTopStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
  marginBottom: '20px',
}

const companyAvatarStyle = {
  width: '58px',
  height: '58px',
  minWidth: '58px',
  overflow: 'hidden',
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

const companyAvatarImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
}

const invitationLabelStyle = {
  margin: '0 0 4px',
  color: '#818CF8',
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const companyNameStyle = {
  margin: '0 0 5px',
  fontSize: '20px',
}

const companyMetaStyle = {
  margin: '2px 0 0',
  color: 'rgba(255,255,255,0.42)',
  fontSize: '12px',
}

const invitationDetailsStyle = {
  marginBottom: '18px',
  padding: '14px 16px',
  borderRadius: '13px',
  background: 'rgba(255,255,255,0.025)',
  border:
    '1px solid rgba(255,255,255,0.06)',
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

const messageStyle = {
  margin: '0 0 20px',
  color: 'rgba(255,255,255,0.62)',
  fontSize: '13px',
  lineHeight: 1.7,
}

const actionRowStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
  flexWrap: 'wrap',
}

const declineButtonStyle = {
  padding: '10px 15px',
  borderRadius: '10px',
  border:
    '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.05)',
  color: '#FFFFFF',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
}

const acceptButtonStyle = {
  padding: '10px 16px',
  borderRadius: '10px',
  border: 'none',
  background:
    'linear-gradient(135deg, #5B4FE8, #7C3AED)',
  color: '#FFFFFF',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow:
    '0 4px 16px rgba(91,79,232,0.25)',
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

const successStyle = {
  marginBottom: '20px',
  padding: '12px 14px',
  borderRadius: '10px',
  background: 'rgba(16,185,129,0.10)',
  border:
    '1px solid rgba(16,185,129,0.22)',
  color: '#6EE7B7',
  fontSize: '13px',
}

const emptyCardStyle = {
  padding: '48px 24px',
  borderRadius: '20px',
  background: 'rgba(255,255,255,0.04)',
  border:
    '1px solid rgba(255,255,255,0.08)',
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