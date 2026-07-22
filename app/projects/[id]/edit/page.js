import Link from 'next/link'
import { ArrowLeft, LockKeyhole, SearchX } from 'lucide-react'
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
      <PageMessage
        icon={LockKeyhole}
        title="Access denied"
        description="You must be logged in to edit a project."
        href="/login"
        linkLabel="Go to login"
      />
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
      <PageMessage
        icon={SearchX}
        title="Project not found"
        description="This project may no longer be available."
        href="/projects"
        linkLabel="Back to projects"
      />
    )
  }

  if (project.owner_id !== user.id) {
    return (
      <PageMessage
        icon={LockKeyhole}
        title="Access denied"
        description="Only the project owner can edit this project."
        href={`/projects/${project.id}`}
        linkLabel="Back to project"
      />
    )
  }

  return <EditProjectForm project={project} />
}

function PageMessage({ icon: Icon, title, description, href, linkLabel }) {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-20 text-center">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Icon size={27} />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
        <Link
          href={href}
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600"
        >
          <ArrowLeft size={16} />
          {linkLabel}
        </Link>
      </div>
    </main>
  )
}
