'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function EmployerTeamPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [company, setCompany] = useState(null)
  const [members, setMembers] = useState([])
  const [currentMembership, setCurrentMembership] =
    useState(null)
const [showInviteModal, setShowInviteModal] =
  useState(false)

const [inviteForm, setInviteForm] = useState({
  username: '',
  job_title: '',
role: 'viewer',
})
const [showEditModal, setShowEditModal] =
  useState(false)

const [editingMember, setEditingMember] =
  useState(null)

const [editForm, setEditForm] = useState({
  job_title: '',
  role: 'viewer',
})

const [editLoading, setEditLoading] =
  useState(false)

const [editError, setEditError] =
  useState('')
const [inviteLoading, setInviteLoading] =
  useState(false)

const [inviteError, setInviteError] =
  useState('')

const [inviteSuccess, setInviteSuccess] =
  useState('')

const [invitations, setInvitations] =
  useState([])
useEffect(() => {
  let cancelled = false

  async function fetchTeam() {
    try {
      const response = await fetch(
        '/api/employer/team',
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
            'Unable to load company team'
        )
        return
      }

      setCompany(data.company || null)
      setMembers(data.members || [])
      setCurrentMembership(
        data.currentMembership || null
      )
    } catch (error) {
      if (cancelled) return

      console.error(
        'Team load error:',
        error
      )

      setError(
        'Unable to load company team'
      )
    } finally {
      if (!cancelled) {
        setLoading(false)
      }
    }
  }
async function fetchInvitations() {
  try {
    const response = await fetch(
      '/api/employer/team/invitations',
      {
        method: 'GET',
        cache: 'no-store',
      }
    )

    const data = await response.json()

    if (cancelled) return

    if (!response.ok) {
      console.error(
        'Invitation load error:',
        data.error || 'Unable to load invitations'
      )
      return
    }

    setInvitations(data.invitations || [])
  } catch (error) {
    if (cancelled) return

    console.error(
      'Invitation load error:',
      error
    )
  }
}
fetchTeam()
fetchInvitations()

  return () => {
    cancelled = true
  }
}, [])
function handleInviteChange(event) {
  const { name, value } = event.target

  setInviteForm(previous => ({
    ...previous,
    [name]: value,
  }))

  setInviteError('')
}

function closeInviteModal() {
  if (inviteLoading) return

  setShowInviteModal(false)
  setInviteError('')

setInviteForm({
  username: '',
  job_title: '',
  role: 'viewer',
})
}

async function handleInviteSubmit(event) {
  event.preventDefault()

  const username =
    inviteForm.username.trim().replace(/^@/, '')

  const jobTitle =
    inviteForm.job_title.trim()

  if (!username) {
    setInviteError('Username is required')
    return
  }

  if (!jobTitle) {
    setInviteError('Job title is required')
    return
  }

  setInviteLoading(true)
  setInviteError('')
  setInviteSuccess('')

  try {
    const response = await fetch(
      '/api/employer/team/invitations',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          job_title: jobTitle,
          role: inviteForm.role,
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      setInviteError(
        data.error ||
          'Unable to send invitation'
      )
      return
    }

    setInviteSuccess(
      `Invitation sent to @${username}.`
    )

    if (data.invitation) {
      setInvitations(previous => [
        data.invitation,
        ...previous,
      ])
    }

   setInviteForm({
  username: '',
  job_title: '',
  role: 'viewer',
})

    setShowInviteModal(false)
  } catch (error) {
    console.error(
      'Invitation send error:',
      error
    )

    setInviteError(
      'Unable to send invitation'
    )
  } finally {
    setInviteLoading(false)
  }
}
function openEditMember(member) {
  setEditingMember(member)

  setEditForm({
    job_title: member.job_title || '',
    role: member.role || 'viewer',
  })

  setEditError('')
  setShowEditModal(true)
}

function closeEditMember() {
  if (editLoading) return

  setShowEditModal(false)
  setEditingMember(null)
  setEditError('')
}

function handleEditChange(event) {
  const { name, value } = event.target

  setEditForm(previous => ({
    ...previous,
    [name]: value,
  }))

  setEditError('')
}

async function handleSaveMember(event) {
  event.preventDefault()

  if (!editingMember) return

  if (!editForm.job_title.trim()) {
    setEditError('Job title is required')
    return
  }

  setEditLoading(true)
  setEditError('')

  try {
    const response = await fetch(
      `/api/employer/team/${editingMember.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_title:
            editForm.job_title.trim(),
          role: editForm.role,
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      setEditError(
        data.error ||
          'Unable to update team member'
      )
      return
    }

    setMembers(previous =>
      previous.map(member =>
        member.id === editingMember.id
          ? data.member
          : member
      )
    )

    setShowEditModal(false)
    setEditingMember(null)
  } catch (error) {
    console.error(
      'Team member update error:',
      error
    )

    setEditError(
      'Unable to update team member'
    )
  } finally {
    setEditLoading(false)
  }
}

async function handleRemoveMember() {
  if (!editingMember) return

  const confirmed = window.confirm(
    'Are you sure you want to remove this member from the company?'
  )

  if (!confirmed) return

  setEditLoading(true)
  setEditError('')

  try {
    const response = await fetch(
      `/api/employer/team/${editingMember.id}`,
      {
        method: 'DELETE',
      }
    )

    const data = await response.json()

    if (!response.ok) {
      setEditError(
        data.error ||
          'Unable to remove team member'
      )
      return
    }

    setMembers(previous =>
      previous.filter(
        member =>
          member.id !== editingMember.id
      )
    )

    setShowEditModal(false)
    setEditingMember(null)
  } catch (error) {
    console.error(
      'Team member remove error:',
      error
    )

    setEditError(
      'Unable to remove team member'
    )
  } finally {
    setEditLoading(false)
  }
}
  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <p style={loadingStyle}>
            Loading team...
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
            href="/employer/dashboard"
            style={backLinkStyle}
          >
            ← Back to employer dashboard
          </Link>
        </div>

        <section style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>
              Team Management
            </p>

            <h1 style={titleStyle}>
              {company?.name || 'Company'} team
            </h1>

            <p style={subtitleStyle}>
              Manage the people connected to
              your company.
            </p>
          </div>

          <button
            type="button"
            style={primaryButtonStyle}
          onClick={() => {
  setInviteError('')
  setInviteSuccess('')
  setShowInviteModal(true)
}}
          >
            + Add member
          </button>
        </section>

        {error && (
          <div style={errorStyle}>
            {error}
          </div>
        )}
{inviteSuccess && (
  <div style={successStyle}>
    {inviteSuccess}
  </div>
)}
        <section style={summaryGridStyle}>
          <SummaryCard
            label="Team members"
            value={members.length}
          />

          <SummaryCard
            label="Your role"
            value={
              formatLabel(
                currentMembership?.role
              ) || 'Not set'
            }
          />

          <SummaryCard
            label="Your title"
            value={
              currentMembership?.job_title ||
              'Not set'
            }
          />
        </section>

        <section style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>
                Current team
              </h2>

              <p style={sectionDescriptionStyle}>
                People currently connected to{' '}
                {company?.name || 'this company'}.
              </p>
            </div>
          </div>

          {members.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={emptyIconStyle}>
                👥
              </div>

              <h3 style={emptyTitleStyle}>
                No team members yet
              </h3>

              <p style={emptyTextStyle}>
                Add people to start building your
                company team.
              </p>
            </div>
          ) : (
            <div style={membersListStyle}>
              {members.map(member => {
                const profile =
                  Array.isArray(member.profiles)
                    ? member.profiles[0]
                    : member.profiles

                const name =
                  profile?.full_name ||
                  'Team member'

                const initials = getInitials(
                  name
                )

                return (
                  <article
                    key={member.id}
                    style={memberCardStyle}
                  >
                    <div
                      style={memberIdentityStyle}
                    >
                      <div
                        style={memberAvatarStyle}
                      >
                        {profile?.avatar_url ? (
                          <img
                            src={
                              profile.avatar_url
                            }
                            alt={name}
                            style={
                              memberAvatarImageStyle
                            }
                          />
                        ) : (
                          initials
                        )}
                      </div>

                      <div
                        style={memberInfoStyle}
                      >
                        <h3
                          style={memberNameStyle}
                        >
                          {name}
                        </h3>

                        <p
                          style={
                            memberTitleStyle
                          }
                        >
                          {member.job_title ||
                            profile?.headline ||
                            'No job title'}
                        </p>

                        {profile?.username && (
                          <p
                            style={
                              usernameStyle
                            }
                          >
                            @{profile.username}
                          </p>
                        )}
                      </div>
                    </div>

                    <div
                      style={memberRightStyle}
                    >
                      <span
                        style={{
                          ...roleBadgeStyle,
                          ...getRoleStyle(
                            member.role
                          ),
                        }}
                      >
                        {formatLabel(
                          member.role
                        )}
                      </span>

                      <Link
                        href={`/profile/${member.user_id}?from=${encodeURIComponent(
                          '/employer/team'
                        )}`}
                        style={viewProfileStyle}
                      >
                        View profile
                      </Link>

                      {member.role !==
                        'owner' && (
                        <button
                          type="button"
                          style={
                            editButtonStyle
                          }
                         onClick={() => {
  openEditMember(member)
}}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
        {invitations.filter(
  invitation => invitation.status === 'pending'
).length > 0 && (
  <section
    style={{
      ...cardStyle,
      marginTop: '24px',
    }}
  >
    <div style={sectionHeaderStyle}>
      <div>
        <h2 style={sectionTitleStyle}>
          Pending invitations
        </h2>

        <p style={sectionDescriptionStyle}>
          Invitations waiting for a response.
        </p>
      </div>
    </div>

    <div style={membersListStyle}>
      {invitations
        .filter(
          invitation =>
            invitation.status === 'pending'
        )
        .map(invitation => {
       const profile = Array.isArray(
  invitation.invited_user
)
  ? invitation.invited_user[0]
  : invitation.invited_user

          const name =
            profile?.full_name ||
            profile?.username ||
            'Invited user'

          return (
            <article
              key={invitation.id}
              style={memberCardStyle}
            >
              <div style={memberIdentityStyle}>
                <div style={memberAvatarStyle}>
                  {getInitials(name)}
                </div>

                <div style={memberInfoStyle}>
                  <h3 style={memberNameStyle}>
                    {name}
                  </h3>

                  <p style={memberTitleStyle}>
                    {invitation.job_title ||
                      'No job title'}
                  </p>

                  {profile?.username && (
                    <p style={usernameStyle}>
                      @{profile.username}
                    </p>
                  )}
                </div>
              </div>

              <div style={memberRightStyle}>
                <span
                  style={{
                    ...roleBadgeStyle,
                    ...getRoleStyle(
                      invitation.role
                    ),
                  }}
                >
                  {formatLabel(invitation.role)}
                </span>

                <span
                  style={{
                    ...roleBadgeStyle,
                    background:
                      'rgba(245,158,11,0.12)',
                    border:
                      '1px solid rgba(245,158,11,0.25)',
                    color: '#FCD34D',
                  }}
                >
                  Pending
                </span>
              </div>
            </article>
          )
        })}
    </div>
  </section>
)}
      </div>
      {showInviteModal && (
  <div
    style={modalOverlayStyle}
    onMouseDown={event => {
      if (event.target === event.currentTarget) {
        closeInviteModal()
      }
    }}
  >
    <div style={modalStyle}>
      <div style={modalHeaderStyle}>
        <div>
          <p style={modalEyebrowStyle}>
            Team invitation
          </p>

          <h2 style={modalTitleStyle}>
            Add a team member
          </h2>

          <p style={modalDescriptionStyle}>
            Invite an existing Career Brain user
            to join {company?.name || 'your company'}.
          </p>
        </div>

        <button
          type="button"
          onClick={closeInviteModal}
          disabled={inviteLoading}
          style={closeButtonStyle}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleInviteSubmit}>
        <div style={formGroupStyle}>
          <label style={labelStyle}>
            Username
          </label>

          <input
            type="text"
            name="username"
            value={inviteForm.username}
            onChange={handleInviteChange}
            placeholder="@username"
            autoComplete="off"
            style={inputStyle}
          />

          <p style={helperTextStyle}>
            Enter the username of an existing
            Career Brain account.
          </p>
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>
            Job title
          </label>

          <input
            type="text"
            name="job_title"
            value={inviteForm.job_title}
            onChange={handleInviteChange}
            placeholder="e.g. HR Manager"
            style={inputStyle}
          />

          <p style={helperTextStyle}>
            This title can appear publicly on the
            members company relationship.
          </p>
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>
            Company permission
          </label>

          <select
            name="role"
            value={inviteForm.role}
            onChange={handleInviteChange}
            style={inputStyle}
          >
           <option value="viewer">
  Viewer
</option>

            <option value="recruiter">
              Recruiter
            </option>

            <option value="admin">
              Admin
            </option>
          </select>

          <p style={helperTextStyle}>
            This controls what the person can do
            inside the company workspace.
          </p>
        </div>

        {inviteError && (
          <div style={modalErrorStyle}>
            {inviteError}
          </div>
        )}

        <div style={modalActionsStyle}>
          <button
            type="button"
            onClick={closeInviteModal}
            disabled={inviteLoading}
            style={cancelButtonStyle}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={inviteLoading}
            style={{
              ...sendButtonStyle,
              opacity: inviteLoading ? 0.65 : 1,
              cursor: inviteLoading
                ? 'not-allowed'
                : 'pointer',
            }}
          >
            {inviteLoading
              ? 'Sending...'
              : 'Send invitation'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
{showEditModal && editingMember && (
  <div
    style={modalOverlayStyle}
    onMouseDown={event => {
      if (event.target === event.currentTarget) {
        closeEditMember()
      }
    }}
  >
    <div style={modalStyle}>
      <div style={modalHeaderStyle}>
        <div>
          <p style={modalEyebrowStyle}>
            Team member
          </p>

          <h2 style={modalTitleStyle}>
            Edit team member
          </h2>

          <p style={modalDescriptionStyle}>
            Update this persons job title and
            company permission.
          </p>
        </div>

        <button
          type="button"
          onClick={closeEditMember}
          disabled={editLoading}
          style={closeButtonStyle}
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSaveMember}>
        <div style={formGroupStyle}>
          <label style={labelStyle}>
            Job title
          </label>

          <input
            type="text"
            name="job_title"
            value={editForm.job_title}
            onChange={handleEditChange}
            style={inputStyle}
          />
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>
            Company permission
          </label>

          <select
            name="role"
            value={editForm.role}
            onChange={handleEditChange}
            style={inputStyle}
          >
            <option value="viewer">
              Viewer
            </option>

            <option value="recruiter">
              Recruiter
            </option>

            {currentMembership?.role ===
              'owner' && (
              <option value="admin">
                Admin
              </option>
            )}
          </select>
        </div>

        {editError && (
          <div style={modalErrorStyle}>
            {editError}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={handleRemoveMember}
            disabled={editLoading}
            style={{
              ...cancelButtonStyle,
              color: '#FCA5A5',
              border:
                '1px solid rgba(239,68,68,0.25)',
              background:
                'rgba(239,68,68,0.08)',
            }}
          >
            Remove from company
          </button>

          <div
            style={{
              display: 'flex',
              gap: '10px',
            }}
          >
            <button
              type="button"
              onClick={closeEditMember}
              disabled={editLoading}
              style={cancelButtonStyle}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={editLoading}
              style={{
                ...sendButtonStyle,
                opacity: editLoading
                  ? 0.65
                  : 1,
              }}
            >
              {editLoading
                ? 'Saving...'
                : 'Save changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
)}
    </main>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div style={summaryCardStyle}>
      <p style={summaryLabelStyle}>
        {label}
      </p>

      <p style={summaryValueStyle}>
        {value}
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
      .slice(0, 2) || '?'
  )
}

function formatLabel(value) {
  if (!value) return ''

  return String(value)
    .split('-')
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(' ')
}

function getRoleStyle(role) {
  if (role === 'owner') {
    return {
      background: 'rgba(129,140,248,0.14)',
      border:
        '1px solid rgba(129,140,248,0.3)',
      color: '#C7D2FE',
    }
  }

  if (role === 'admin') {
    return {
      background: 'rgba(59,130,246,0.12)',
      border:
        '1px solid rgba(59,130,246,0.25)',
      color: '#93C5FD',
    }
  }

  if (role === 'recruiter') {
    return {
      background: 'rgba(16,185,129,0.12)',
      border:
        '1px solid rgba(16,185,129,0.25)',
      color: '#6EE7B7',
    }
  }

  return {
    background: 'rgba(148,163,184,0.10)',
    border:
      '1px solid rgba(148,163,184,0.20)',
    color: '#CBD5E1',
  }
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
  maxWidth: '1100px',
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
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '20px',
  marginBottom: '28px',
  flexWrap: 'wrap',
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
}

const primaryButtonStyle = {
  border: 'none',
  padding: '12px 18px',
  borderRadius: '11px',
  background:
    'linear-gradient(135deg, #5B4FE8, #7C3AED)',
  color: '#FFFFFF',
  fontSize: '14px',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow:
    '0 4px 16px rgba(91,79,232,0.35)',
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
  borderRadius: '15px',
  background: 'rgba(255,255,255,0.04)',
  border:
    '1px solid rgba(255,255,255,0.08)',
}

const summaryLabelStyle = {
  margin: '0 0 7px',
  color: 'rgba(255,255,255,0.4)',
  fontSize: '11px',
  textTransform: 'uppercase',
}

const summaryValueStyle = {
  margin: 0,
  fontSize: '20px',
  fontWeight: 800,
}

const cardStyle = {
  padding: '24px',
  borderRadius: '20px',
  background: 'rgba(255,255,255,0.04)',
  border:
    '1px solid rgba(255,255,255,0.08)',
}

const sectionHeaderStyle = {
  marginBottom: '18px',
}

const sectionTitleStyle = {
  margin: '0 0 6px',
  fontSize: '18px',
}

const sectionDescriptionStyle = {
  margin: 0,
  color: 'rgba(255,255,255,0.4)',
  fontSize: '12px',
}

const membersListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
}

const memberCardStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '18px',
  padding: '16px',
  borderRadius: '15px',
  background: 'rgba(255,255,255,0.03)',
  border:
    '1px solid rgba(255,255,255,0.07)',
  flexWrap: 'wrap',
}

const memberIdentityStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  minWidth: 0,
  flex: '1 1 320px',
}

const memberAvatarStyle = {
  width: '50px',
  height: '50px',
  minWidth: '50px',
  overflow: 'hidden',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background:
    'linear-gradient(135deg, #5B4FE8, #818CF8)',
  color: '#FFFFFF',
  fontSize: '16px',
  fontWeight: 800,
}

const memberAvatarImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
}

const memberInfoStyle = {
  minWidth: 0,
}

const memberNameStyle = {
  margin: '0 0 5px',
  fontSize: '15px',
}

const memberTitleStyle = {
  margin: '0 0 4px',
  color: 'rgba(255,255,255,0.52)',
  fontSize: '12px',
}

const usernameStyle = {
  margin: 0,
  color: 'rgba(255,255,255,0.32)',
  fontSize: '11px',
}

const memberRightStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '9px',
  flexWrap: 'wrap',
}

const roleBadgeStyle = {
  padding: '6px 10px',
  borderRadius: '999px',
  fontSize: '11px',
  fontWeight: 700,
}

const viewProfileStyle = {
  padding: '8px 11px',
  borderRadius: '9px',
  background: 'rgba(255,255,255,0.05)',
  border:
    '1px solid rgba(255,255,255,0.09)',
  color: '#C7D2FE',
  textDecoration: 'none',
  fontSize: '11px',
  fontWeight: 700,
}

const editButtonStyle = {
  padding: '8px 11px',
  borderRadius: '9px',
  background: 'rgba(255,255,255,0.05)',
  border:
    '1px solid rgba(255,255,255,0.09)',
  color: '#FFFFFF',
  fontSize: '11px',
  fontWeight: 700,
  cursor: 'pointer',
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

const emptyStateStyle = {
  padding: '38px 20px',
  textAlign: 'center',
  border:
    '1px dashed rgba(255,255,255,0.12)',
  borderRadius: '15px',
}

const emptyIconStyle = {
  fontSize: '28px',
  marginBottom: '10px',
}

const emptyTitleStyle = {
  margin: '0 0 6px',
  fontSize: '15px',
}

const emptyTextStyle = {
  margin: 0,
  color: 'rgba(255,255,255,0.4)',
  fontSize: '12px',
}
const successStyle = {
  marginBottom: '20px',
  padding: '12px 14px',
  borderRadius: '10px',
  background: 'rgba(16,185,129,0.10)',
  border: '1px solid rgba(16,185,129,0.22)',
  color: '#6EE7B7',
  fontSize: '13px',
}

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  background: 'rgba(2,6,23,0.78)',
  backdropFilter: 'blur(5px)',
}

const modalStyle = {
  width: '100%',
  maxWidth: '520px',
  maxHeight: '90vh',
  overflowY: 'auto',
  padding: '24px',
  borderRadius: '20px',
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 24px 70px rgba(0,0,0,0.45)',
}

const modalHeaderStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '20px',
  marginBottom: '24px',
}

const modalEyebrowStyle = {
  margin: '0 0 6px',
  color: '#818CF8',
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}

const modalTitleStyle = {
  margin: '0 0 7px',
  color: '#FFFFFF',
  fontSize: '22px',
}

const modalDescriptionStyle = {
  margin: 0,
  color: 'rgba(255,255,255,0.48)',
  fontSize: '12px',
  lineHeight: 1.6,
}

const closeButtonStyle = {
  width: '34px',
  height: '34px',
  flexShrink: 0,
  borderRadius: '9px',
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.05)',
  color: '#FFFFFF',
  fontSize: '20px',
  cursor: 'pointer',
}

const formGroupStyle = {
  marginBottom: '18px',
}

const labelStyle = {
  display: 'block',
  marginBottom: '7px',
  color: '#FFFFFF',
  fontSize: '12px',
  fontWeight: 700,
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 13px',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.12)',
  outline: 'none',
  background: 'rgba(255,255,255,0.05)',
  color: '#FFFFFF',
  fontSize: '13px',
}

const helperTextStyle = {
  margin: '7px 0 0',
  color: 'rgba(255,255,255,0.35)',
  fontSize: '10px',
  lineHeight: 1.5,
}

const modalErrorStyle = {
  marginBottom: '18px',
  padding: '11px 12px',
  borderRadius: '9px',
  background: 'rgba(239,68,68,0.10)',
  border: '1px solid rgba(239,68,68,0.20)',
  color: '#FCA5A5',
  fontSize: '12px',
}

const modalActionsStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
  marginTop: '24px',
}

const cancelButtonStyle = {
  padding: '10px 15px',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.05)',
  color: '#FFFFFF',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
}

const sendButtonStyle = {
  padding: '10px 16px',
  borderRadius: '10px',
  border: 'none',
  background:
    'linear-gradient(135deg, #5B4FE8, #7C3AED)',
  color: '#FFFFFF',
  fontSize: '12px',
  fontWeight: 700,
}