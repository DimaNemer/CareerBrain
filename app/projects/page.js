import Link from 'next/link'
import { ArrowRight, FolderKanban, Plus, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase-server'
import ProjectBrowser from './project-browser'

export default async function ProjectsPage() {
  const supabase = await createClient()

  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      id,
      title,
      description,
      status,
      created_at,
      project_roles (
        role_title,
        skills (
          id,
          name
        )
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

  const sortedProjects = [...projects].sort((a, b) => {
    const aIsOpen = a.status === 'open'
    const bIsOpen = b.status === 'open'

    if (aIsOpen !== bIsOpen) {
      return aIsOpen ? -1 : 1
    }

    return new Date(b.created_at) - new Date(a.created_at)
  })
  const openProjectCount = projects.filter(
    (project) => project.status === 'open'
  ).length

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 px-6 py-8 text-white shadow-xl shadow-indigo-950/10 sm:px-10 sm:py-10">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-indigo-100 uppercase backdrop-blur">
                <Sparkles size={14} />
                CollabSpace
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Build something meaningful, together.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100/80 sm:text-base">
                Discover projects that match your skills, find the right role,
                and join a team ready to create.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-indigo-50">
                  <strong className="font-semibold text-white">
                    {projects.length}
                  </strong>{' '}
                  total projects
                </span>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-emerald-100">
                  <strong className="font-semibold text-white">
                    {openProjectCount}
                  </strong>{' '}
                  open to join
                </span>
              </div>
            </div>

            <Link
              href="/projects/create"
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-950 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-indigo-50"
            >
              <Plus size={18} />
              Create Project
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {sortedProjects.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <FolderKanban size={28} />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-900">
              No projects yet
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Be the first to create a project.
            </p>
            <Link
              href="/projects/create"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              <Plus size={17} />
              Create Project
            </Link>
          </div>
        ) : (
          <ProjectBrowser projects={sortedProjects} />
        )}
      </div>
    </main>
  )
}
