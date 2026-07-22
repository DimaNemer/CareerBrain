'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Lightbulb,
  Sparkles,
} from 'lucide-react'

export default function CreateProjectPage() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('open')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description,
        status,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      setError(result.error || 'Failed to create project')
      setLoading(false)
      return
    }

    router.push('/projects')
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/projects"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600"
        >
          <ArrowLeft size={17} />
          Back to projects
        </Link>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
          <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
            <aside className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 p-8 text-white sm:p-10">
              <div className="absolute -right-20 -top-16 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
              <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-indigo-100 uppercase">
                  <Sparkles size={14} />
                  New project
                </span>
                <h1 className="mt-6 text-3xl font-bold tracking-tight">
                  Turn your idea into a team effort.
                </h1>
                <p className="mt-3 text-sm leading-6 text-indigo-100/75">
                  Share the vision first. You can add the roles and skills your
                  project needs immediately after creating it.
                </p>

                <div className="mt-10 space-y-5">
                  {[
                    {
                      icon: Lightbulb,
                      title: 'Describe the vision',
                      text: 'Give collaborators a clear reason to join.',
                    },
                    {
                      icon: BriefcaseBusiness,
                      title: 'Add the roles',
                      text: 'Define who and what your project needs.',
                    },
                    {
                      icon: CheckCircle2,
                      title: 'Start collaborating',
                      text: 'Review requests and build your team.',
                    },
                  ].map(({ icon: Icon, title: stepTitle, text }) => (
                    <div key={stepTitle} className="flex gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-indigo-100">
                        <Icon size={17} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{stepTitle}</p>
                        <p className="mt-0.5 text-xs leading-5 text-indigo-100/65">
                          {text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <section className="p-6 sm:p-10">
              <div className="mb-7">
                <p className="text-xs font-semibold tracking-widest text-indigo-600 uppercase">
                  Project details
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  Create your project
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Start with the essentials. You can edit these details later.
                </p>
              </div>

              {error && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Project title
                  </label>
                  <div className="relative">
                    <BriefcaseBusiness
                      size={18}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Example: AI Career Platform"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Description
                  </label>
                  <div className="relative">
                    <FileText
                      size={18}
                      className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400"
                    />
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What are you building, why does it matter, and what would success look like?"
                      rows="6"
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Initial status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="open">Open</option>
                    <option value="active">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                  <p className="mt-1.5 text-xs text-slate-400">
                    Choose Open if you are currently looking for collaborators.
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <Link
                    href="/projects"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Creating...' : 'Create Project'}
                    {!loading && <ArrowRight size={17} />}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
