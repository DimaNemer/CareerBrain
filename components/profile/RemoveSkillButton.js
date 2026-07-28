'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RemoveSkillButton({ skillId, skillName }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const handleRemove = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/user-skills?id=${skillId}`, { method: 'DELETE' })
      if (res.ok) {
        setShowModal(false)
        router.refresh()
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setShowModal(true) }}
        title={`Remove ${skillName}`}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#9CA3AF',
          fontSize: '11px',
          padding: '2px 4px',
          borderRadius: '4px',
          lineHeight: 1,
          flexShrink: 0,
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => { e.target.style.color = '#EF4444' }}
        onMouseLeave={e => { e.target.style.color = '#9CA3AF' }}
      >
        ✕
      </button>

      {showModal && (
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
            onClick={() => setShowModal(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(4px)',
            }}
          />

          <div
            style={{
              position: 'relative',
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '32px',
              width: '380px',
              maxWidth: '90vw',
              boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#FEF2F2',
                border: '2px solid #FECACA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '24px',
              }}
            >
              🗑
            </div>

            <h3
              style={{
                margin: '0 0 8px',
                fontSize: '17px',
                fontWeight: 700,
                color: '#111827',
              }}
            >
              Remove Skill
            </h3>

            <p
              style={{
                margin: '0 0 24px',
                fontSize: '14px',
                color: '#6B7280',
                lineHeight: 1.5,
              }}
            >
              Are you sure you want to remove{' '}
              <strong style={{ color: '#111827' }}>{skillName}</strong>{' '}
              from your skills?
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  border: '1.5px solid #E5E7EB',
                  background: '#FFFFFF',
                  color: '#374151',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.target.style.background = '#F9FAFB' }}
                onMouseLeave={e => { e.target.style.background = '#FFFFFF' }}
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  background: loading ? '#FCA5A5' : '#EF4444',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: '14px',
                      height: '14px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#FFFFFF',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite',
                      display: 'inline-block',
                    }} />
                    Removing...
                  </>
                ) : (
                  'Remove'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}
