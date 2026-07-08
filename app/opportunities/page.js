"use client"

import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Toaster, toast } from 'sonner'
import { Heart, MapPin, Clock, Search, AlertTriangle, ArrowRight, RefreshCw, X, Briefcase, Target, BookmarkCheck, Sparkles, TrendingUp, Zap, ChevronRight, ChevronDown, ArrowUpDown, CheckCircle2 } from 'lucide-react'

function getSafeUrl(url) {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.toString()
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
    const diff = today.getTime() - createdDate.getTime()
    const days = Math.floor(diff / (1000 * 3600 * 24))
    if (days < 0) return 'recently'
    if (days === 0) return 'today'
    if (days === 1) return 'yesterday'
    if (days >= 30) return `${Math.floor(days / 30)}mo${Math.floor(days / 30) > 1 ? 's' : ''} ago`
    if (days >= 7) return `${Math.floor(days / 7)}wk${Math.floor(days / 7) > 1 ? 's' : ''} ago`
    return `${days} days ago`
  } catch { return null }
}

function ScoreRing({ percent, size = 48, strokeWidth = 4 }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference
  const color = percent >= 80 ? '#10b981' : percent >= 50 ? '#f97316' : '#9ca3af'
  const label = percent >= 80 ? 'Excellent' : percent >= 50 ? 'Good' : 'Potential'
  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Match score: ${percent} percent, ${label}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }} aria-hidden="true">{percent}%</span>
    </div>
  )
}

const tabs = [
  { id: 'all', label: 'All Jobs', icon: Briefcase },
  { id: 'trends', label: 'Trends', icon: TrendingUp },
  { id: 'remote', label: 'Remote', icon: Globe },
  { id: 'recommendations', label: 'Picks', icon: Sparkles },
]

function Globe() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  )
}

function readFiltersFromURL() {
  if (typeof window === 'undefined') return {}
  const p = new URLSearchParams(window.location.search)
  return {
    location: p.get('location') || '',
    type: p.get('type') || 'All',
    keyword: p.get('keyword') || '',
    tab: p.get('tab') || 'all',
    saved: p.get('saved') === 'true',
    sort: p.get('sort') || 'newest',
  }
}

export default function OpportunitiesPage() {
  const router = useRouter()

  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)
  const [locationInput, setLocationInput] = useState('')
  const [debouncedLocation, setDebouncedLocation] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedType, setSelectedType] = useState('All')
  const [keywordInput, setKeywordInput] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [showSavedOnly, setShowSavedOnly] = useState(false)
  const [savedJobIds, setSavedJobIds] = useState(new Set())
  const [appliedJobIds, setAppliedJobIds] = useState(new Set())
  const [recsTopPicks, setRecsTopPicks] = useState([])
  const [loadingRecs, setLoadingRecs] = useState(false)
  const [matching, setMatching] = useState(false)
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0 })
  const [offset, setOffset] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [sortBy, setSortBy] = useState('newest')
  const [showSortMenu, setShowSortMenu] = useState(false)

  const LIMIT = 50
  const dropdownRef = useRef(null)
  const tabRefs = useRef({})
  const sortRef = useRef(null)

  useEffect(() => {
    const f = readFiltersFromURL()
    if (f.location) setLocationInput(f.location)
    if (f.type) setSelectedType(f.type)
    if (f.keyword) setKeywordInput(f.keyword)
    if (f.tab) setActiveTab(f.tab)
    if (f.saved) setShowSavedOnly(true)
    if (f.sort) setSortBy(f.sort)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedLocation(locationInput), 200)
    return () => clearTimeout(timer)
  }, [locationInput])

  const syncURL = useCallback(() => {
    const p = new URLSearchParams()
    if (locationInput) p.set('location', locationInput)
    if (selectedType !== 'All') p.set('type', selectedType)
    if (keywordInput) p.set('keyword', keywordInput)
    if (activeTab !== 'all') p.set('tab', activeTab)
    if (showSavedOnly) p.set('saved', 'true')
    if (sortBy !== 'newest') p.set('sort', sortBy)
    const qs = p.toString()
    router.replace(`/opportunities${qs ? `?${qs}` : ''}`, { scroll: false })
  }, [locationInput, selectedType, keywordInput, activeTab, showSavedOnly, sortBy, router])

  useEffect(() => { syncURL() }, [syncURL])

  const filteredJobs = useMemo(() => {
    let result = opportunities
    if (debouncedLocation.trim()) result = result.filter(j => j.location?.toLowerCase().includes(debouncedLocation.toLowerCase().trim()))
    if (selectedType !== 'All') result = result.filter(j => j.opportunity_type === selectedType)
    if (keywordInput.trim()) {
      const kw = keywordInput.toLowerCase().trim()
      result = result.filter(j => j.title?.toLowerCase().includes(kw) || j.description?.toLowerCase().includes(kw))
    }
    if (showSavedOnly) result = result.filter(j => savedJobIds.has(j.id))
    if (activeTab === 'trends') result = result.filter(j => j.source === 'Adzuna')
    if (activeTab === 'remote') result = result.filter(j => j.source === 'Remotive')
    const map = new Map()
    result.forEach(j => { if (j?.id && !map.has(j.id)) map.set(j.id, j) })
    return Array.from(map.values())
  }, [debouncedLocation, selectedType, keywordInput, opportunities, showSavedOnly, activeTab, savedJobIds])

  const sortedJobs = useMemo(() => {
    const list = [...filteredJobs]
    switch (sortBy) {
      case 'newest': return list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      case 'oldest': return list.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
      case 'company': return list.sort((a, b) => (a.company || '').localeCompare(b.company || ''))
      case 'score': return list.sort((a, b) => {
        const sa = a.match_results?.[0]?.match_score || 0
        const sb = b.match_results?.[0]?.match_score || 0
        return sb - sa
      })
      default: return list
    }
  }, [filteredJobs, sortBy])

  const updateIndicator = useCallback((tabId) => {
    const el = tabRefs.current[tabId]
    if (el) {
      const parent = el.parentElement
      if (parent) {
        const parentRect = parent.getBoundingClientRect()
        const elRect = el.getBoundingClientRect()
        setTabIndicator({ left: elRect.left - parentRect.left, width: elRect.width })
      }
    }
  }, [])

  const fetchRecs = async () => {
    setLoadingRecs(true)
    try {
      const res = await fetch('/api/opportunities/recommendations?limit=5')
      if (res.status === 401) { router.push('/login'); return }
      const data = await res.json()
      if (res.ok) setRecsTopPicks(data.opportunities || [])
    } catch {} finally { setLoadingRecs(false) }
  }

  const refreshMatches = async () => {
    if (matching) return
    setMatching(true)
    try {
      const res = await fetch('/api/match', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Match refresh failed')
      toast.success('Match scores refreshed!')
      await fetchRecs()
    } catch (err) { toast.error(`Refresh Error: ${err.message}`) }
    finally { setMatching(false) }
  }

  const switchTab = (tab) => {
    setActiveTab(tab)
    setShowSavedOnly(false)
    if (tab === 'recommendations') fetchRecs()
    setTimeout(() => updateIndicator(tab), 50)
  }

  useEffect(() => {
    updateIndicator(activeTab)
  }, [activeTab, updateIndicator])

  const loadOpportunities = async (append = false) => {
    if (!append) { setLoading(true); setOffset(0) }
    else setLoadingMore(true)
    try {
      const currentOffset = append ? offset : 0
      const res = await fetch(`/api/opportunities?limit=${LIMIT}&offset=${currentOffset}&sort=${sortBy === 'company' ? 'company' : 'created_at'}&dir=${sortBy === 'oldest' ? 'asc' : 'desc'}`)
      if (res.status === 401) { router.push('/login'); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      if (append) {
        setOpportunities(prev => {
          const map = new Map()
          ;[...prev, ...(data.opportunities || [])].forEach(j => { if (j?.id) map.set(j.id, j) })
          return Array.from(map.values())
        })
        setOffset(currentOffset + LIMIT)
      } else {
        setOpportunities(data.opportunities || [])
        setOffset(LIMIT)
      }
      setTotalCount(data.count || data.opportunities?.length || 0)
    } catch (err) { setError(err.message) }
    finally { setLoading(false); setLoadingMore(false) }
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/opportunities?limit=${LIMIT}&offset=0&sort=${sortBy === 'company' ? 'company' : 'created_at'}&dir=${sortBy === 'oldest' ? 'asc' : 'desc'}`)
        if (res.status === 401) { router.push('/login'); return }
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load')
        setOpportunities(data.opportunities || [])
        setOffset(LIMIT)
        setTotalCount(data.count || data.opportunities?.length || 0)
      } catch (err) { setError(err.message) }
      finally { setLoading(false) }
    }
    async function loadSaved() {
      try {
        const res = await fetch('/api/opportunities/saved')
        if (res.ok) {
          const data = await res.json()
          setSavedJobIds(new Set((data.opportunities || []).map(j => j.id)))
        }
      } catch {}
    }
    async function loadApplied() {
      try {
        const res = await fetch('/api/opportunities/applied')
        if (res.ok) {
          const data = await res.json()
          setAppliedJobIds(new Set((data.applied || []).map(j => j.opportunity_id)))
        }
      } catch {}
    }
    load(); loadSaved(); loadApplied()
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false)
      if (sortRef.current && !sortRef.current.contains(e.target)) setShowSortMenu(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [router, sortBy])

  useEffect(() => { const t = setTimeout(() => updateIndicator(activeTab), 100); return () => clearTimeout(t) }, [opportunities])

  const toggleBookmark = async (jobId) => {
    const saved = savedJobIds.has(jobId)
    setSavedJobIds(prev => { const n = new Set(prev); saved ? n.delete(jobId) : n.add(jobId); return n })
    try {
      if (saved) {
        await fetch(`/api/opportunities/saved?opportunity_id=${jobId}`, { method: 'DELETE' })
        toast.success('Removed from saved')
      } else {
        await fetch('/api/opportunities/saved', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ opportunity_id: jobId }) })
        toast.success('Job saved')
      }
    } catch {
      setSavedJobIds(prev => { const n = new Set(prev); saved ? n.add(jobId) : n.delete(jobId); return n })
      toast.error('Failed to sync bookmark')
    }
  }

  const toggleApplied = async (jobId) => {
    const applied = appliedJobIds.has(jobId)
    setAppliedJobIds(prev => { const n = new Set(prev); applied ? n.delete(jobId) : n.add(jobId); return n })
    try {
      if (applied) {
        await fetch(`/api/opportunities/applied?opportunity_id=${jobId}`, { method: 'DELETE' })
      } else {
        await fetch('/api/opportunities/applied', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ opportunity_id: jobId }) })
      }
    } catch {
      setAppliedJobIds(prev => { const n = new Set(prev); applied ? n.add(jobId) : n.delete(jobId); return n })
    }
  }

  const handleApply = (e, jobId, url) => {
    e.stopPropagation()
    if (appliedJobIds.has(jobId)) {
      toggleApplied(jobId)
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
      toggleApplied(jobId)
    }
  }

  const dynamicUniqueLocations = Array.from(new Set(opportunities.map(j => j.location?.trim()).filter(Boolean))).sort()
  const uniqueTypes = ['All', ...new Set(opportunities.map(j => j.opportunity_type).filter(Boolean))]
  const suggestedLocations = dynamicUniqueLocations.filter(l => l.toLowerCase().includes(locationInput.toLowerCase()))
  const hasMore = offset < totalCount && opportunities.length < totalCount

  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'company', label: 'Company' },
    { value: 'score', label: 'Match Score' },
  ]

  const syncApi = async (endpoint, label) => {
    if (syncing) return
    setSyncing(true)
    try {
      await fetch('/api/opportunities/sync/embed', { method: 'POST' })
      const res = await fetch(endpoint, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Sync failed')
      await fetch('/api/match', { method: 'POST' })
      toast.success(data.message || `${label} synced!`)
      await loadOpportunities(false)
    } catch (err) { toast.error(`Sync Error: ${err.message}`) }
    finally { setSyncing(false) }
  }
  const handleSync = async () => syncApi('/api/opportunities/sync', 'Adzuna')
  const handleSyncRemotive = async () => syncApi('/api/opportunities/sync/remotive', 'Remotive')
  const handleSyncAll = async () => {
    if (syncing) return
    setSyncing(true)
    try {
      await fetch('/api/opportunities/sync/embed', { method: 'POST' })
      await Promise.all([fetch('/api/opportunities/sync', { method: 'POST' }), fetch('/api/opportunities/sync/remotive', { method: 'POST' })])
      await fetch('/api/match', { method: 'POST' })
      toast.success('All sources synced!')
      await loadOpportunities(false)
    } catch (err) { toast.error(`Sync Error: ${err.message}`) }
    finally { setSyncing(false) }
  }

  const syncLabel = syncing || matching ? 'Refreshing...' : activeTab === 'recommendations' ? 'Match' : activeTab === 'all' ? 'Sync' : activeTab === 'remote' ? 'Remote' : 'Trend'

  const renderJobCard = (opportunity, variant = 'default', index = 0) => {
    if (!opportunity?.id) return null
    const safeApplyUrl = getSafeUrl(opportunity.application_url)
    const targetDate = opportunity.posted_at || opportunity.created_at
    const daysAgoText = getDaysAgo(targetDate)
    const opportunitySkills = Array.isArray(opportunity.opportunity_skills) ? opportunity.opportunity_skills : []
    const matchData = opportunity.match_results?.[0] || null
    const score = matchData ? Math.round(matchData.match_score * 100) : 0
    const missingSkillsList = matchData?.missing_skills || []
    const isVariant = variant === 'violet'
    const accentBorder = isVariant ? 'hover:border-violet-300' : 'hover:border-indigo-300'
    const accentBtn = isVariant ? 'from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700' : 'from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700'

    return (
      <article
        key={opportunity.id}
        className={`group relative bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-3xl p-6 md:p-7 transition-all duration-500 ${accentBorder} hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1.5 hover:border-opacity-100 animate-fade-up cursor-pointer`}
        style={{ animationDelay: `${index * 80}ms` }}
        tabIndex={0}
        role="link"
        aria-label={`View details for ${opportunity.title} at ${opportunity.company || 'Unknown'}`}
        onClick={() => router.push(`/opportunities/${opportunity.id}`)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/opportunities/${opportunity.id}`) } }}
      >
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/50 to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex gap-4 md:gap-6 items-start mt-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1.5">
                <h2 className="text-xl font-bold text-slate-900 truncate tracking-tight">{opportunity.title}</h2>
                {matchData && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-50 to-orange-50 text-orange-700 border border-orange-200/60 shadow-sm">
                    <Zap className="w-3 h-3" />
                    {score}% Match
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-500 truncate flex items-center gap-1.5">
                {opportunity.company || 'Unknown'}
                {opportunity.source && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${opportunity.source === 'Adzuna' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {opportunity.source}
                  </span>
                )}
                {opportunity.location && <><span className="text-slate-300">·</span><MapPin className="w-3 h-3 inline" />{opportunity.location}</>}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
              <button onClick={(e) => { e.stopPropagation(); toggleBookmark(opportunity.id) }}
                className="bg-transparent border-none cursor-pointer p-1.5 rounded-xl hover:bg-slate-100/80 transition-all duration-300"
                title={savedJobIds.has(opportunity.id) ? "Unsave" : "Save"}
                aria-label={savedJobIds.has(opportunity.id) ? `Unsave ${opportunity.title}` : `Save ${opportunity.title}`}>
                <Heart className={`w-5 h-5 transition-all duration-300 ${savedJobIds.has(opportunity.id) ? 'fill-rose-500 text-rose-500 scale-110 drop-shadow-sm' : 'text-slate-400 hover:text-rose-400 hover:scale-110'}`} />
              </button>
              {matchData && <ScoreRing percent={score} size={52} strokeWidth={4} />}
            </div>
          </div>

          {opportunity.description && (
            <p className="text-sm text-slate-600 leading-relaxed mt-4 mb-4 line-clamp-2">{opportunity.description}</p>
          )}

          <div className="flex flex-col gap-3 mb-4">
            {opportunitySkills.length > 0 && (
              <div>
                <div className="flex flex-wrap gap-1.5">
                  {opportunitySkills.map((link) => {
                    if (!link?.skills) return null
                    return (
                      <span key={link.skills.id || link.skills.name}
                        className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-100/80 text-slate-600 border border-slate-200/60 inline-flex items-center gap-1.5 group-hover:bg-slate-100 transition-colors">
                        <BookmarkCheck className="w-3 h-3 text-indigo-400" />
                        {link.skills.name}
                        <span className="text-[10px] text-slate-400 font-normal ml-0.5">w{link.importance_weight}</span>
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
            {missingSkillsList.length > 0 && (
              <div className="bg-gradient-to-r from-rose-50/80 to-amber-50/80 p-3 rounded-2xl border border-rose-100/60">
                <span className="text-[10px] uppercase text-rose-600 font-bold tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3" />
                  Missing Skills
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {missingSkillsList.map((gap) => (
                    <span key={gap.id} className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-white/80 text-rose-600 border border-dashed border-amber-300/60 inline-flex items-center gap-1">
                      {gap.skills?.name || 'Required Skill'}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center gap-3 flex-wrap pt-4 border-t border-slate-100/80" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <div className="flex gap-4 items-center">
              {daysAgoText && (
                <span className="text-sm text-slate-400 inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {daysAgoText}
                </span>
              )}
              {matchData?.estimated_time_to_close && (
                <span className="text-sm text-indigo-600 font-medium inline-flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                  {matchData.estimated_time_to_close}
                </span>
              )}
            </div>
            {safeApplyUrl && (
              <button onClick={(e) => handleApply(e, opportunity.id, safeApplyUrl)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold no-underline transition-all duration-300 shadow-md hover:shadow-xl active:scale-[0.97] border-none cursor-pointer ${
                  appliedJobIds.has(opportunity.id)
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 hover:bg-emerald-100'
                    : `bg-gradient-to-r ${accentBtn} text-white`
                }`}
                aria-label={appliedJobIds.has(opportunity.id) ? `Applied to ${opportunity.title}` : `Apply to ${opportunity.title}`}>
                {appliedJobIds.has(opportunity.id) ? (
                  <><CheckCircle2 className="w-4 h-4" /><span>Applied</span></>
                ) : (
                  <><span>Apply</span><ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-0.5" /></>
                )}
              </button>
            )}
          </div>
        </div>
      </article>
    )
  }

  return (
    <>
      <style>{`
        @keyframes fade-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.1); } 50% { box-shadow: 0 0 40px rgba(99,102,241,0.2); } }
        .animate-fade-up { animation: fade-up 0.6s ease-out both; }
        .animate-shimmer { background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <Toaster position="top-center" richColors toastOptions={{ style: { borderRadius: '16px', padding: '12px 20px', fontSize: '14px' } }} />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20">
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-indigo-200/20 to-purple-200/20 blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-emerald-200/20 to-teal-200/20 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-amber-100/10 to-rose-100/10 blur-3xl" />
        </div>

        <main className="max-w-[1000px] mx-auto px-4 md:px-6 py-8 md:py-12 relative">
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-800 tracking-tight">
                Smart Dashboard
              </h1>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                AI-powered matching — your skills × live opportunities
              </p>
            </div>
            <button
              onClick={activeTab === 'recommendations' ? refreshMatches : activeTab === 'all' ? handleSyncAll : activeTab === 'remote' ? handleSyncRemotive : handleSync}
              disabled={syncing || matching}
              aria-label={syncLabel}
              className={`relative group flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-bold text-white border-none cursor-pointer transition-all duration-300 overflow-hidden ${
                syncing || matching ? 'bg-slate-400 cursor-not-allowed' : 'shadow-lg hover:shadow-xl active:scale-[0.97]'
              }`}
              style={!syncing && !matching ? {
                background: activeTab === 'recommendations' ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' :
                            activeTab === 'remote' ? 'linear-gradient(135deg, #10b981, #059669)' :
                            'linear-gradient(135deg, #6366f1, #4f46e5)'
              } : {}}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <RefreshCw className={`w-4 h-4 relative z-10 ${syncing || matching ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              <span className="relative z-10">{syncLabel}</span>
            </button>
          </div>

          <div className="relative z-20 mb-6 p-4 md:p-5 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/80 shadow-lg shadow-indigo-500/5 overflow-visible">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
              <div ref={dropdownRef} className="flex flex-col gap-1 relative">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest" id="location-label">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                  <input type="text" placeholder="Anywhere..." value={locationInput} aria-labelledby="location-label"
                    onFocus={() => setIsOpen(true)}
                    onChange={(e) => { setLocationInput(e.target.value); setIsOpen(true) }}
                    className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200/80 bg-white/80 text-sm outline-none focus:ring-2 focus:ring-indigo-300/50 focus:border-indigo-300 transition-all h-10" />
                  {locationInput && (
                    <button onClick={() => { setLocationInput(''); setIsOpen(false) }} className="absolute right-2 top-1/2 -translate-y-1/2 border-none bg-transparent text-slate-400 cursor-pointer hover:text-slate-600 p-1" aria-label="Clear location">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {isOpen && suggestedLocations.length > 0 && (
                  <ul className="absolute top-full left-0 right-0 bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl mt-1.5 max-h-48 overflow-y-auto list-none p-2 shadow-2xl z-[999] no-scrollbar" role="listbox" aria-label="Suggested locations">
                    {suggestedLocations.map((loc) => (
                      <li key={loc} role="option" aria-selected={loc === locationInput}
                        onClick={() => { setLocationInput(loc); setIsOpen(false) }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { setLocationInput(loc); setIsOpen(false) } }}
                        tabIndex={0}
                        className="px-3 py-2 text-sm text-slate-700 cursor-pointer rounded-xl hover:bg-indigo-50 hover:text-indigo-700 transition-colors">{loc}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1" id="type-label">
                  <Briefcase className="w-3 h-3" /> Type
                </label>
                <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} aria-labelledby="type-label"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200/80 bg-white/80 text-sm outline-none focus:ring-2 focus:ring-indigo-300/50 focus:border-indigo-300 transition-all h-10 appearance-none cursor-pointer">
                  {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest" id="search-label">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Role, skill..." value={keywordInput} aria-labelledby="search-label"
                    onChange={(e) => setKeywordInput(e.target.value)}
                    className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200/80 bg-white/80 text-sm outline-none focus:ring-2 focus:ring-indigo-300/50 focus:border-indigo-300 transition-all h-10" />
                  {keywordInput && (
                    <button onClick={() => setKeywordInput('')} className="absolute right-2 top-1/2 -translate-y-1/2 border-none bg-transparent text-slate-400 cursor-pointer hover:text-slate-600 p-1" aria-label="Clear search">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1 relative" ref={sortRef}>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest" id="sort-label">Sort</label>
                <button onClick={() => setShowSortMenu(!showSortMenu)} aria-haspopup="listbox" aria-expanded={showSortMenu} aria-labelledby="sort-label"
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-slate-200/80 bg-white/80 text-sm outline-none focus:ring-2 focus:ring-indigo-300/50 focus:border-indigo-300 transition-all h-10 cursor-pointer text-slate-700">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="flex-1 text-left">{sortOptions.find(o => o.value === sortBy)?.label || 'Newest'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
                </button>
                {showSortMenu && (
                  <ul className="absolute top-full left-0 right-0 bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl mt-1.5 list-none p-2 shadow-2xl z-[999] no-scrollbar" role="listbox" aria-label="Sort options">
                    {sortOptions.map((opt) => (
                      <li key={opt.value} role="option" aria-selected={sortBy === opt.value}
                        onClick={() => { setSortBy(opt.value); setShowSortMenu(false) }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { setSortBy(opt.value); setShowSortMenu(false) } }}
                        tabIndex={0}
                        className={`px-3 py-2 text-sm cursor-pointer rounded-xl transition-colors ${sortBy === opt.value ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'}`}>{opt.label}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {!loading && !error && activeTab !== 'recommendations' && sortedJobs.length > 0 && (
            <div className="flex items-center justify-between mb-3" aria-live="polite">
              <p className="text-xs text-slate-400 font-medium">
                Showing {sortedJobs.length} of {totalCount} opportunity{totalCount !== 1 ? 'ies' : 'y'}
              </p>
            </div>
          )}

          <div className="flex items-center gap-1 mb-6 relative bg-white/40 backdrop-blur-sm rounded-2xl p-1.5 border border-slate-200/60 shadow-sm w-fit">
            <div className="absolute bottom-1.5 top-1.5 transition-all duration-300 ease-out bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl shadow-md"
              style={{ left: tabIndicator.left, width: tabIndicator.width }} />
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              const isRecs = tab.id === 'recommendations'
              return (
                <button key={tab.id} ref={el => tabRefs.current[tab.id] = el}
                  onClick={() => switchTab(tab.id)}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`${tab.label}${tab.id === 'recommendations' && recsTopPicks.length > 0 ? `, ${recsTopPicks.length} picks` : ''}`}
                  className={`relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer transition-all duration-200 whitespace-nowrap ${
                    isActive ? 'text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
                  } ${isRecs && isActive ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 bg-clip-text text-transparent' : ''}`}
                  style={isActive ? { color: 'white' } : {}}>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                  {tab.label}
                  {tab.id === 'recommendations' && !loadingRecs && recsTopPicks.length > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 text-white" aria-label={`${recsTopPicks.length} recommendations`}>{recsTopPicks.length}</span>
                  )}
                </button>
              )
            })}
            <button onClick={() => setShowSavedOnly(!showSavedOnly)}
              role="tab"
              aria-selected={showSavedOnly}
              aria-label={`Saved jobs${savedJobIds.size > 0 ? `, ${savedJobIds.size} saved` : ''}`}
              className={`relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer transition-all duration-200 ml-2 ${
                showSavedOnly ? 'bg-rose-50 text-rose-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
              }`}>
              <Heart className={`w-4 h-4 ${showSavedOnly ? 'fill-rose-500 text-rose-500' : ''}`} />
              Saved
              {savedJobIds.size > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600">{savedJobIds.size}</span>}
            </button>
          </div>

          {loading && (
            <div className="grid gap-5" aria-label="Loading opportunities">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white/60 backdrop-blur-sm border border-slate-200/60 rounded-3xl p-7 overflow-hidden animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="h-6 w-3/5 rounded-xl bg-slate-200/60 relative overflow-hidden"><div className="absolute inset-0 animate-shimmer" /></div>
                      <div className="h-4 w-2/5 rounded-lg bg-slate-100/60 relative overflow-hidden"><div className="absolute inset-0 animate-shimmer" /></div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-slate-100/60 relative overflow-hidden shrink-0"><div className="absolute inset-0 animate-shimmer" /></div>
                  </div>
                  <div className="mt-5 space-y-2">
                    <div className="h-3 w-full rounded-lg bg-slate-100/60 relative overflow-hidden"><div className="absolute inset-0 animate-shimmer" /></div>
                    <div className="h-3 w-4/5 rounded-lg bg-slate-100/60 relative overflow-hidden"><div className="absolute inset-0 animate-shimmer" /></div>
                  </div>
                  <div className="mt-5 flex gap-2">
                    <div className="h-7 w-16 rounded-lg bg-slate-100/60 relative overflow-hidden"><div className="absolute inset-0 animate-shimmer" /></div>
                    <div className="h-7 w-20 rounded-lg bg-slate-100/60 relative overflow-hidden"><div className="absolute inset-0 animate-shimmer" /></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-100/60 rounded-2xl p-4 text-red-600 text-sm flex items-center gap-2 shadow-lg" role="alert">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {!loading && !error && activeTab !== 'recommendations' && sortedJobs.length === 0 && (
            <div className="bg-white/40 backdrop-blur-sm border-2 border-dashed border-slate-200/60 rounded-3xl p-16 text-center shadow-sm">
              <Target className="w-14 h-14 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 text-sm font-medium">No matches found. Adjust filters or sync new jobs.</p>
            </div>
          )}

          {!loading && !error && activeTab !== 'recommendations' && sortedJobs.length > 0 && (
            <div className="grid gap-5" role="list" aria-label="Job opportunities">
              {sortedJobs.map((opp, i) => renderJobCard(opp, 'default', i))}
            </div>
          )}

          {!loading && !error && activeTab !== 'recommendations' && hasMore && sortedJobs.length > 0 && (
            <div className="flex justify-center mt-6">
              <button onClick={() => loadOpportunities(true)} disabled={loadingMore}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/80 border border-slate-200/60 text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:border-indigo-200/60 hover:shadow-md transition-all duration-300 cursor-pointer disabled:opacity-50"
                aria-label="Load more opportunities">
                {loadingMore ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                {loadingMore ? 'Loading...' : `Load More (${totalCount - opportunities.length} remaining)`}
              </button>
            </div>
          )}

          {activeTab === 'recommendations' && !loading && (
            <>
              {loadingRecs && (
                <div className="grid gap-5" aria-label="Loading recommendations">
                  {[1,2,3].map(i => (
                    <div key={i} className="bg-white/60 backdrop-blur-sm border border-slate-200/60 rounded-3xl p-7 overflow-hidden animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                      <div className="flex justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="h-6 w-3/5 rounded-xl bg-slate-200/60 relative overflow-hidden"><div className="absolute inset-0 animate-shimmer" /></div>
                          <div className="h-4 w-2/5 rounded-lg bg-slate-100/60 relative overflow-hidden"><div className="absolute inset-0 animate-shimmer" /></div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-slate-100/60 relative overflow-hidden shrink-0"><div className="absolute inset-0 animate-shimmer" /></div>
                      </div>
                      <div className="mt-5 space-y-2">
                        <div className="h-3 w-full rounded-lg bg-slate-100/60 relative overflow-hidden"><div className="absolute inset-0 animate-shimmer" /></div>
                        <div className="h-3 w-4/5 rounded-lg bg-slate-100/60 relative overflow-hidden"><div className="absolute inset-0 animate-shimmer" /></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loadingRecs && recsTopPicks.length === 0 && (
                <div className="bg-white/40 backdrop-blur-sm border-2 border-dashed border-slate-200/60 rounded-3xl p-16 text-center shadow-sm animate-fade-up">
                  <Sparkles className="w-14 h-14 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 text-sm font-medium">No recommendations yet. Hit <strong>Match</strong> above to calculate your scores.</p>
                </div>
              )}

              {!loadingRecs && recsTopPicks.length > 0 && (
                <div className="grid gap-5">
                  <div className="flex items-center gap-3 mb-1 animate-fade-up">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Your Top Matches</h2>
                      <p className="text-xs text-slate-500">Curated just for you based on your skill profile</p>
                    </div>
                  </div>
                  {recsTopPicks.map((opp, i) => renderJobCard(opp, 'violet', i))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  )
}
