import Link from 'next/link'
import {
  ArrowLeft,
  ArrowUpRight,
  AtSign,
  BriefcaseBusiness,
  CalendarDays,
  CircleCheck,
  Clock3,
  Edit3,
  Inbox,
  LayoutDashboard,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { createClient } from '@/lib/supabase-server'
import { getProjectStatusLabel } from '@/lib/project-status'
import DeleteProjectButton from './delete-project-button'
import AddRoleForm from './add-role-form'
import RoleActions from './role-actions'
import RequestToJoinButton from './request-to-join-button'
import JoinRequestActions from './join-request-actions'
import MemberActions from './member-actions'

const STATUS_STYLES = {
  open: 'border-emerald-300/30 bg-emerald-400/15 text-emerald-100',
  active: 'border-indigo-300/30 bg-indigo-400/15 text-indigo-100',
  completed: 'border-sky-300/30 bg-sky-400/15 text-sky-100',
  archived: 'border-slate-300/30 bg-slate-400/15 text-slate-100',
}

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
       profiles (
  id,
  full_name,
  username,
  avatar_url
)`)
      .eq('id', id)
      .is('deleted_at', null)
      .single(),
  ])

  if (error || !project) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-20 text-center">
        <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <Inbox size={32} className="mx-auto text-slate-400" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Project not found
          </h1>
          <Link
            href="/projects"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600"
          >
            <ArrowLeft size={16} />
            Back to projects
          </Link>
        </div>
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
  const isMember =
    !isOwner &&
    Boolean(user) &&
    members.some((member) => member.user_id === user.id)

  const hasActiveRequestOrMembership = userRequests.some((request) =>
    ['pending', 'accepted'].includes(request.status)
  )

  function getRequestForRole(roleId) {
    return userRequests.find((request) => request.project_role_id === roleId)
  }

  const totalOpenings = (roles || []).reduce(
    (total, role) => total + Number(role.quantity_needed),
    0
  )
  const pendingRequestCount = joinRequests.filter(
    (request) => request.status === 'pending'
  ).length

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600"
          >
            <ArrowLeft size={17} />
            Back to projects
          </Link>

          {isOwner && (
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/projects/${project.id}/edit`}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600"
              >
                <Edit3 size={16} />
                Edit project
              </Link>
              <DeleteProjectButton projectId={project.id} />
            </div>
          )}
        </div>

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 px-6 py-8 text-white shadow-xl shadow-indigo-950/10 sm:px-10 sm:py-10">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  STATUS_STYLES[project.status] || STATUS_STYLES.archived
                }`}
              >
                {getProjectStatusLabel(project.status)}
              </span>
              {isOwner && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-indigo-100">
                  <ShieldCheck size={13} />
                  You own this project
                </span>
              )}
            </div>

            <h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
              {project.title}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-indigo-100/75 sm:text-base">
              {project.description || 'No description provided.'}
            </p>

            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-indigo-100/70">
             <Link
  href={`/profile/${project.profiles?.id}`}
  className="inline-flex items-center gap-2 font-medium text-indigo-100/80 transition hover:text-white"
>
  <UserRound size={16} />
  {project.profiles?.full_name || 'Unknown owner'}
</Link>
              <span className="inline-flex items-center gap-2">
                <AtSign size={16} />
                {project.profiles?.username || '-'}
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={16} />
                {new Date(project.created_at).toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {(isOwner || isMember) && (
                <Link
                  href={`/projects/${project.id}/workspace`}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-950 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-indigo-50"
                >
                  <LayoutDashboard size={17} />
                  Enter workspace
                  <ArrowUpRight size={16} />
                </Link>
              )}
              <span className="rounded-xl border border-white/10 bg-white/10 px-3.5 py-2.5 text-xs text-indigo-100">
                <strong className="font-semibold text-white">
                  {(roles || []).length}
                </strong>{' '}
                roles ·{' '}
                <strong className="font-semibold text-white">
                  {totalOpenings}
                </strong>{' '}
                openings ·{' '}
                <strong className="font-semibold text-white">
                  {members.length}
                </strong>{' '}
                members
              </span>
            </div>
          </div>
        </section>

        <div className="mt-8 space-y-8">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <SectionHeading
              eyebrow="Build the team"
              title="Roles needed"
              description="Explore the skills and positions this project is looking for."
              count={`${(roles || []).length} ${
                (roles || []).length === 1 ? 'role' : 'roles'
              }`}
            />

            {!roles || roles.length === 0 ? (
              <EmptyPanel
                icon={BriefcaseBusiness}
                title="No roles added yet"
                description="Roles will appear here once they are defined."
              />
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {roles.map((role) => {
                  const request = getRequestForRole(role.id)
                  const isFilled = Number(role.quantity_needed) === 0

                  return (
                    <article
                      key={role.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 transition hover:border-indigo-200 hover:bg-white hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                            <BriefcaseBusiness size={19} />
                          </span>
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {role.role_title}
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {role.skills?.category || 'Project role'}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isFilled
                              ? 'bg-slate-200 text-slate-600'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isFilled
                            ? 'Filled'
                            : `${role.quantity_needed} needed`}
                        </span>
                      </div>

                      <p className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                        <Sparkles size={15} className="text-indigo-500" />
                        {role.skills?.name || 'No specific skill'}
                      </p>

                      {isOwner && (
                        <RoleActions role={role} skills={skills || []} />
                      )}

                      {!isOwner && request?.status === 'pending' && (
                        <RequestBadge
                          className="bg-amber-100 text-amber-700"
                          icon={Clock3}
                          text="Request pending"
                        />
                      )}
                      {!isOwner && request?.status === 'accepted' && (
                        <RequestBadge
                          className="bg-emerald-100 text-emerald-700"
                          icon={CircleCheck}
                          text="Request accepted"
                        />
                      )}
                      {!isOwner && request?.status === 'rejected' && (
                        <RequestBadge
                          className="bg-red-100 text-red-700"
                          text="Request rejected"
                        />
                      )}
                      {!isOwner && request?.status === 'left' && (
                        <RequestBadge
                          className="bg-slate-200 text-slate-600"
                          text="You left this role"
                        />
                      )}
                      {!isOwner && request?.status === 'removed' && (
                        <RequestBadge
                          className="bg-red-100 text-red-700"
                          text="You were removed from this role"
                        />
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
                    </article>
                  )
                })}
              </div>
            )}

            {isOwner && (
              <AddRoleForm projectId={project.id} skills={skills || []} />
            )}
          </section>

          {isOwner && (
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <SectionHeading
                eyebrow="Applications"
                title="Join requests"
                description="Review people interested in joining your project."
                count={
                  pendingRequestCount > 0
                    ? `${pendingRequestCount} pending`
                    : null
                }
              />

              {joinRequests.length === 0 ? (
                <EmptyPanel icon={Inbox} title="No join requests yet" />
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {joinRequests.map((request) => (
                    <article
                      key={request.id}
                      className="rounded-2xl border border-slate-200 p-5"
                    >
                 <div className="flex items-start gap-3">
  <Link
    href={`/profile/${request.profiles?.id}`}
    title="View applicant profile"
    className="shrink-0"
  >
    <Avatar
      name={request.profiles?.full_name}
      avatarUrl={request.profiles?.avatar_url}
    />
  </Link>

  <div className="min-w-0">
    <Link
      href={`/profile/${request.profiles?.id}`}
      className="font-semibold text-slate-900 transition hover:text-indigo-600 hover:underline"
    >
      {request.profiles?.full_name || 'Unknown user'}
    </Link>

    <p className="text-xs text-slate-500">
      @{request.profiles?.username || '-'}
    </p>
  </div>

  <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">
    {request.status}
  </span>
</div>

                      <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
                        <p className="font-medium text-slate-700">
                          {request.project_roles?.role_title || '-'}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <Sparkles size={12} />
                          {request.project_roles?.skills?.name ||
                            'No specific skill'}
                        </p>
                      </div>

                      <p className="mt-4 flex gap-2 text-sm leading-6 text-slate-600">
                        <MessageSquareText
                          size={16}
                          className="mt-1 shrink-0 text-slate-400"
                        />
                        {request.message || 'No message provided.'}
                      </p>
<div className="mt-4 flex flex-wrap items-center gap-2">
  <Link
    href={`/profile/${request.profiles?.id}`}
    className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100"
  >
    <UserRound size={14} />
    View profile
    <ArrowUpRight size={13} />
  </Link>

  {request.status === 'pending' && (
    <JoinRequestActions requestId={request.id} />
  )}
</div>
                      {/* {request.status === 'pending' && (
                        <JoinRequestActions requestId={request.id} />
                      )} */}
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {(isOwner || isMember) && (
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <SectionHeading
                eyebrow="The team"
                title="Project members"
                description="The people currently collaborating on this project."
                count={`${members.length} ${
                  members.length === 1 ? 'member' : 'members'
                }`}
              />

              {members.length === 0 ? (
                <EmptyPanel icon={UsersRound} title="No members yet" />
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {members.map((member) => (
                    <article
                      key={member.id}
                      className="rounded-2xl border border-slate-200 p-5"
                    >
                  <div className="flex items-center gap-3">
  <Link
    href={`/profile/${member.profiles?.id}`}
    className="shrink-0"
    title="View member profile"
  >
    <Avatar
      name={member.profiles?.full_name}
      avatarUrl={member.profiles?.avatar_url}
    />
  </Link>

  <div className="min-w-0">
    <Link
      href={`/profile/${member.profiles?.id}`}
      className="block truncate font-semibold text-slate-900 transition hover:text-indigo-600 hover:underline"
    >
      {member.profiles?.full_name || 'Unknown member'}
    </Link>

    <p className="truncate text-xs text-slate-500">
      @{member.profiles?.username || '-'}
    </p>
  </div>
</div>

                      <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                        <p className="flex items-center gap-2">
                          <BriefcaseBusiness size={14} />
                          <span className="font-medium text-slate-700">
                            {member.role_in_project}
                          </span>
                        </p>
                        <p className="flex items-center gap-2">
                          <CalendarDays size={14} />
                          Joined{' '}
                          {new Date(member.joined_at).toLocaleDateString()}
                        </p>
                      </div>
<div className="mt-4 flex flex-wrap items-center gap-2">
  <Link
    href={`/profile/${member.profiles?.id}`}
    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
  >
    <UserRound size={13} />
    View profile
  </Link>
</div>
                      <MemberActions
                        memberId={member.id}
                        isOwner={isOwner}
                        isCurrentUser={user?.id === member.user_id}
                      />
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  )
}

function SectionHeading({ eyebrow, title, description, count }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold tracking-widest text-indigo-600 uppercase">
          {eyebrow}
        </p>
        <h2 className="mt-1.5 text-2xl font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {count && (
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
          {count}
        </span>
      )}
    </div>
  )
}

function EmptyPanel({ icon: Icon, title, description }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
      <Icon size={26} className="mx-auto text-slate-400" />
      <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      )}
    </div>
  )
}

function Avatar({ name, avatarUrl }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 font-semibold text-indigo-700">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name || 'Profile avatar'}
          className="h-full w-full object-cover"
        />
      ) : (
        (name || '?').charAt(0).toUpperCase()
      )}
    </span>
  )
}

function RequestBadge({ className, icon: Icon, text }) {
  return (
    <p
      className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${className}`}
    >
      {Icon && <Icon size={13} />}
      {text}
    </p>
  )
}
