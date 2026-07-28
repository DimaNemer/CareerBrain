'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  'Technical Skills',
  'Soft Skills',
  'Communication Skills',
  'Language Skills',
  'Leadership & Management',
  'Tools & Software',
  'Domain Knowledge',
  'Other relevant professional skills',
]

export default function AddSkillButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [skillName, setSkillName] = useState('')
  const [category, setCategory] = useState('Technical Skills')
  const [proficiency, setProficiency] = useState(3)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const proficiencyLabels = {
    1: 'Beginner',
    2: 'Elementary',
    3: 'Intermediate',
    4: 'Advanced',
    5: 'Expert',
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!skillName.trim()) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/user-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillName: skillName.trim(),
          category,
          proficiency_level: proficiency,
          source: 'Manual',
        }),
      })

      if (res.ok) {
        setSkillName('')
        setCategory('Technical Skills')
        setProficiency(3)
        setOpen(false)
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to add skill')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          color: '#5B4FE8',
          background: 'none',
          border: 'none',
          padding: 0,
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          textDecoration: 'none',
        }}
      >
        + Add skill
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
            }}
          />

          <div
            style={{
              position: 'relative',
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '28px',
              width: '420px',
              maxWidth: '90vw',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <h3
              style={{
                margin: '0 0 20px',
                fontSize: '16px',
                fontWeight: 700,
                color: '#111827',
              }}
            >
              Add Skill
            </h3>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '5px',
                  }}
                >
                  Skill name
                </label>
                <input
                  type="text"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="e.g. React, Python, Project Management"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1.5px solid #D1D5DB',
                    borderRadius: '9px',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#5B4FE8')}
                  onBlur={(e) => (e.target.style.borderColor = '#D1D5DB')}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '5px',
                  }}
                >
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1.5px solid #D1D5DB',
                    borderRadius: '9px',
                    fontSize: '13px',
                    background: '#FFFFFF',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '5px',
                  }}
                >
                  Proficiency
                </label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setProficiency(level)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        border: proficiency === level ? '2px solid #5B4FE8' : '1.5px solid #D1D5DB',
                        background: proficiency === level ? '#EEF2FF' : '#FFFFFF',
                        color: proficiency === level ? '#3730A3' : '#6B7280',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {level}
                    </button>
                  ))}
                  <span
                    style={{
                      marginLeft: '6px',
                      fontSize: '12px',
                      color: '#6B7280',
                      fontWeight: 500,
                    }}
                  >
                    {proficiencyLabels[proficiency]}
                  </span>
                </div>
              </div>

              {error && (
                <div
                  style={{
                    padding: '10px 12px',
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#DC2626',
                    marginBottom: '14px',
                  }}
                >
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{
                    padding: '9px 16px',
                    border: '1.5px solid #E5E7EB',
                    background: '#FFFFFF',
                    color: '#374151',
                    borderRadius: '9px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!skillName.trim() || loading}
                  style={{
                    padding: '9px 18px',
                    border: 'none',
                    background: '#5B4FE8',
                    color: '#FFFFFF',
                    borderRadius: '9px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: !skillName.trim() || loading ? 'not-allowed' : 'pointer',
                    opacity: !skillName.trim() || loading ? 0.5 : 1,
                  }}
                >
                  {loading ? 'Adding...' : 'Add Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
