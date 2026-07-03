import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TaskBoard from '@/components/workspace/TaskBoard'
import ChatPanel from '@/components/workspace/ChatPanel'
import MarkCompleteButton from '@/components/workspace/MarkCompleteButton'
import ConfirmCompleteButton from '@/components/workspace/ConfirmCompleteButton'
import { theme } from '@/constants/colors'

export default async function WorkspacePage({ params }) {
  const supabase = await createClient()
  const { id: projectId } = await params

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username')
    .eq('id', user.id)
    .single()

  const { data: tasks } = await supabase
    .from('tasks')
    .select(`
      id,
      title,
      description,
      status,
      due_date,
      created_at,
      assigned_to,
      profiles!tasks_assigned_to_fkey (
        id,
        full_name,
        username,
        avatar_url
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  const { data: teamMembers } = await supabase
    .from('project_members')
    .select(`
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

  const isCompleted = project.status === 'completed'

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '32px',
        gap: '16px',
        flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ marginBottom: '6px' }}>
            <Link href={`/projects/${projectId}`} style={{
              fontSize: '13px',
              color: theme.text.secondary,
              textDecoration: 'none',
            }}>
              ← Back to project
            </Link>
          </div>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 700,
            color: theme.text.primary,
            margin: '0 0 8px',
            letterSpacing: '-0.3px',
          }}>
            {project.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 500,
              padding: '3px 10px',
              borderRadius: '20px',
              background: isCompleted ? theme.bg.emeraldSoft : theme.bg.indigoSoft,
              color: isCompleted ? theme.text.emerald : theme.text.indigo,
            }}>
              {isCompleted ? '✅ Completed' : '🔵 Active'}
            </span>
            {isOwner && (
              <span style={{ fontSize: '12px', color: theme.text.tertiary }}>
                You are the owner
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {isOwner && !isCompleted && !completionRequest && (
          <MarkCompleteButton projectId={projectId} />
        )}
        {completionRequest && !isCompleted && (
          <ConfirmCompleteButton projectId={projectId} />
        )}
      </div>

      {/* Team members */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '32px',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '13px', color: theme.text.secondary, fontWeight: 500 }}>
          Team:
        </span>
        {teamMembers?.map((tm, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: theme.bg.card,
            border: `1px solid ${theme.border.light}`,
            borderRadius: '20px',
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: theme.action.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: '#fff',
              fontWeight: 600,
            }}>
              {tm.profiles?.full_name?.[0]?.toUpperCase()}
            </div>
            <span style={{ fontSize: '12px', color: theme.text.primary, fontWeight: 500 }}>
              {tm.profiles?.full_name}
            </span>
            {tm.role_in_project && (
              <span style={{ fontSize: '11px', color: theme.text.tertiary }}>
                · {tm.role_in_project}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Tasks + Chat */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 360px',
        gap: '24px',
        alignItems: 'start',
      }}>
        <div style={{
          background: theme.bg.card,
          border: `1px solid ${theme.border.light}`,
          borderRadius: '16px',
          padding: '24px',
        }}>
       <TaskBoard
  tasks={tasks || []}
  projectId={projectId}
  currentUserId={user.id}
  isOwner={isOwner}
  teamMembers={teamMembers || []}
/>
        </div>

        <div style={{ height: '600px', position: 'sticky', top: '80px' }}>
          <ChatPanel
            projectId={projectId}
            currentUserId={user.id}
            currentUserName={profile?.full_name || 'You'}
          />
        </div>
      </div>
    </main>
  )
}