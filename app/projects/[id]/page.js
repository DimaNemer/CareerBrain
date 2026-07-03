import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import DeleteProjectButton from './delete-project-button'
import AddRoleForm from './add-role-form'
import RoleActions from './role-actions'
import RequestToJoinButton from './request-to-join-button'
import JoinRequestActions from './join-request-actions'
import MemberActions from './member-actions'

export default async function ProjectDetailsPage({ params }) {
  const supabase = await createClient()
  const { id } = await params

  const [
    {
      data: { user },
    },
    { data: project, error },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('projects')
      .select(`
        id,
        owner_id,
        title,
        description,
        status,
        created_at,
        profiles (full_name, username)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single(),
  ])

  if (error || !project) {
    return (
      <main className="p-10">
        <h1 className="text-2xl font-bold text-red-600">Project not found</h1>
      </main>
    )
  }

  const isOwner = user?.id === project.owner_id

  const rolesQuery = supabase
    .from('project_roles')
    .select(`*, skills (id, name, category)`)
    .eq('project_id', id)
    .order('role_title', { ascending: true })

  const skillsQuery = supabase
    .from('skills')
    .select('id, name, category')
    .order('name', { ascending: true })

  const userRequestsQuery =
    user && !isOwner
      ? supabase
      .from('join_requests')
      .select('id, project_role_id, status')
      .eq('project_id', id)
      .eq('user_id', user.id)
      : Promise.resolve({ data: [] })

  const joinRequestsQuery = isOwner
    ? supabase
      .from('join_requests')
      .select(`
        *,
        profiles (id, username, full_name, avatar_url),
        project_roles (
          id,
          role_title,
          skills (id, name, category)
        )
      `)
      .eq('project_id', id)
      .order('created_at', { ascending: false })
    : Promise.resolve({ data: [] })

  const projectMembersQuery = supabase
    .from('project_members')
    .select(`*, profiles (id, full_name, username, avatar_url)`)
    .eq('project_id', id)

  const [
    { data: roles },
    { data: skills },
    { data: userRequestData },
    { data: joinRequestData },
    { data: projectMembers },
  ] = await Promise.all([
    rolesQuery,
    skillsQuery,
    userRequestsQuery,
    joinRequestsQuery,
    projectMembersQuery,
  ])

  const userRequests = userRequestData || []
  const joinRequests = joinRequestData || []
  const members = projectMembers || []
  let isMember = false

  if (!isOwner && user) {
    isMember = members.some((member) => member.user_id === user.id)
  }

  const hasActiveRequestOrMembership = userRequests.some((request) =>
  ['pending', 'accepted'].includes(request.status)
)

  function getRequestForRole(roleId) {
    return userRequests.find((request) => request.project_role_id === roleId)
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-4xl rounded-xl bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <Link href="/projects" className="text-blue-600 hover:underline">
            ← Back to Projects
          </Link>

          {isOwner && (
            <div className="flex gap-3">
              <Link
                href={`/projects/${project.id}/edit`}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Edit Project
              </Link>

              <DeleteProjectButton projectId={project.id} />
            </div>
          )}
        </div>

        <h1 className="mt-6 text-3xl font-bold">{project.title}</h1>

        <p className="mt-4 text-gray-600">
          {project.description || 'No description provided.'}
        </p>

        <div className="mt-8 space-y-2 border-t pt-6 text-sm text-gray-500">
          <p><strong>Status:</strong> {project.status}</p>
          <p><strong>Owner:</strong> {project.profiles.full_name}</p>
          <p><strong>Username:</strong> {project.profiles.username}</p>
          <p><strong>Created:</strong> {new Date(project.created_at).toLocaleString()}</p>
        </div>

        <section className="mt-10 border-t pt-8">
          <h2 className="text-2xl font-bold text-gray-900">Roles Needed</h2>

          {!roles || roles.length === 0 ? (
            <p className="mt-3 text-gray-600">No roles added yet.</p>
          ) : (
            <div className="mt-5 space-y-4">
              {roles.map((role) => {
                const request = getRequestForRole(role.id)

                return (
                  <div key={role.id} className="rounded-xl border bg-gray-50 p-4">
                    <h3 className="font-semibold text-gray-900">{role.role_title}</h3>

                    <p className="mt-1 text-sm text-gray-600">
                      Skill: {role.skills?.name || 'No specific skill'}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Quantity needed: {role.quantity_needed}
                    </p>

                    {isOwner && <RoleActions role={role} skills={skills || []} />}

                    {!isOwner && request?.status === 'pending' && (
                      <p className="mt-4 inline-block rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
                        Request Status: Pending
                      </p>
                    )}

                    {!isOwner && request?.status === 'accepted' && (
                      <p className="mt-4 inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                        Request Accepted
                      </p>
                    )}

                    {!isOwner && request?.status === 'rejected' && (
                      <p className="mt-4 inline-block rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                        Request Rejected
                      </p>
                    )}

                    {!isOwner && request?.status === 'left' && (
                      <p className="mt-4 inline-block rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                        You left this role
                      </p>
                    )}

                    {!isOwner && request?.status === 'removed' && (
                      <p className="mt-4 inline-block rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                        You were removed from this role
                      </p>
                    )}

                    {!isOwner &&
                     !request &&
                     !hasActiveRequestOrMembership &&
                     project.status === 'open' &&
                     role.quantity_needed > 0 && (
                     <RequestToJoinButton
                     projectId={project.id}
                     roleId={role.id}
                     />
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {isOwner && <AddRoleForm projectId={project.id} skills={skills || []} />}
        </section>

        {isOwner && (
          <section className="mt-10 border-t pt-8">
            <h2 className="text-2xl font-bold text-gray-900">Join Requests</h2>

            {joinRequests.length === 0 ? (
              <p className="mt-3 text-gray-600">No join requests yet.</p>
            ) : (
              <div className="mt-5 space-y-4">
                {joinRequests.map((request) => (
                  <div key={request.id} className="rounded-xl border bg-gray-50 p-4">
                    <h3 className="font-semibold text-gray-900">
                      {request.profiles?.full_name || 'Unknown user'}
                    </h3>

                    <p className="mt-1 text-sm text-gray-600">
                      Username: {request.profiles?.username || '-'}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Requested Role: {request.project_roles?.role_title || '-'}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Skill: {request.project_roles?.skills?.name || 'No specific skill'}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Message: {request.message || 'No message provided.'}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Status: {request.status}
                    </p>

                    {request.status === 'pending' && (
                      <JoinRequestActions requestId={request.id} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {(isOwner || isMember) && (
          <section className="mt-10 border-t pt-8">
            <h2 className="text-2xl font-bold text-gray-900">Project Members</h2>

            {members.length === 0 ? (
              <p className="mt-3 text-gray-600">No members yet.</p>
            ) : (
              <div className="mt-5 space-y-4">
                {members.map((member) => (
                  <div key={member.id} className="rounded-xl border bg-gray-50 p-4">
                    <h3 className="font-semibold text-gray-900">
                      {member.profiles?.full_name || 'Unknown member'}
                    </h3>

                    <p className="text-sm text-gray-600">
                      @{member.profiles?.username || '-'}
                    </p>

                    <p className="text-sm text-gray-600">
                      Role: {member.role_in_project}
                    </p>

                    <p className="text-sm text-gray-600">
                      Joined: {new Date(member.joined_at).toLocaleDateString()}
                    </p>

                    <MemberActions
                      memberId={member.id}
                      isOwner={isOwner}
                      isCurrentUser={user?.id === member.user_id}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  )
}
