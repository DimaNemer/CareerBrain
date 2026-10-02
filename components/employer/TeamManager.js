'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ROLE_OPTIONS = [
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'admin', label: 'Admin' },
  { value: 'owner', label: 'Owner' },
]

const ROLE_COLORS = {
  owner: { color: '#C4B5FD', background: 'rgba(139,92,246,0.14)', border: 'rgba(139,92,246,0.28)' },
  admin: { color: '#93C5FD', background: 'rgba(59,130,246,0.14)', border: 'rgba(59,130,246,0.28)' },
  recruiter: { color: 'rgba(255,255,255,0.72)', background: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.12)' },
}

export default function TeamManager({
  initialMembers = [],
  initialInvites = [],
  canManage = false,
  currentUserId,
}) {
  const router = useRouter()
  const [members, setMembers] = useState(initialMembers)
  const [invites, setInvites] = useState(initialInvites)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('recruiter')
  const [jobTitle, setJobTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

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

  const handleInvite = async (event) => {
    event.preventDefault()

    if (!email.trim()) {
      setError('Enter an email address')
      return
    }

    await run(async () => {
      const response = await fetch('/api/employer/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          role,
          job_title: jobTitle.trim(),
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to send that invite')
      }

      setEmail('')
      setJobTitle('')
    }, 'Invite sent')
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

  const handleRemove = async (member) => {
    const name =
      member.profiles?.full_name ||
      member.profiles?.username ||
      'this teammate'

    if (!window.confirm(`Remove ${name} from your workspace?`)) {
      return
    }

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
    if (!window.confirm(`Revoke the invite for ${invite.email}?`)) {
      return
    }

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
      {canManage && (
        <form className="employer-team-invite" onSubmit={handleInvite}>
          <input
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="teammate@company.com"
            aria-label="Teammate email address"
            disabled={busy}
            required
          />

          <select
            className="app-select"
            value={role}
            onChange={event => setRole(event.target.value)}
            aria-label="Teammate role"
            disabled={busy}
          >
            {ROLE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={jobTitle}
            onChange={event => setJobTitle(event.target.value)}
            placeholder="Job title (optional)"
            aria-label="Teammate job title"
            disabled={busy}
          />

          <button type="submit" disabled={busy}>
            {busy ? 'Working...' : 'Send invite'}
          </button>
        </form>
      )}

      {error && <p className="employer-team-message is-error">{error}</p>}
      {notice && <p className="employer-team-message">{notice}</p>}

      <ul className="employer-team-list">
        {members.map(member => {
          const name =
            member.profiles?.full_name ||
            member.profiles?.username ||
            'Teammate'
          const isSelf = member.user_id === currentUserId
          const roleColor = ROLE_COLORS[member.role] || ROLE_COLORS.recruiter

          return (
            <li key={member.id} className="employer-team-row">
              <div className="employer-team-identity">
                <span className="employer-team-name">{name}</span>
                {isSelf && <span className="employer-team-you">You</span>}
                {member.job_title && (
                  <span className="employer-team-title">{member.job_title}</span>
                )}
              </div>

              <div className="employer-team-actions">
                <span
                  className="employer-team-role"
                  style={{
                    color: roleColor.color,
                    background: roleColor.background,
                    border: `1px solid ${roleColor.border}`,
                  }}
                >
                  {member.role}
                </span>

                {canManage && !isSelf && (
                  <>
                    <select
                      className="app-select"
                      value={member.role}
                      onChange={event =>
                        handleRoleChange(member, event.target.value)
                      }
                      aria-label={`Role for ${name}`}
                      disabled={busy}
                    >
                      {ROLE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemove(member)}
                      disabled={busy}
                      className="employer-team-remove"
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
        <div className="employer-team-pending">
          <p className="employer-team-pending-title">
            {invites.length} pending invite{invites.length === 1 ? '' : 's'}
          </p>

          <ul>
            {invites.map(invite => (
              <li key={invite.id}>
                <span>{invite.email}</span>

                <div className="employer-team-pending-actions">
                  <span className="employer-team-pending-role">
                    {invite.role}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRevoke(invite)}
                    disabled={busy}
                    className="employer-team-remove"
                  >
                    Revoke
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={handleLeave}
        disabled={busy}
        className="employer-team-leave"
      >
        Leave this workspace
      </button>

      <style>{`
  .employer-team-invite {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 0.7fr) minmax(0, 1fr) auto;
    gap: 10px;
    margin-bottom: 18px;
  }

  .employer-team-invite input,
  .employer-team-invite button {
    min-width: 0;
    padding: 11px 12px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.05);
    color: #fff;
    font-size: 14px;
    font-family: inherit;
  }

  /* background-color, not the background shorthand: the shorthand would reset
     background-image and wipe out the chevron supplied by .app-select. */
  .employer-team-invite select {
    min-width: 0;
    padding: 11px 36px 11px 12px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.12);
    background-color: rgba(255,255,255,0.05);
    color: #fff;
    font-size: 14px;
    font-family: inherit;
  }

  .employer-team-invite input::placeholder {
    color: rgba(255,255,255,0.35);
  }

  .employer-team-invite select option {
    background: #131A2E;
    color: #fff;
  }

  .employer-team-invite button {
    background: linear-gradient(135deg, #5B4FE8, #7C3AED);
    border-color: transparent;
    font-weight: 700;
    cursor: pointer;
  }

  .employer-team-invite button:disabled,
  .employer-team-actions button:disabled,
  .employer-team-actions select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .employer-team-message {
    margin: 0 0 14px;
    font-size: 13px;
    color: #6EE7B7;
  }

  .employer-team-message.is-error {
    color: #FCA5A5;
  }

  .employer-team-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .employer-team-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 13px 15px;
    border-radius: 13px;
    background: rgba(255,255,255,0.035);
    border: 1px solid rgba(255,255,255,0.07);
    flex-wrap: wrap;
  }

  .employer-team-identity {
    display: flex;
    align-items: center;
    gap: 9px;
    min-width: 0;
    flex-wrap: wrap;
  }

  .employer-team-name {
    font-size: 15px;
    font-weight: 700;
    overflow-wrap: anywhere;
  }

  .employer-team-you {
    font-size: 11px;
    font-weight: 700;
    color: #818CF8;
    border: 1px solid rgba(129,140,248,0.3);
    background: rgba(129,140,248,0.12);
    border-radius: 999px;
    padding: 2px 8px;
  }

  .employer-team-title {
    font-size: 12px;
    color: rgba(255,255,255,0.45);
    overflow-wrap: anywhere;
  }

  .employer-team-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .employer-team-actions select {
    padding: 8px 34px 8px 10px;
    border-radius: 9px;
    border: 1px solid rgba(255,255,255,0.12);
    background-color: rgba(255,255,255,0.05);
    color: #fff;
    font-size: 13px;
    font-family: inherit;
  }

  .employer-team-actions select option {
    background: #131A2E;
    color: #fff;
  }

  .employer-team-role {
    font-size: 11px;
    font-weight: 700;
    text-transform: capitalize;
    border-radius: 999px;
    padding: 4px 10px;
  }

  .employer-team-actions button.employer-team-remove {
    padding: 8px 12px;
    border-radius: 9px;
    border: 1px solid rgba(248,113,113,0.35);
    background: rgba(239,68,68,0.12);
    color: #FCA5A5;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
  }

  .employer-team-pending {
    margin-top: 18px;
    padding-top: 16px;
    border-top: 1px solid rgba(255,255,255,0.08);
  }

  .employer-team-pending-title {
    margin: 0 0 10px;
    font-size: 13px;
    color: rgba(255,255,255,0.5);
  }

  .employer-team-pending ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .employer-team-pending li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 13px;
    color: rgba(255,255,255,0.65);
    overflow-wrap: anywhere;
  }

  .employer-team-pending-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .employer-team-leave {
    margin-top: 18px;
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.14);
    background: transparent;
    color: rgba(255,255,255,0.6);
    font-size: 13px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
  }

  .employer-team-leave:hover:not(:disabled) {
    color: #FCA5A5;
    border-color: rgba(248,113,113,0.35);
  }

  .employer-team-pending-role {
    font-size: 11px;
    font-weight: 700;
    text-transform: capitalize;
    color: #FCD34D;
    border: 1px solid rgba(252,211,77,0.3);
    background: rgba(252,211,77,0.12);
    border-radius: 999px;
    padding: 2px 9px;
  }

  @media (max-width: 720px) {
    .employer-team-invite {
      grid-template-columns: 1fr;
    }

    .employer-team-row {
      align-items: flex-start;
      flex-direction: column;
    }

    .employer-team-actions {
      width: 100%;
    }

    .employer-team-actions select {
      flex: 1;
    }
  }
`}</style>
    </div>
  )
}