import { createClient } from '@/lib/supabase-server'
import EditProjectForm from './project-edit-form'

export default async function EditProjectPage({ params }) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="p-10">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-2 text-gray-600">You must be logged in to edit a project.</p>
      </main>
    )
  }

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !project) {
    return (
      <main className="p-10">
        <p className="text-red-600">Project not found.</p>
      </main>
    )
  }

  if (project.owner_id !== user.id) {
    return (
      <main className="p-10">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-2 text-gray-600">
          Only the project owner can edit this project.
        </p>
      </main>
    )
  }

  return <EditProjectForm project={project} />
}