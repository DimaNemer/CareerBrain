'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Team management UI.
 *
 * Data comes from the parent server component on first paint and is refreshed
 * from /api/employer/team after every mutation. Nothing here is static or
 * mocked: members and pending invites are always the database values.
 *
 * Company permission options. `owner` is intentionally absent - it is granted
 * through a separate, owner-only action rather than a routine invite.
 */
const PERMISSION_OPTIONS = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'admin', label: 'Admin' },
]

/**
 * 'owner' is not offered when inviting, but an existing owner must still appear
 * in the edit control or the select would be set to a value with no matching
 * option. Owner changes stay owner-gated on the server either way.
 */
function permissionOptions(currentValue) {
  return currentValue === 'owner'
    ? [{ value: 'owner', label: 'Owner' }, ...PERMISSION_OPTIONS]
    : PERMISSION_OPTIONS
}

const ROLE_COLORS = {
  owner: { color: '#C4B5FD', background: 'rgba(139,92,246,0.14)', border: 'rgba(139,92,246,0.28)' },
  admin: { color: '#93C5FD', background: 'rgba(59,130,246,0.14)', border: 'rgba(59,130,246,0.28)' },
  recruiter: { color: 'rgba(255,255,255,0.78)', background: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.12)' },
  viewer: { color: 'rgba(255,255,255,0.66)', background: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.10)' },
}

const TITLE_CASE = value =>
  typeof value === 'string' && value.length > 0
    ? value.charAt(0).toUpperCase() + value.slice(1)
    : ''

const AVATAR_TINTS = [
  { background: 'linear-gradient(135deg, #6D5BE0, #8B5CF6)' },
  { background: 'linear-gradient(135deg, #3B82F6, #6366F1)' },
  { background: 'linear-gradient(135deg, #0EA5A4, #3B82F6)' },
  { background: 'linear-gradient(135deg, #8B5CF6, #C084FC)' },
]

function Avatar({ name, avatarUrl, index = 0 }) {
  const [failed, setFailed] = useState(false)
  const tint = AVATAR_TINTS[index % AVATAR_TINTS.length]

  if (avatarUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        onError={() => setFailed(true)}
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      style={{
        width: '42px',
        height: '42px',
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: '15px',
        color: '#fff',
        flexShrink: 0,
        border: '1px solid rgba(255,255,255,0.12)',
        ...tint,
      }}
    >
      {(name || '?').trim().charAt(0).toUpperCase()}
    </span>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="tm-stat">
      <p className="tm-stat-label">{label}</p>
      <p className="tm-stat-value">{value}</p>
    </div>
  )
}

function Field({ label, htmlFor, helper, error, children }) {
  return (
    <div className="tm-field">
      <label className="tm-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="tm-helper tm-helper-error">{error}</p>
      ) : (
        helper && <p className="tm-helper">{helper}</p>
      )}
    </div>
  )
}

export default function TeamManager({
  companyName = 'Your company',
  initialMembers = [],
  initialInvites = [],
  canManage = false,
  currentUserId,
  currentRole,
  currentJobTitle,
}) {
  const router = useRouter()
  const [members, setMembers] = useState(initialMembers)
  const [invites, setInvites] = useState(initialInvites)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('invite')
  const [editingMember, setEditingMember] = useState(null)

  const [username, setUsername] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [permission, setPermission] = useState('viewer')
  const [formError, setFormError] = useState('')

  const usernameRef = useRef(null)
  const closeButtonRef = useRef(null)

  const refresh = async () => {
    try {
      const response = await fetch('/api/employer/team')
      const payload = await response.json()

      if (response.ok) {
        setMembers(payload.members || [])
        setInvites(payload.invites || [])
      }
    } catch {
      // Keep the current list if a refresh fails.
    }
  }

  const run = async (work, successMessage) => {
    setBusy(true)
    setError('')
    setNotice('')

    try {
      await work()
      await refresh()
      router.refresh()
      setNotice(successMessage)
    } catch (workError) {
      setError(workError.message || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const closeModal = () => {
    setModalOpen(false)
    setFormError('')
    setUsername('')
    setJobTitle('')
    setPermission('viewer')
    setEditingMember(null)
  }

  const openInviteModal = () => {
    setModalMode('invite')
    setEditingMember(null)
    setUsername('')
    setJobTitle('')
    setPermission('viewer')
    setFormError('')
    setModalOpen(true)
  }

  const openEditModal = member => {
    setModalMode('edit')
    setEditingMember(member)
    setUsername('')
    setJobTitle(member.job_title || '')
    setPermission(member.role)
    setFormError('')
    setModalOpen(true)
  }

  // Escape closes, and the page behind must not scroll while the modal is up.
  useEffect(() => {
    if (!modalOpen) return undefined

    const onKeyDown = event => {
      if (event.key === 'Escape') closeModal()
    }

    document.addEventListener('keydown', onKeyDown)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [modalOpen])

  useEffect(() => {
    if (!modalOpen) return
    const target = modalMode === 'invite' ? usernameRef.current : closeButtonRef.current
    target?.focus()
  }, [modalOpen, modalMode])

  const submitInvite = async event => {
    event.preventDefault()

    const target = username.trim()

    if (!target) {
      setFormError('Enter a username or email address')
      return
    }

    await run(async () => {
      const response = await fetch('/api/employer/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: target,
          role: permission,
          job_title: jobTitle.trim(),
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to send that invite')
      }
    }, 'Invite sent')

    closeModal()
  }

  const submitEdit = async event => {
    event.preventDefault()

    if (!editingMember) return

    await run(async () => {
      const response = await fetch(`/api/employer/team/${editingMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: permission,
          job_title: jobTitle.trim(),
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to update that teammate')
      }
    }, `Updated ${editingMember.profiles?.full_name || 'teammate'}`)

    closeModal()
  }

  const handleRoleChange = async (member, newRole) => {
    if (newRole === member.role) return

    await run(async () => {
      const response = await fetch(`/api/employer/team/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to update that role')
      }
    }, `Role updated to ${newRole}`)
  }

  const handleRemove = async member => {
    const name =
      member.profiles?.full_name || member.profiles?.username || 'this teammate'

    if (!window.confirm(`Remove ${name} from your workspace?`)) return

    await run(async () => {
      const response = await fetch(`/api/employer/team/${member.id}`, {
        method: 'DELETE',
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to remove that teammate')
      }
    }, 'Teammate removed')
  }

  const handleRevoke = async invite => {
    if (!window.confirm(`Revoke the invite for ${invite.email}?`)) return

    await run(async () => {
      const response = await fetch(`/api/employer/team/invites/${invite.id}`, {
        method: 'DELETE',
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to revoke that invite')
      }
    }, 'Invite revoked')
  }

  const handleLeave = async () => {
    if (
      !window.confirm(
        'Leave this company workspace? You will need another invite to rejoin.'
      )
    ) {
      return
    }

    setBusy(true)
    setError('')
    setNotice('')

    try {
      const response = await fetch('/api/employer/team/me', { method: 'DELETE' })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to leave this workspace')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (leaveError) {
      setError(leaveError.message || 'Something went wrong')
      setBusy(false)
    }
  }

  return (
    <div className="employer-team">
      <header className="tm-header">
        <div>
          <a className="tm-back" href="/employer/dashboard">
            ← Back to employer dashboard
          </a>

          <p className="tm-eyebrow">Team Management</p>

          <h1 className="tm-title">{companyName}</h1>

          <p className="tm-subtitle">
            Manage the people connected to your company.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            className="tm-primary"
            onClick={openInviteModal}
            disabled={busy}
          >
            + Add member
          </button>
        )}
      </header>

      <section className="tm-stats">
        <StatCard label="Team members" value={members.length} />
        <StatCard label="Your role" value={TITLE_CASE(currentRole) || 'Member'} />
        <StatCard
          label="Your title"
          value={currentJobTitle || 'Not set'}
        />
      </section>

      {error && <p className="tm-message is-error">{error}</p>}
      {notice && <p className="tm-message">{notice}</p>}

      <section className="tm-card">
        <h2 className="tm-card-title">Current team</h2>
        <p className="tm-card-subtitle">
          People currently connected to {companyName}.
        </p>

        <ul className="tm-list">
          {members.map((member, index) => {
            const profile = member.profiles || {}
            const name = profile.full_name || profile.username || 'Teammate'
            const isSelf = member.user_id === currentUserId
            const roleColor = ROLE_COLORS[member.role] || ROLE_COLORS.viewer

            return (
              <li key={member.id} className="tm-row">
                <div className="tm-identity">
                  <Avatar
                    name={name}
                    avatarUrl={profile.avatar_url}
                    index={index}
                  />

                  <div className="tm-identity-text">
                    <p className="tm-name">
                      {name}
                      {isSelf && <span className="tm-you">You</span>}
                    </p>

                    {member.job_title && (
                      <p className="tm-job-title">{member.job_title}</p>
                    )}

                    {profile.username && (
                      <p className="tm-username">@{profile.username}</p>
                    )}
                  </div>
                </div>

                <div className="tm-actions">
                  <span
                    className="tm-badge"
                    style={{
                      color: roleColor.color,
                      background: roleColor.background,
                      border: `1px solid ${roleColor.border}`,
                    }}
                  >
                    {TITLE_CASE(member.role)}
                  </span>

                  {profile.id && (
                    <a className="tm-button" href={`/profile/${profile.id}`}>
                      View profile
                    </a>
                  )}

                  {canManage && !isSelf && (
                    <>
                      <select
                        className="app-select tm-role-select"
                        value={member.role}
                        onChange={event =>
                          handleRoleChange(member, event.target.value)
                        }
                        aria-label={`Role for ${name}`}
                        disabled={busy}
                      >
                        {permissionOptions(member.role).map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => openEditModal(member)}
                        disabled={busy}
                        className="tm-button"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemove(member)}
                        disabled={busy}
                        className="tm-danger"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>

        {invites.length > 0 && (
          <div className="tm-pending">
            <p className="tm-pending-title">
              {invites.length} pending invite{invites.length === 1 ? '' : 's'}
            </p>

            <ul className="tm-pending-list">
              {invites.map(invite => (
                <li key={invite.id} className="tm-pending-row">
                  <div className="tm-pending-info">
                    <span className="tm-pending-email">{invite.email}</span>

                    <span className="tm-pending-role">
                      {TITLE_CASE(invite.role)}
                    </span>

                    {invite.job_title && (
                      <span className="tm-pending-title-text">
                        {invite.job_title}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRevoke(invite)}
                    disabled={busy}
                    className="tm-danger"
                  >
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={handleLeave}
          disabled={busy}
          className="tm-leave"
        >
          Leave this workspace
        </button>
      </section>

      {modalOpen && (
        <div
          className="tm-overlay"
          onMouseDown={event => {
            if (event.target === event.currentTarget) closeModal()
          }}
        >
          <div
            className="tm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tm-modal-title"
          >
            <button
              type="button"
              ref={closeButtonRef}
              className="tm-close"
              onClick={closeModal}
              aria-label="Close"
            >
              ✕
            </button>

            <p className="tm-modal-eyebrow">Team invitation</p>

            <h2 id="tm-modal-title" className="tm-modal-title">
              {modalMode === 'edit' ? 'Edit team member' : 'Add a team member'}
            </h2>

            <p className="tm-modal-subtitle">
              {modalMode === 'edit'
                ? `Update the role and job title for ${companyName}.`
                : `Invite an existing Career Brain user to join ${companyName}.`}
            </p>

            <form
              onSubmit={
                modalMode === 'edit' ? submitEdit : submitInvite
              }
              className="tm-form"
            >
              {modalMode === 'invite' && (
                <Field
                  label="Username"
                  htmlFor="tm-username"
                  helper="Enter the username of an existing Career Brain account."
                  error={formError || undefined}
                >
                  <input
                    id="tm-username"
                    ref={usernameRef}
                    className="tm-input"
                    type="text"
                    value={username}
                    onChange={event => setUsername(event.target.value)}
                    placeholder="@username"
                    disabled={busy}
                  />
                </Field>
              )}

              <Field
                label="Job title"
                htmlFor="tm-job-title"
                helper="This title can appear publicly on the members company relationship."
              >
                <input
                  id="tm-job-title"
                  className="tm-input"
                  type="text"
                  value={jobTitle}
                  onChange={event => setJobTitle(event.target.value)}
                  placeholder="e.g. HR Manager"
                  disabled={busy}
                />
              </Field>

              <Field label="Company permission" htmlFor="tm-permission">
                <select
                  id="tm-permission"
                  className="app-select tm-input tm-select"
                  value={permission}
                  onChange={event => setPermission(event.target.value)}
                  disabled={busy}
                >
                  {permissionOptions(permission).map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>

              {modalMode === 'edit' && formError && (
                <p className="tm-helper tm-helper-error">{formError}</p>
              )}

              <div className="tm-form-actions">
                <button
                  type="button"
                  className="tm-button"
                  onClick={closeModal}
                  disabled={busy}
                >
                  Cancel
                </button>

                <button type="submit" className="tm-primary" disabled={busy}>
                  {busy
                    ? 'Working...'
                    : modalMode === 'edit'
                      ? 'Save changes'
                      : 'Send invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
  .employer-team {
    width: 100%;
  }

  .tm-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 26px;
    flex-wrap: wrap;
  }

  .tm-back {
    display: inline-block;
    margin-bottom: 16px;
    color: rgba(255,255,255,0.5);
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    transition: color 0.15s;
  }

  .tm-back:hover {
    color: #fff;
  }

  .tm-eyebrow {
    margin: 0 0 8px;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #818CF8;
  }

  .tm-title {
    margin: 0 0 8px;
    font-size: 30px;
    font-weight: 800;
    color: #fff;
    overflow-wrap: anywhere;
  }

  .tm-subtitle {
    margin: 0;
    font-size: 14px;
    color: rgba(255,255,255,0.5);
  }

  .tm-primary {
    padding: 13px 20px;
    border-radius: 12px;
    border: 1px solid transparent;
    background: linear-gradient(135deg, #5B4FE8, #7C3AED);
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    white-space: nowrap;
    box-shadow: 0 4px 16px rgba(91,79,232,0.35);
  }

  .tm-primary:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .tm-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 24px;
  }

  .tm-stat {
    padding: 18px 20px;
    border-radius: 16px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    min-width: 0;
  }

  .tm-stat-label {
    margin: 0 0 8px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.42);
  }

  .tm-stat-value {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #fff;
    overflow-wrap: anywhere;
  }

  .tm-message {
    margin: 0 0 16px;
    font-size: 13px;
    color: #6EE7B7;
  }

  .tm-message.is-error {
    color: #FCA5A5;
  }

  .tm-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    padding: 24px;
  }

  .tm-card-title {
    margin: 0 0 6px;
    font-size: 18px;
    font-weight: 700;
    color: #fff;
  }

  .tm-card-subtitle {
    margin: 0 0 20px;
    font-size: 13px;
    color: rgba(255,255,255,0.45);
  }

  .tm-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .tm-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 14px 16px;
    border-radius: 14px;
    background: rgba(255,255,255,0.035);
    border: 1px solid rgba(255,255,255,0.07);
    flex-wrap: wrap;
  }

  .tm-identity {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    flex: 1 1 240px;
  }

  .tm-identity-text {
    min-width: 0;
  }

  .tm-name {
    margin: 0 0 3px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 700;
    color: #fff;
    overflow-wrap: anywhere;
  }

  .tm-you {
    font-size: 10px;
    font-weight: 700;
    color: #818CF8;
    border: 1px solid rgba(129,140,248,0.3);
    background: rgba(129,140,248,0.12);
    border-radius: 999px;
    padding: 2px 7px;
  }

  .tm-job-title {
    margin: 0 0 2px;
    font-size: 12.5px;
    color: rgba(255,255,255,0.62);
    overflow-wrap: anywhere;
  }

  .tm-username {
    margin: 0;
    font-size: 12px;
    color: rgba(255,255,255,0.38);
    overflow-wrap: anywhere;
  }

  .tm-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .tm-badge {
    font-size: 11px;
    font-weight: 700;
    border-radius: 999px;
    padding: 4px 11px;
    white-space: nowrap;
  }

  .tm-button {
    display: inline-flex;
    align-items: center;
    padding: 8px 13px;
    border-radius: 9px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.82);
    font-size: 13px;
    font-weight: 700;
    font-family: inherit;
    text-decoration: none;
    cursor: pointer;
    white-space: nowrap;
  }

  .tm-button:hover:not(:disabled) {
    color: #fff;
    border-color: rgba(255,255,255,0.22);
  }

  .tm-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .tm-danger {
    display: inline-flex;
    align-items: center;
    padding: 8px 13px;
    border-radius: 9px;
    border: 1px solid rgba(248,113,113,0.35);
    background: rgba(239,68,68,0.12);
    color: #FCA5A5;
    font-size: 13px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    white-space: nowrap;
  }

  .tm-danger:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* background-color, not the background shorthand: the shorthand would reset
     background-image and wipe out the chevron supplied by .app-select. */
  .tm-role-select {
    padding: 8px 34px 8px 11px;
    border-radius: 9px;
    border: 1px solid rgba(255,255,255,0.12);
    background-color: rgba(255,255,255,0.05);
    color: #fff;
    font-size: 13px;
    font-family: inherit;
  }

  .tm-role-select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .tm-pending {
    margin-top: 22px;
    padding-top: 18px;
    border-top: 1px solid rgba(255,255,255,0.08);
  }

  .tm-pending-title {
    margin: 0 0 12px;
    font-size: 13px;
    font-weight: 700;
    color: rgba(255,255,255,0.6);
  }

  .tm-pending-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 9px;
  }

  .tm-pending-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 11px 14px;
    border-radius: 12px;
    background: rgba(252,211,77,0.05);
    border: 1px solid rgba(252,211,77,0.18);
    flex-wrap: wrap;
  }

  .tm-pending-info {
    display: flex;
    align-items: center;
    gap: 9px;
    flex-wrap: wrap;
    min-width: 0;
  }

  .tm-pending-email {
    font-size: 13px;
    color: rgba(255,255,255,0.78);
    overflow-wrap: anywhere;
  }

  .tm-pending-role {
    font-size: 11px;
    font-weight: 700;
    color: #FCD34D;
    border: 1px solid rgba(252,211,77,0.3);
    background: rgba(252,211,77,0.12);
    border-radius: 999px;
    padding: 2px 9px;
  }

  .tm-pending-title-text {
    font-size: 12px;
    color: rgba(255,255,255,0.4);
    overflow-wrap: anywhere;
  }

  .tm-leave {
    margin-top: 22px;
    padding: 10px 15px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.14);
    background: transparent;
    color: rgba(255,255,255,0.6);
    font-size: 13px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
  }

  .tm-leave:hover:not(:disabled) {
    color: #FCA5A5;
    border-color: rgba(248,113,113,0.35);
  }

  .tm-leave:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ---- Modal ---- */

  .tm-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(5, 8, 18, 0.72);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    overflow-y: auto;
  }

  .tm-modal {
    position: relative;
    width: 100%;
    max-width: 580px;
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    padding: 30px;
    border-radius: 20px;
    background: linear-gradient(160deg, #10182C 0%, #0C1322 100%);
    border: 1px solid rgba(255,255,255,0.10);
    box-shadow: 0 24px 60px rgba(0,0,0,0.5);
  }

  .tm-close {
    position: absolute;
    top: 18px;
    right: 18px;
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 9px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.7);
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
  }

  .tm-close:hover {
    color: #fff;
    border-color: rgba(255,255,255,0.24);
  }

  .tm-modal-eyebrow {
    margin: 0 0 8px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #818CF8;
  }

  .tm-modal-title {
    margin: 0 0 8px;
    font-size: 22px;
    font-weight: 800;
    color: #fff;
  }

  .tm-modal-subtitle {
    margin: 0 0 24px;
    font-size: 13.5px;
    color: rgba(255,255,255,0.5);
  }

  .tm-form {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .tm-field {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .tm-label {
    font-size: 12px;
    font-weight: 700;
    color: rgba(255,255,255,0.72);
  }

  .tm-input {
    width: 100%;
    box-sizing: border-box;
    padding: 12px 13px;
    border-radius: 11px;
    border: 1px solid rgba(255,255,255,0.12);
    background-color: rgba(255,255,255,0.05);
    color: #fff;
    font-size: 14px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  /* Room for the .app-select chevron so the selected value is never clipped. */
  .tm-select {
    padding-right: 40px;
  }

  .tm-input::placeholder {
    color: rgba(255,255,255,0.32);
  }

  .tm-input:focus {
    border-color: rgba(129,140,248,0.55);
    box-shadow: 0 0 0 3px rgba(129,140,248,0.14);
  }

  .tm-input:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .tm-helper {
    margin: 0;
    font-size: 11.5px;
    color: rgba(255,255,255,0.38);
  }

  .tm-helper-error {
    color: #FCA5A5;
  }

  .tm-form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 4px;
    flex-wrap: wrap;
  }

  @media (max-width: 720px) {
    .tm-stats {
      grid-template-columns: 1fr;
    }

    .tm-row {
      align-items: flex-start;
      flex-direction: column;
    }

    .tm-actions {
      width: 100%;
    }

    .tm-role-select {
      flex: 1;
      min-width: 0;
    }

    .tm-primary {
      width: 100%;
    }

    .tm-modal {
      padding: 24px 20px;
      border-radius: 16px;
    }

    .tm-modal-title {
      font-size: 19px;
    }

    .tm-form-actions .tm-primary,
    .tm-form-actions .tm-button {
      flex: 1;
      justify-content: center;
    }
  }
`}</style>
    </div>
  )
}