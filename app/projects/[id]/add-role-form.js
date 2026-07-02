'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
    <div className="mt-8 rounded-xl border bg-gray-50 p-5">
      <h2 className="text-xl font-bold text-gray-900">Add Role</h2>

      <p className="mt-1 text-sm text-gray-600">
        Define a role needed for this project.
      </p>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Role Title
          </label>
          <input
            type="text"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            placeholder="Example: Backend Developer"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Skill
          </label>
          <select
            value={skillId}
            onChange={(e) => setSkillId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
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
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Quantity Needed
          </label>
          <input
            type="number"
            min="0"
            value={quantityNeeded}
            onChange={(e) => setQuantityNeeded(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Adding...' : 'Add Role'}
        </button>
      </form>
    </div>
  )
}