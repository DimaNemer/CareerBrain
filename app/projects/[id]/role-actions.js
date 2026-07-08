'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Save, Trash2, X } from 'lucide-react'

export default function RoleActions({ role, skills }) {
  const router = useRouter()

  const [isEditing, setIsEditing] = useState(false)
  const [roleTitle, setRoleTitle] = useState(role.role_title || '')
  const [skillId, setSkillId] = useState(role.skill_id || '')
  const [quantityNeeded, setQuantityNeeded] = useState(role.quantity_needed ?? 1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleUpdate(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const response = await fetch(`/api/project-roles/${role.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role_title: roleTitle,
        skill_id: skillId || null,
        quantity_needed: quantityNeeded,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      setError(result.error || 'Failed to update role')
      setLoading(false)
      return
    }

    setIsEditing(false)
    setLoading(false)
    router.refresh()
  }

  async function handleDelete() {
    const confirmed = window.confirm('Are you sure you want to delete this role?')
    if (!confirmed) return

    setLoading(true)

    const response = await fetch(`/api/project-roles/${role.id}`, {
      method: 'DELETE',
    })

    const result = await response.json()

    if (!response.ok) {
      alert(result.error || 'Failed to delete role')
      setLoading(false)
      return
    }

    router.refresh()
  }

  if (isEditing) {
    return (
      <form
        onSubmit={handleUpdate}
        className="mt-4 space-y-3 rounded-xl border border-indigo-100 bg-white p-4"
      >
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <input
          type="text"
          value={roleTitle}
          onChange={(e) => setRoleTitle(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          required
        />

        <select
          value={skillId}
          onChange={(e) => setSkillId(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
        >
          <option value="">No specific skill</option>
          {skills.map((skill) => (
            <option key={skill.id} value={skill.id}>
              {skill.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          min="0"
          value={quantityNeeded}
          onChange={(e) => setQuantityNeeded(Number(e.target.value))}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          required
        />

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            <Save size={14} />
            {loading ? 'Saving...' : 'Save'}
          </button>

          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <X size={14} />
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="mt-4 flex gap-2 border-t border-slate-200 pt-4">
      <button
        onClick={() => setIsEditing(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
      >
        <Pencil size={13} />
        Edit
      </button>

      <button
        onClick={handleDelete}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
      >
        <Trash2 size={13} />
        {loading ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  )
}
