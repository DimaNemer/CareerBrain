'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RoleActions({ role, skills }) {
  const router = useRouter()

  const [isEditing, setIsEditing] = useState(false)
  const [roleTitle, setRoleTitle] = useState(role.role_title || '')
  const [skillId, setSkillId] = useState(role.skill_id || '')
  const [quantityNeeded, setQuantityNeeded] = useState(role.quantity_needed || 1)
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
      <form onSubmit={handleUpdate} className="mt-4 space-y-3">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <input
          type="text"
          value={roleTitle}
          onChange={(e) => setRoleTitle(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
          required
        />

        <select
          value={skillId}
          onChange={(e) => setSkillId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
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
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
          required
        />

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>

          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="rounded-lg bg-gray-200 px-3 py-2 text-sm text-gray-800 hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="mt-4 flex gap-2">
      <button
        onClick={() => setIsEditing(true)}
        className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
      >
        Edit
      </button>

      <button
        onClick={handleDelete}
        disabled={loading}
        className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-60"
      >
        {loading ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  )
}