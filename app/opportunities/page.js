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
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: theme?.text?.primary || '#111827', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
            Opportunities
          </h1>
          <p style={{ fontSize: '16px', color: theme?.text?.secondary || '#4b5563', margin: 0 }}>
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

      <div style={{ display: 'flex', gap: '16px', background: theme?.bg?.hover || '#f9fafb', padding: '20px', borderRadius: '14px', marginBottom: '24px', flexWrap: 'wrap', border: `1px solid ${theme?.border?.light || '#e5e7eb'}` }}>
        <div ref={dropdownRef} style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 250px', position: 'relative' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: theme?.text?.secondary || '#4b5563' }}>Location</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', zIndex: 2 }}>📍</span>
            <input 
              type="text"
              placeholder="Type to filter location (e.g., Remote, USA)..."
              value={locationInput}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => { setLocationInput(e.target.value); setIsOpen(true); }}
              style={{ width: '100%', padding: '12px 12px 12px 38px', borderRadius: '8px', border: `1px solid ${theme?.border?.light || '#e5e7eb'}`, background: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
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
          <label style={{ fontSize: '12px', fontWeight: 600, color: theme?.text?.secondary || '#4b5563' }}>Job Type</label>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${theme?.border?.light || '#e5e7eb'}`, background: '#fff', fontSize: '14px', outline: 'none', width: '100%' }}>
            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {loading && <p style={{ color: theme?.text?.secondary || '#4b5563' }}>Loading opportunities...</p>}
      {error && <div style={{ background: theme?.bg?.redSoft || '#fef2f2', border: `1px solid ${theme?.border?.light || '#e5e7eb'}`, borderRadius: '12px', padding: '16px', color: theme?.text?.red || '#ef4444', fontSize: '14px' }}>{error}</div>}

      {!loading && !error && filteredJobs.length === 0 && (
        <div style={{ background: theme?.bg?.hover || '#f9fafb', border: `1px dashed ${theme?.border?.medium || '#d1d5db'}`, borderRadius: '16px', padding: '32px', textAlign: 'center', color: theme?.text?.tertiary || '#9ca3af', fontSize: '14px' }}>No entries found. Try syncing latest rows!</div>
      )}

      {!loading && !error && filteredJobs.length > 0 && (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredJobs.map(opportunity => {
            if (!opportunity?.id) return null; // Safe guard against corrupt list objects

            const safeApplyUrl = getSafeUrl(opportunity.application_url)
            const targetDate = opportunity.posted_at || opportunity.created_at
            const daysAgoText = getDaysAgo(targetDate)
            const matchedSkills = Array.isArray(opportunity.opportunity_skills) ? opportunity.opportunity_skills : []

            return (
              <article key={opportunity.id} style={{ background: theme?.bg?.card || '#ffffff', border: `1px solid ${theme?.border?.light || '#e5e7eb'}`, borderRadius: '16px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: theme?.text?.primary || '#111827', margin: '0 0 4px' }}>{opportunity.title}</h2>
                    <p style={{ fontSize: '14px', color: theme?.text?.secondary || '#4b5563', margin: '0 0 4px' }}>
                      {opportunity.company || 'Unknown Company'}{opportunity.location ? ` · ${opportunity.location}` : ''}
                    </p>
                    
                    {daysAgoText && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginTop: '6px' }}>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 700, letterSpacing: '0.5px' }}>Posted</span>
                        <span style={{ fontSize: '14px', color: '#4b5563', fontWeight: 500 }}>{daysAgoText}</span>
                      </div>
                    )}
                  </div>
                  {opportunity.opportunity_type && (
                    <span style={{ background: theme?.bg?.emeraldSoft || '#ecfdf5', color: theme?.text?.emerald || '#059669', borderRadius: '999px', padding: '6px 10px', fontSize: '12px', fontWeight: 600 }}>{opportunity.opportunity_type}</span>
                  )}
                </div>

                {opportunity.description && <p style={{ fontSize: '14px', color: theme?.text?.secondary || '#4b5563', lineHeight: 1.6, margin: '0 0 16px' }}>{opportunity.description}</p>}

                {matchedSkills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px', paddingTop: '4px' }}>
                    {matchedSkills.map((link, idx) => {
                      if (!link) return null;
                      const skillName = link.skills?.name || 'Unknown Skill'
                      const isMandatory = !!link.is_mandatory;
                      const weight = link.importance_weight ?? 1;

                      return (
                        <span 
                          key={idx}
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: isMandatory ? '#fee2e2' : '#f3f4f6',
                            color: isMandatory ? '#ef4444' : '#4b5563',
                            border: isMandatory ? '1px solid #fca5a5' : '1px solid #e5e7eb',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {skillName}
                          <span style={{ fontSize: '10px', opacity: 0.8, fontWeight: 700, background: isMandatory ? '#fca5a5' : '#e5e7eb', padding: '1px 4px', borderRadius: '4px', color: '#1f2937' }}>
                            W:{weight}
                          </span>
                        </span>
                      )
                    })}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', paddingTop: '12px', borderTop: `1px solid ${theme?.border?.light || '#f3f4f6'}` }}>
                  {opportunity.source && <span style={{ fontSize: '12px', color: theme?.text?.tertiary || '#9ca3af', fontWeight: 500 }}>Source: {opportunity.source}</span>}
                  {safeApplyUrl && (
                    <a href={safeApplyUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: theme?.action?.primary || '#2563eb', color: theme?.action?.primaryText || '#ffffff', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>Apply Now</a>
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