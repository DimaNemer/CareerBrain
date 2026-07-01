import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import DeleteProjectButton from './delete-project-button'
import AddRoleForm from './add-role-form'
import RoleActions from './role-actions'

export default async function ProjectDetailsPage({ params }) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      profiles (
        full_name,
        username
      )
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !project) {
    return (
      <main className="p-10">
        <h1 className="text-2xl font-bold text-red-600">Project not found</h1>
      </main>
    )
  }

  const { data: roles } = await supabase
    .from('project_roles')
    .select(`
      *,
      skills (
        id,
        name,
        category
      )
    `)
    .eq('project_id', id)
    .order('role_title', { ascending: true })

  const { data: skills } = await supabase
    .from('skills')
    .select('id, name, category')
    .order('name', { ascending: true })

  const isOwner = user?.id === project.owner_id

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
          <p>
            <strong>Status:</strong> {project.status}
          </p>

          <p>
            <strong>Owner:</strong> {project.profiles.full_name}
          </p>

          <p>
            <strong>Username:</strong> {project.profiles.username}
          </p>

          <p>
            <strong>Created:</strong>{' '}
            {new Date(project.created_at).toLocaleString()}
          </p>
        </div>

        <section className="mt-10 border-t pt-8">
          <h2 className="text-2xl font-bold text-gray-900">Roles Needed</h2>

          {!roles || roles.length === 0 ? (
            <p className="mt-3 text-gray-600">No roles added yet.</p>
          ) : (
            <div className="mt-5 space-y-4">
              {roles.map((role) => (
                <div key={role.id} className="rounded-xl border bg-gray-50 p-4">
                  <h3 className="font-semibold text-gray-900">
                    {role.role_title}
                  </h3>

                  <p className="mt-1 text-sm text-gray-600">
                    Skill: {role.skills?.name || 'No specific skill'}
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    Quantity needed: {role.quantity_needed}
                  </p>

                  {isOwner && <RoleActions role={role} skills={skills || []} />}
                </div>
              ))}
            </div>
          )}

          {isOwner && <AddRoleForm projectId={project.id} skills={skills || []} />}
        </section>
      </div>
    </main>
  )
}