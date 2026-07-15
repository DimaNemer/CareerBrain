import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TaskBoard from '@/components/workspace/TaskBoard'
import ChatPanel from '@/components/workspace/ChatPanel'
import FilePanel from '@/components/workspace/FilePanel'
import MeetingsPanel from '@/components/workspace/MeetingsPanel'
import MarkCompleteButton from '@/components/workspace/MarkCompleteButton'
import ConfirmCompleteButton from '@/components/workspace/ConfirmCompleteButton'
import WorkspaceTabs from '@/components/workspace/WorkspaceTabs'
import { theme } from '@/constants/colors'

export default async function WorkspacePage({ params, searchParams }) {
  const supabase = await createClient()
  const { id: projectId } = await params
  const activeTab = (await searchParams)?.tab || 'tasks'

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('id, title, description, status, owner_id')
    .eq('id', projectId)
    .is('deleted_at', null)
    .single()

  if (!project) redirect('/projects')

  const isOwner = project.owner_id === user.id

  const { data: member } = await supabase
    .from('project_members')
    .select('id, role_in_project')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .is('left_at', null)
    .maybeSingle()

  if (!isOwner && !member) redirect('/projects')

const { data: currentUserProfile } = await supabase
  .from('profiles')
  .select('id, full_name, username, avatar_url')
  .eq('id', user.id)
  .single()

const { data: ownerProfile } = await supabase
  .from('profiles')
  .select('id, full_name, username, avatar_url')
  .eq('id', project.owner_id)
  .single()
  const { data: tasks } = await supabase
    .from('tasks')
    .select(`
      id, title, description, status, due_date, created_at, assigned_to,
      profiles!tasks_assigned_to_fkey ( id, full_name, username, avatar_url )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
const { data: teamMembers = [] } = await supabase
  .from('project_members')
  .select(`
    id,
    user_id,
    role_in_project,
    joined_at,
    profiles (
      id,
      full_name,
      username,
      avatar_url
    )
  `)
  .eq('project_id', projectId)
  .is('left_at', null)

  const { data: completionRequest } = await supabase
    .from('completion_requests')
    .select('id, status, required_confirmations')
    .eq('project_id', projectId)
    .eq('status', 'pending')
    .maybeSingle()

  // Add owner to team display if not already in members
const ownerEntry = ownerProfile
  ? {
      membership_id: `owner-${ownerProfile.id}`,
      id: `owner-${ownerProfile.id}`,
      user_id: ownerProfile.id,
      role_in_project: 'Owner',
      joined_at: null,
      profiles: ownerProfile,
    }
  : null

const validMemberEntries = (teamMembers || [])
  .filter(
    teamMember =>
      teamMember.profiles?.id &&
      teamMember.user_id
  )
  .filter(
    teamMember =>
      teamMember.user_id !== project.owner_id
  )
  .map(teamMember => ({
    ...teamMember,
    membership_id: `member-${teamMember.id}`,
  }))

const enrichedTeamMembers = [
  ...(ownerEntry ? [ownerEntry] : []),
  ...validMemberEntries,
]
  const isCompleted = project.status === 'completed'

  // Task stats for overview
  const totalTasks = tasks?.length || 0
  const doneTasks = tasks?.filter(t => t.status === 'done').length || 0
  const inProgressTasks = tasks?.filter(t => t.status === 'in_progress').length || 0
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 24px' }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '24px',
        gap: '16px',
        flexWrap: 'wrap',
      }}>
        <div>
          <Link href={`/projects/${projectId}`} style={{ fontSize: '13px', color: theme.text.secondary, textDecoration: 'none', display: 'block', marginBottom: '8px' }}>
            ← Back to project
          </Link>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: theme.text.primary, margin: '0 0 8px', letterSpacing: '-0.3px' }}>
            {project.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '12px', fontWeight: 500, padding: '3px 10px', borderRadius: '20px',
              background: isCompleted ? theme.bg.emeraldSoft : theme.bg.indigoSoft,
              color: isCompleted ? theme.text.emerald : theme.text.indigo,
            }}>
              {isCompleted ? '✅ Completed' : '🔵 Active'}
            </span>
            {isOwner && <span style={{ fontSize: '12px', color: theme.text.tertiary }}>You are the owner</span>}
            {totalTasks > 0 && (
              <span style={{ fontSize: '12px', color: theme.text.secondary }}>
                {progress}% complete · {doneTasks}/{totalTasks} tasks done
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isOwner && !isCompleted && !completionRequest && (
            <MarkCompleteButton projectId={projectId} />
          )}
          {completionRequest && !isCompleted && (
            <ConfirmCompleteButton projectId={projectId} />
          )}
        </div>
      </div>

      {/* Progress bar */}
      {totalTasks > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ height: '6px', background: theme.border.light, borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: progress === 100 ? theme.score.high : theme.action.primary,
              borderRadius: '3px',
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      )}
{/* Team row */}
<div
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  }}
>
  <span
    style={{
      fontSize: '13px',
      color: theme.text.secondary,
      fontWeight: 500,
    }}
  >
    Team:
  </span>

  {enrichedTeamMembers
    .filter(teamMember => teamMember.profiles?.id)
    .map((teamMember, index) => (
      <Link
        key={
          teamMember.membership_id ||
          teamMember.id ||
          `${teamMember.profiles.id}-${teamMember.role_in_project || 'member'}-${index}`
        }
        href={`/profile/${teamMember.profiles.id}`}
        title={`View ${
          teamMember.profiles.full_name || 'member'
        }'s profile`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          background: theme.bg.card,
          border: `1px solid ${theme.border.light}`,
          borderRadius: '20px',
          textDecoration: 'none',
        }}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            overflow: 'hidden',
            background: theme.action.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: '#fff',
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {teamMember.profiles.avatar_url ? (
            <img
              src={teamMember.profiles.avatar_url}
              alt={teamMember.profiles.full_name || 'Member'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            teamMember.profiles.full_name?.[0]?.toUpperCase() || '?'
          )}
        </div>

        <span
          style={{
            fontSize: '12px',
            color: theme.text.primary,
            fontWeight: 500,
          }}
        >
          {teamMember.profiles.full_name}
        </span>

        {teamMember.role_in_project && (
          <span
            style={{
              fontSize: '11px',
              color: theme.text.tertiary,
            }}
          >
            · {teamMember.role_in_project}
          </span>
        )}
      </Link>
    ))}
</div>

      {/* Tabs */}
      <WorkspaceTabs activeTab={activeTab} projectId={projectId} />

      {/* Tab content */}
      <div style={{ marginTop: '24px' }}>
        {activeTab === 'tasks' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>
            <div style={{ background: theme.bg.card, border: `1px solid ${theme.border.light}`, borderRadius: '16px', padding: '24px' }}>
              <TaskBoard
                tasks={tasks || []}
                projectId={projectId}
                currentUserId={user.id}
                isOwner={isOwner}
                teamMembers={enrichedTeamMembers}
              />
            </div>
            <div style={{ height: '580px', position: 'sticky', top: '80px' }}>
              <ChatPanel
                projectId={projectId}
                currentUserId={user.id}
                currentUserName={
  currentUserProfile?.full_name || 'You'
}
              />
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div style={{ background: theme.bg.card, border: `1px solid ${theme.border.light}`, borderRadius: '16px', padding: '24px' }}>
            <FilePanel
              projectId={projectId}
              currentUserId={user.id}
              isOwner={isOwner}
            />
          </div>
        )}

        {activeTab === 'meetings' && (
          <div style={{ background: theme.bg.card, border: `1px solid ${theme.border.light}`, borderRadius: '16px', padding: '24px' }}>
            <MeetingsPanel
              projectId={projectId}
              currentUserId={user.id}
              isOwner={isOwner}
            />
          </div>
        )}

        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Project info */}
            <div style={{ background: theme.bg.card, border: `1px solid ${theme.border.light}`, borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: theme.text.primary, margin: '0 0 16px' }}>Project info</h3>
              <p style={{ fontSize: '14px', color: theme.text.secondary, lineHeight: 1.7, margin: '0 0 20px' }}>
                {project.description || 'No description added.'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <StatRow label="Status" value={isCompleted ? '✅ Completed' : '🔵 Active'} />
                <StatRow label="Total tasks" value={totalTasks} />
                <StatRow label="Done" value={`${doneTasks} tasks`} />
                <StatRow label="In progress" value={`${inProgressTasks} tasks`} />
                <StatRow label="Team size" value={`${enrichedTeamMembers.length} members`} />
                <StatRow label="Progress" value={`${progress}%`} />
              </div>
            </div>

            {/* Recent activity */}
            <div style={{ background: theme.bg.card, border: `1px solid ${theme.border.light}`, borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: theme.text.primary, margin: '0 0 16px' }}>Team</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {enrichedTeamMembers.map((tm, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: `linear-gradient(135deg, ${theme.action.primary}, #818CF8)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', color: '#fff', fontWeight: 700, flexShrink: 0,
                    }}>
                      {tm.profiles?.full_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: theme.text.primary }}>
                        {tm.profiles?.full_name}
                      </div>
                      <div style={{ fontSize: '12px', color: theme.text.secondary }}>
                        {tm.role_in_project || 'Member'}
                      </div>
                    </div>
                    {tasks?.filter(t => t.assigned_to === tm.profiles?.id).length > 0 && (
                      <div style={{ marginLeft: 'auto', fontSize: '12px', color: theme.text.tertiary }}>
                        {tasks.filter(t => t.assigned_to === tm.profiles?.id).length} tasks
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function StatRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${theme.border.light}` }}>
      <span style={{ fontSize: '13px', color: theme.text.secondary }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 500, color: theme.text.primary }}>{value}</span>
    </div>
  )
}