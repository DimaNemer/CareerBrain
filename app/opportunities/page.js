"use client"

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { theme } from '@/constants/colors'

function getSafeUrl(url) {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString()
    }
  } catch {}
  return null
}

// 🕒 Smarter utility to accurately replicate the screenshot's exact relative styling
function getDaysAgo(dateString) {
  if (!dateString) return null
  try {
    const createdDate = new Date(dateString)
    const today = new Date()
    
    createdDate.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    
    const differenceInTime = today.getTime() - createdDate.getTime()
    const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24))
    
    if (differenceInDays < 0) return 'recently'
    if (differenceInDays === 0) return 'today'
    if (differenceInDays === 1) return 'yesterday'
    
    if (differenceInDays >= 30) {
      const mos = Math.floor(differenceInDays / 30)
      return `${mos}mo${mos > 1 ? 's' : ''} ago`
    }
    if (differenceInDays >= 7) {
      const wks = Math.floor(differenceInDays / 7)
      return `${wks}wk${wks > 1 ? 's' : ''} ago`
    }
    
    return `${differenceInDays} days ago`
  } catch (err) {
    return null
  }
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState([])
  const [filteredJobs, setFilteredJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)
  
  const [locationInput, setLocationInput] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedType, setSelectedType] = useState('All')

  const dropdownRef = useRef(null)
  const router = useRouter()

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/opportunities')
      if (res.status === 401) {
        router.push('/login')
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load opportunities')
      
      const jobs = data.opportunities || []
      setOpportunities(jobs)
      setFilteredJobs(jobs)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    let result = opportunities
    if (locationInput.trim() !== '') {
      const searchTerms = locationInput.toLowerCase().trim()
      result = result.filter(job => job.location?.toLowerCase().includes(searchTerms))
    }
    if (selectedType !== 'All') {
      result = result.filter(job => job.opportunity_type === selectedType)
    }
    setFilteredJobs(result)
  }, [locationInput, selectedType, opportunities])

  const dynamicUniqueLocations = Array.from(
    new Set(opportunities.map(j => j.location?.trim()).filter(Boolean))
  ).sort()

  const uniqueTypes = ['All', ...new Set(opportunities.map(j => j.opportunity_type).filter(Boolean))]
  const suggestedLocations = dynamicUniqueLocations.filter(loc => 
    loc.toLowerCase().includes(locationInput.toLowerCase())
  )

  const handleSync = async () => {
    if (syncing) return
    setSyncing(true)
    try {
      const res = await fetch('/api/opportunities/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Synchronization failed')
      alert(data.message || 'Data successfully synchronized!')
      await fetchJobs()
    } catch (err) {
      alert(`Sync Error: ${err.message}`)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px 24px', fontFamily: 'system-ui, sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: theme.text.primary, margin: '0 0 8px', letterSpacing: '-0.5px' }}>
            Opportunities
          </h1>
          <p style={{ fontSize: '16px', color: theme.text.secondary, margin: 0 }}>
            Browse live automated job postings matching your tech stacks.
          </p>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="sync-action-btn"
          style={{
            background: syncing ? 'linear-gradient(135deg, #9ca3af, #6b7280)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            cursor: syncing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ display: 'inline-block', animation: syncing ? 'spin 1s linear infinite' : 'none' }}>🔄</span>
          {syncing ? 'Syncing Live Feeds...' : 'Sync Latest Jobs'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px', background: theme.bg.hover, padding: '20px', borderRadius: '14px', marginBottom: '24px', flexWrap: 'wrap', border: `1px solid ${theme.border.light || '#e5e7eb'}` }}>
        <div ref={dropdownRef} style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 250px', position: 'relative' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: theme.text.secondary }}>Location</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', zIndex: 2 }}>📍</span>
            <input 
              type="text"
              placeholder="Type to filter location (e.g., Remote, USA)..."
              value={locationInput}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => { setLocationInput(e.target.value); setIsOpen(true); }}
              style={{ width: '100%', padding: '12px 12px 12px 38px', borderRadius: '8px', border: `1px solid ${theme.border.light || '#e5e7eb'}`, background: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
            {locationInput && (
              <button onClick={() => { setLocationInput(''); setIsOpen(false); }} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '14px' }}>✕</button>
            )}
          </div>

          {isOpen && suggestedLocations.length > 0 && (
            <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', marginTop: '4px', maxHeight: '220px', overflowY: 'auto', listStyle: 'none', padding: '6px 0', margin: 0, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', zIndex: 999 }}>
              {suggestedLocations.map((loc) => (
                <li key={loc} onClick={() => { setLocationInput(loc); setIsOpen(false); }} style={{ padding: '10px 16px', fontSize: '14px', color: '#1f2937', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>{loc}</li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '200px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: theme.text.secondary }}>Job Type</label>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border.light || '#e5e7eb'}`, background: '#fff', fontSize: '14px', outline: 'none', width: '100%' }}>
            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {loading && <p style={{ color: theme.text.secondary }}>Loading opportunities...</p>}
      {error && <div style={{ background: theme.bg.redSoft, border: `1px solid ${theme.border.light}`, borderRadius: '12px', padding: '16px', color: theme.text.red, fontSize: '14px' }}>{error}</div>}

      {!loading && !error && filteredJobs.length === 0 && (
        <div style={{ background: theme.bg.hover, border: `1px dashed ${theme.border.medium}`, borderRadius: '16px', padding: '32px', textAlign: 'center', color: theme.text.tertiary, fontSize: '14px' }}>No entries found. Try syncing latest rows!</div>
      )}

      {!loading && !error && filteredJobs.length > 0 && (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredJobs.map(opportunity => {
            const safeApplyUrl = getSafeUrl(opportunity.application_url)
            
            // Prioritizes original remote timestamp fallback over DB entry stamp
            const targetDate = opportunity.posted_at || opportunity.created_at
            const daysAgoText = getDaysAgo(targetDate)

            return (
              <article key={opportunity.id} style={{ background: theme.bg.card, border: `1px solid ${theme.border.light}`, borderRadius: '16px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: theme.text.primary, margin: '0 0 4px' }}>{opportunity.title}</h2>
                    <p style={{ fontSize: '14px', color: theme.text.secondary, margin: '0 0 4px' }}>
                      {opportunity.company || 'Unknown Company'}{opportunity.location ? ` · ${opportunity.location}` : ''}
                    </p>
                    
                    {/* ⏰ CLEAN SCREENSHOT-STYLE RELATIVE BADGE */}
                    {daysAgoText && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginTop: '6px' }}>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 700, letterSpacing: '0.5px' }}>Posted</span>
                        <span style={{ fontSize: '14px', color: '#4b5563', fontWeight: 500 }}>{daysAgoText}</span>
                      </div>
                    )}
                  </div>
                  {opportunity.opportunity_type && (
                    <span style={{ background: theme.bg.emeraldSoft, color: theme.text.emerald, borderRadius: '999px', padding: '6px 10px', fontSize: '12px', fontWeight: 600 }}>{opportunity.opportunity_type}</span>
                  )}
                </div>

                {opportunity.description && <p style={{ fontSize: '14px', color: theme.text.secondary, lineHeight: 1.6, margin: '0 0 16px' }}>{opportunity.description}</p>}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', paddingTop: '12px', borderTop: `1px solid ${theme.border.light || '#f3f4f6'}` }}>
                  {opportunity.source && <span style={{ fontSize: '12px', color: theme.text.tertiary, fontWeight: 500 }}>Source: {opportunity.source}</span>}
                  {safeApplyUrl && (
                    <a href={safeApplyUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: theme.action.primary, color: theme.action.primaryText, padding: '10px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>Apply Now</a>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}} />
    </main>
  )
}