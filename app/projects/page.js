import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'

export default async function ProjectsPage() {
  const supabase = await createClient()

  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      *,
      profiles (
        id,
        username,
        full_name,
        avatar_url
      )
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className="p-10">
        <p className="text-red-600">{error.message}</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="mt-2 text-gray-600">
              Browse CollabSpace projects and join a team.
            </p>
          </div>

          <Link
            href="/projects/create"
            className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700"
          >
            Create Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800">
              No projects yet
            </h2>
            <p className="mt-2 text-gray-500">
              Be the first to create a project.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {projects.map((project) => (
              <div
                key={project.id}
                className="rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {project.title}
                  </h2>

                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                    {project.status}
                  </span>
                </div>

                <p className="mt-4 line-clamp-3 text-gray-600">
                  {project.description || 'No description provided.'}
                </p>

                <div className="mt-6">
                  <Link
                    href={`/projects/${project.id}`}
                    className="inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}