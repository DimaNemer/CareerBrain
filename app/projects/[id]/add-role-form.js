'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Plus, UserPlus } from 'lucide-react'

export default function AddRoleForm({ projectId, skills }) {
  const router = useRouter()

  const [roleTitle, setRoleTitle] = useState('')
  const [skillId, setSkillId] = useState('')
  const [quantityNeeded, setQuantityNeeded] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const response = await fetch('/api/project-roles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project_id: projectId,
        role_title: roleTitle,
        skill_id: skillId || null,
        quantity_needed: quantityNeeded,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      setError(result.error || 'Failed to add role')
      setLoading(false)
      return
    }

    setRoleTitle('')
    setSkillId('')
    setQuantityNeeded(1)
    setLoading(false)

    router.refresh()
  }

  return (
    <div className="mt-7 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <UserPlus size={18} />
        </span>
        <div>
          <h2 className="font-bold text-slate-900">Add another role</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Define a position needed for this project.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-5 grid gap-4 md:grid-cols-2"
      >
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Role Title
          </label>
          <input
            type="text"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            placeholder="Example: Backend Developer"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Skill
          </label>
          <select
            value={skillId}
            onChange={(e) => setSkillId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          >
            <option value="">No specific skill</option>
            {skills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Quantity Needed
          </label>
          <input
            type="number"
            min="0"
            value={quantityNeeded}
            onChange={(e) => setQuantityNeeded(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            required
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
          >
            <Plus size={16} />
            {loading ? 'Adding...' : 'Add Role'}
          </button>
        </div>
      </form>
    </div>
  )
}
