'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ReviewScreenClient({ initialSkills }) {
  const router = useRouter()
  const [skills, setSkills] = useState(initialSkills)
  const [newSkillName, setNewSkillName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleUpdateProficiency = async (id, level) => {
    // Optimistic UI update
    setSkills(prev => prev.map(s => s.id === id ? { ...s, proficiency_level: level } : s))
    
    try {
      await fetch('/api/user-skills', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, proficiency_level: level })
      })
    } catch (err) {
      console.error('Failed to update proficiency', err)
    }
  }

  const handleDelete = async (id) => {
    // Optimistic UI update
    setSkills(prev => prev.filter(s => s.id !== id))
    
    try {
      await fetch(`/api/user-skills?id=${id}`, { method: 'DELETE' })
    } catch (err) {
      console.error('Failed to delete skill', err)
    }
  }

  const handleAddSkill = async (e) => {
    e.preventDefault()
    if (!newSkillName.trim()) return

    setIsAdding(true)
    try {
      const res = await fetch('/api/user-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillName: newSkillName, source: 'Manual' })
      })
      if (res.ok) {
        const { userSkill } = await res.json()
        setSkills(prev => [...prev, userSkill])
        setNewSkillName('')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to add skill')
      }
    } catch (err) {
      console.error('Add skill error', err)
    } finally {
      setIsAdding(false)
    }
  }

  const handleContinue = () => {
    setIsSaving(true)
    router.push('/profile')
    router.refresh()
  }

  const groupedSkills = skills.reduce((acc, us) => {
    const cat = us.skills?.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(us)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {Object.keys(groupedSkills).length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500">No skills found. Please add some manually.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSkills).map(([category, categorySkills]) => (
            <div key={category} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">{category}</h2>
              <div className="space-y-3">
                {categorySkills.map(us => (
                  <div key={us.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4 transition-colors hover:bg-slate-100/50">
                    <div>
                      <div className="font-semibold text-slate-900">{us.skills?.name}</div>
                      <div className="text-xs text-slate-500 mt-1">Source: {us.source}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(level => (
                          <button
                            key={level}
                            onClick={() => handleUpdateProficiency(us.id, level)}
                            className={`h-8 w-8 rounded-md text-xs font-medium transition-colors ${
                              us.proficiency_level >= level
                                ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                : 'bg-white text-slate-400 border border-slate-200 hover:border-indigo-300 hover:text-indigo-500'
                            }`}
                            title={`Level ${level}`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                      <button 
                        onClick={() => handleDelete(us.id)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        aria-label="Delete skill"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Skill Form */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-bold text-slate-900">Add Missing Skill</h2>
        <form onSubmit={handleAddSkill} className="flex gap-3">
          <input
            type="text"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            placeholder="e.g. React, Python, Project Management"
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            disabled={isAdding}
          />
          <button
            type="submit"
            disabled={!newSkillName.trim() || isAdding}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {isAdding ? 'Adding...' : 'Add Skill'}
          </button>
        </form>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleContinue}
          disabled={isSaving}
          className="rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save & Continue'}
        </button>
      </div>
    </div>
  )
}
