"use client"

import { useEffect, useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Toaster, toast } from 'sonner'
import { Heart, MapPin, Clock, Search, AlertTriangle, ArrowRight, RefreshCw, X, Briefcase, Target, BookmarkCheck } from 'lucide-react'

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
  } catch {
    return null
  }
}

function getScoreStyles(score) {
  const percentage = Math.round(score * 100)
  if (percentage >= 80) return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', label: 'Excellent Fit', bar: 'bg-emerald-500' }
  if (percentage >= 50) return { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200', label: 'Good Match', bar: 'bg-orange-500' }
  return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', label: 'Potential Fit', bar: 'bg-gray-400' }
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)

  const [locationInput, setLocationInput] = useState('')
  const [debouncedLocation, setDebouncedLocation] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedType, setSelectedType] = useState('All')
  const [keywordInput, setKeywordInput] = useState('')
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'trends' | 'remote'
  const [showSavedOnly, setShowSavedOnly] = useState(false)

  const [savedJobIds, setSavedJobIds] = useState(new Set())

  const dropdownRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLocation(locationInput)
    }, 200)
    return () => clearTimeout(timer)
  }, [locationInput])

  const filteredJobs = useMemo(() => {
    let result = opportunities
    if (debouncedLocation.trim() !== '') {
      const searchTerms = debouncedLocation.toLowerCase().trim()
      result = result.filter(job => job.location?.toLowerCase().includes(searchTerms))
    }
    if (selectedType !== 'All') {
      result = result.filter(job => job.opportunity_type === selectedType)
    }
    if (keywordInput.trim() !== '') {
      const searchTerms = keywordInput.toLowerCase().trim()
      result = result.filter(job =>
        job.title?.toLowerCase().includes(searchTerms) ||
        job.description?.toLowerCase().includes(searchTerms)
      )
    }
    if (showSavedOnly) {
      result = result.filter(job => savedJobIds.has(job.id))
    }
    if (activeTab === 'trends') {
      result = result.filter(job => job.source === 'Adzuna')
    }
    if (activeTab === 'remote') {
      result = result.filter(job => job.source === 'Remotive')
    }
    const uniqueJobsMap = new Map()
    result.forEach(job => {
      if (job?.id && !uniqueJobsMap.has(job.id)) {
        uniqueJobsMap.set(job.id, job)
      }
    })
    return Array.from(uniqueJobsMap.values())
  }, [debouncedLocation, selectedType, keywordInput, opportunities, showSavedOnly, activeTab, savedJobIds])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/opportunities')
        if (res.status === 401) {
          router.push('/login')
          return
        }
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load opportunities')
        setOpportunities(data.opportunities || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    async function loadSaved() {
      try {
        const res = await fetch('/api/opportunities/saved')
        if (res.ok) {
          const data = await res.json()
          const idSet = new Set((data.opportunities || []).map(job => job.id))
          setSavedJobIds(idSet)
        }
      } catch (err) {
        console.error('Failed loading bookmark badges:', err)
      }
    }

    load()
    loadSaved()

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [router])

  const toggleBookmark = async (jobId) => {
    const isCurrentlySaved = savedJobIds.has(jobId)

    setSavedJobIds(prev => {
      const fresh = new Set(prev)
      if (isCurrentlySaved) fresh.delete(jobId)
      else fresh.add(jobId)
      return fresh
    })

    try {
      if (isCurrentlySaved) {
        const res = await fetch(`/api/opportunities/saved?opportunity_id=${jobId}`, { method: 'DELETE' })
        if (!res.ok) throw new Error()
        toast.success('Removed from saved jobs')
      } else {
        const res = await fetch('/api/opportunities/saved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ opportunity_id: jobId })
        })
        if (!res.ok) throw new Error()
        toast.success('Job saved successfully')
      }
    } catch {
      setSavedJobIds(prev => {
        const fallback = new Set(prev)
        if (isCurrentlySaved) fallback.add(jobId)
        else fallback.delete(jobId)
        return fallback
      })
      toast.error('Failed to sync bookmark. Please try again.')
    }
  }

  const dynamicUniqueLocations = Array.from(
    new Set(opportunities.map(j => j.location?.trim()).filter(Boolean))
  ).sort()

  const uniqueTypes = ['All', ...new Set(opportunities.map(j => j.opportunity_type).filter(Boolean))]
  const suggestedLocations = dynamicUniqueLocations.filter(loc =>
    loc.toLowerCase().includes(locationInput.toLowerCase())
  )

  const syncApi = async (endpoint, label) => {
    if (syncing) return
    setSyncing(true)
    try {
      await fetch('/api/opportunities/sync/embed', { method: 'POST' })
      const res = await fetch(endpoint, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Synchronization failed')
      await fetch('/api/match', { method: 'POST' })
      toast.success(`${label} synchronized successfully!`)
      const refreshRes = await fetch('/api/opportunities')
      if (refreshRes.ok) {
        const d = await refreshRes.json()
        setOpportunities(d.opportunities || [])
      }
    } catch (err) {
      toast.error(`Sync Error: ${err.message}`)
    } finally {
      setSyncing(false)
    }
  }

  const handleSync = async () => {
    await syncApi('/api/opportunities/sync', 'Adzuna jobs')
  }

  const handleSyncRemotive = async () => {
    await syncApi('/api/opportunities/sync/remotive', 'Remotive jobs')
  }

  const handleSyncAll = async () => {
    if (syncing) return
    setSyncing(true)
    try {
      await fetch('/api/opportunities/sync/embed', { method: 'POST' })
      await Promise.all([
        fetch('/api/opportunities/sync', { method: 'POST' }),
        fetch('/api/opportunities/sync/remotive', { method: 'POST' }),
      ])
      await fetch('/api/match', { method: 'POST' })
      toast.success('All job sources synchronized successfully!')
      const refreshRes = await fetch('/api/opportunities')
      if (refreshRes.ok) {
        const d = await refreshRes.json()
        setOpportunities(d.opportunities || [])
      }
    } catch (err) {
      toast.error(`Sync Error: ${err.message}`)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      <main className="max-w-[1000px] mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Smart Dashboard
            </h1>
            <p className="text-base text-gray-500 mt-1">
              Personalized vector calculations comparing your tech skills directly with incoming openings.
            </p>
          </div>
          <button
            onClick={activeTab === 'all' ? handleSyncAll : activeTab === 'remote' ? handleSyncRemotive : handleSync}
            disabled={syncing}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white border-none cursor-pointer transition-all duration-200 ${
              syncing
                ? 'bg-gray-400 cursor-not-allowed'
                : activeTab === 'remote'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 active:scale-[0.98] shadow-md hover:shadow-lg'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] shadow-md hover:shadow-lg'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : activeTab === 'all' ? 'Sync All' : activeTab === 'remote' ? 'Sync Remote' : 'Sync Trends'}
          </button>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-200 mb-6">
          <div ref={dropdownRef} className="flex flex-col gap-1.5 relative">
            <label className="text-xs font-semibold text-gray-500 tracking-wide">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <input
                type="text"
                placeholder="Type location..."
                value={locationInput}
                onFocus={() => setIsOpen(true)}
                onChange={(e) => { setLocationInput(e.target.value); setIsOpen(true); }}
                className="w-full pl-10 pr-8 py-3 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 transition-all h-11"
              />
              {locationInput && (
                <button onClick={() => { setLocationInput(''); setIsOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 border-none bg-transparent text-gray-400 cursor-pointer hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {isOpen && suggestedLocations.length > 0 && (
              <ul className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl mt-1.5 max-h-56 overflow-y-auto list-none p-1.5 shadow-xl z-[999]">
                {suggestedLocations.map((loc) => (
                  <li key={loc} onClick={() => { setLocationInput(loc); setIsOpen(false); }} className="px-4 py-2.5 text-sm text-slate-700 cursor-pointer rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                    {loc}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 tracking-wide">
              <Briefcase className="w-3.5 h-3.5 inline mr-1.5" />
              Job Type
            </label>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full px-3 py-3 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 transition-all h-11 appearance-none cursor-pointer">
              {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 tracking-wide">Specialization / Role</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="e.g., AI, Engineering, Web..."
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                className="w-full pl-10 pr-8 py-3 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 transition-all h-11"
              />
              {keywordInput && (
                <button onClick={() => setKeywordInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 border-none bg-transparent text-gray-400 cursor-pointer hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <button
            onClick={() => { setActiveTab('all'); setShowSavedOnly(false) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'all' && !showSavedOnly
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Jobs
          </button>
          <button
            onClick={() => { setActiveTab('trends'); setShowSavedOnly(false) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'trends'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Job Search & Trends
          </button>
          <button
            onClick={() => { setActiveTab('remote'); setShowSavedOnly(false) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'remote'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Remote
          </button>
          <button
            onClick={() => setShowSavedOnly(!showSavedOnly)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              showSavedOnly
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Heart className={`w-4 h-4 ${showSavedOnly ? 'fill-white' : ''}`} />
            Saved ({savedJobIds.size})
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4 text-gray-400">
              <div className="w-10 h-10 border-[3px] border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
              <span className="text-sm">Loading matching opportunities...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-600 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {!loading && !error && filteredJobs.length === 0 && (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <Target className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-400 text-sm font-medium">
              No matches found. Clear filters or hit sync to compute updates!
            </p>
          </div>
        )}

        {!loading && !error && filteredJobs.length > 0 && (
          <div className="grid gap-5">
            {filteredJobs.map(opportunity => {
              if (!opportunity?.id) return null

              const safeApplyUrl = getSafeUrl(opportunity.application_url)
              const targetDate = opportunity.posted_at || opportunity.created_at
              const daysAgoText = getDaysAgo(targetDate)

              const opportunitySkills = Array.isArray(opportunity.opportunity_skills) ? opportunity.opportunity_skills : []
              const matchData = opportunity.match_results?.[0] || null
              const scoreMetrics = matchData ? getScoreStyles(matchData.match_score) : null
              const missingSkillsList = matchData?.missing_skills || []
              const matchPercent = matchData ? Math.round(matchData.match_score * 100) : 0

              return (
                <article key={opportunity.id} className="group bg-white border border-slate-200 rounded-2xl p-6 relative transition-all duration-300 hover:shadow-lg hover:border-indigo-200 hover:-translate-y-0.5">
                  <button
                    onClick={() => toggleBookmark(opportunity.id)}
                    className="absolute top-6 right-6 bg-transparent border-none cursor-pointer z-10 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    title={savedJobIds.has(opportunity.id) ? "Remove Bookmark" : "Save Job"}
                  >
                    <Heart className={`w-5 h-5 transition-all duration-200 ${
                      savedJobIds.has(opportunity.id)
                        ? 'fill-red-500 text-red-500 scale-110'
                        : 'text-slate-400 hover:text-red-400 hover:scale-110'
                    }`} />
                  </button>

                  <div className="flex justify-between gap-4 items-start mb-3.5 pr-10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap mb-1">
                        <h2 className="text-xl font-bold text-slate-900 truncate">{opportunity.title}</h2>
                        {scoreMetrics && (
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold ${scoreMetrics.bg} ${scoreMetrics.text} ${scoreMetrics.border} border shrink-0`}>
                            <Target className="w-3.5 h-3.5" />
                            {matchPercent}% Match
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 truncate">
                        {opportunity.company || 'Unknown Company'}{opportunity.location ? ` \u00B7 ${opportunity.location}` : ''}
                      </p>
                    </div>
                    {opportunity.opportunity_type && (
                      <span className="bg-emerald-50 text-emerald-700 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap shrink-0">{opportunity.opportunity_type}</span>
                    )}
                  </div>

                  {scoreMetrics && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                        <span className="font-medium">{scoreMetrics.label}</span>
                        <span className="font-bold">{matchPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${scoreMetrics.bar}`}
                          style={{ width: `${matchPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {opportunity.description && (
                    <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-3">{opportunity.description}</p>
                  )}

                  <div className="flex flex-col gap-3 mb-5">
                    {opportunitySkills.length > 0 && (
                      <div>
                        <span className="text-[11px] uppercase text-slate-400 font-bold tracking-wider block mb-1.5">Role Requirements</span>
                        <div className="flex flex-wrap gap-1.5">
                          {opportunitySkills.map((link) => {
                            if (!link?.skills) return null
                            return (
                              <span key={link.skills.id || link.skills.name} className="text-xs font-medium px-2 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 inline-flex items-center gap-1">
                                <BookmarkCheck className="w-3 h-3" />
                                {link.skills.name}
                                <span className="text-[10px] text-slate-400 ml-0.5">W:{link.importance_weight}</span>
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {missingSkillsList.length > 0 && (
                      <div className="bg-rose-50/80 p-3 rounded-xl border border-rose-100">
                        <span className="text-[11px] uppercase text-rose-600 font-bold tracking-wider block mb-1.5">Missing Skills to Study</span>
                        <div className="flex flex-wrap gap-1.5">
                          {missingSkillsList.map((gap) => (
                            <span key={gap.id} className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-white text-rose-500 border border-dashed border-amber-300 inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {gap.skills?.name || 'Required Skill'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center gap-3 flex-wrap pt-3 border-t border-slate-100">
                    <div className="flex gap-4 items-center">
                      {daysAgoText && (
                        <span className="text-sm text-slate-400 inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {daysAgoText}
                        </span>
                      )}
                      {matchData?.estimated_time_to_close && (
                        <span className="text-sm text-blue-600 font-medium inline-flex items-center gap-1.5">
                          <ArrowRight className="w-3.5 h-3.5" />
                          {matchData.estimated_time_to_close}
                        </span>
                      )}
                    </div>
                    {safeApplyUrl && (
                      <a href={safeApplyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold no-underline hover:bg-blue-700 active:scale-[0.97] transition-all duration-200 shadow-sm hover:shadow-md">
                        Apply Now
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
