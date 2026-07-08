'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Toaster, toast } from 'sonner'
import { Heart, MapPin, Clock, AlertTriangle, ArrowRight, ArrowLeft, Briefcase, BookmarkCheck, Zap, ChevronRight, Sparkles, ExternalLink, CheckCircle2 } from 'lucide-react'

function getSafeUrl(url) {
  if (!url) return null
  try { const p = new URL(url); return (p.protocol === 'http:' || p.protocol === 'https:') ? p.toString() : null } catch {}
  return null
}

function getDaysAgo(dateString) {
  if (!dateString) return null
  try {
    const d = new Date(dateString); const t = new Date()
    d.setHours(0,0,0,0); t.setHours(0,0,0,0)
    const diff = Math.floor((t.getTime() - d.getTime()) / (1000*3600*24))
    if (diff < 0) return 'recently'
    if (diff === 0) return 'today'
    if (diff === 1) return 'yesterday'
    if (diff >= 30) return `${Math.floor(diff/30)}mo ago`
    if (diff >= 7) return `${Math.floor(diff/7)}wk ago`
    return `${diff} days ago`
  } catch { return null }
}

export default function OpportunityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [opportunity, setOpportunity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)
  const [applied, setApplied] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/opportunities/${params.id}`)
        if (res.status === 401) { router.push('/login'); return }
        if (!res.ok) throw new Error('Opportunity not found')
        const data = await res.json()
        setOpportunity(data.opportunity)
      } catch (err) { setError(err.message) }
      finally { setLoading(false) }
    }
    async function checkSaved() {
      try {
        const res = await fetch('/api/opportunities/saved')
        if (res.ok) {
          const data = await res.json()
          const ids = new Set((data.opportunities || []).map(j => j.id))
          setSaved(ids.has(params.id))
        }
      } catch {}
    }
    async function checkApplied() {
      try {
        const res = await fetch('/api/opportunities/applied')
        if (res.ok) {
          const data = await res.json()
          const ids = new Set((data.applied || []).map(j => j.opportunity_id))
          setApplied(ids.has(params.id))
        }
      } catch {}
    }
    load(); checkSaved(); checkApplied()
  }, [params.id, router])

  const toggleBookmark = async () => {
    const wasSaved = saved
    setSaved(!wasSaved)
    try {
      if (wasSaved) {
        await fetch(`/api/opportunities/saved?opportunity_id=${params.id}`, { method: 'DELETE' })
        toast.success('Removed from saved')
      } else {
        await fetch('/api/opportunities/saved', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ opportunity_id: params.id }) })
        toast.success('Job saved')
      }
    } catch {
      setSaved(wasSaved)
      toast.error('Failed to update bookmark')
    }
  }

  const toggleApplied = async () => {
    const wasApplied = applied
    setApplied(!wasApplied)
    try {
      if (wasApplied) {
        await fetch(`/api/opportunities/applied?opportunity_id=${params.id}`, { method: 'DELETE' })
      } else {
        await fetch('/api/opportunities/applied', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ opportunity_id: params.id }) })
      }
    } catch { setApplied(wasApplied) }
  }

  const handleApply = (e, url) => {
    e.preventDefault()
    if (applied) {
      toggleApplied()
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
      toggleApplied()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !opportunity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">{error || 'Opportunity not found'}</p>
          <Link href="/opportunities" className="inline-flex items-center gap-2 mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const safeApplyUrl = getSafeUrl(opportunity.application_url)
  const daysAgoText = getDaysAgo(opportunity.posted_at || opportunity.created_at)
  const opportunitySkills = Array.isArray(opportunity.opportunity_skills) ? opportunity.opportunity_skills : []
  const matchData = opportunity.match_results?.[0] || null
  const score = matchData ? Math.round(matchData.match_score * 100) : 0
  const missingSkillsList = matchData?.missing_skills || []
  const scoreColor = score >= 80 ? '#10b981' : score >= 50 ? '#f97316' : '#9ca3af'
  const scoreLabel = score >= 80 ? 'Excellent' : score >= 50 ? 'Good' : 'Potential'
  const radius = 42; const circumference = 2 * Math.PI * radius; const offset = circumference - (score/100)*circumference

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20">
        <main className="max-w-[800px] mx-auto px-4 md:px-6 py-8 md:py-12">
          <Link href="/opportunities" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 font-medium mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          <div className="bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-lg">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{opportunity.title}</h1>
                  {matchData && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-50 to-orange-50 text-orange-700 border border-orange-200/60 shadow-sm">
                      <Zap className="w-3 h-3" />{score}% Match
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 flex items-center gap-2 flex-wrap">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>{opportunity.company || 'Unknown'}</span>
                  {opportunity.source && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${opportunity.source === 'Adzuna' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {opportunity.source}
                    </span>
                  )}
                  {opportunity.location && <><span className="text-slate-300">·</span><MapPin className="w-3.5 h-3.5 text-slate-400" /><span>{opportunity.location}</span></>}
                  {daysAgoText && <><span className="text-slate-300">·</span><Clock className="w-3.5 h-3.5 text-slate-400" /><span>{daysAgoText}</span></>}
                  {opportunity.opportunity_type && <><span className="text-slate-300">·</span><span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{opportunity.opportunity_type}</span></>}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={toggleBookmark} aria-label={saved ? 'Unsave job' : 'Save job'}
                  className="bg-transparent border-none cursor-pointer p-2 rounded-xl hover:bg-slate-100/80 transition-all duration-300">
                  <Heart className={`w-6 h-6 transition-all duration-300 ${saved ? 'fill-rose-500 text-rose-500 scale-110 drop-shadow-sm' : 'text-slate-400 hover:text-rose-400 hover:scale-110'}`} />
                </button>
                {matchData && (
                  <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: 96, height: 96 }} role="img" aria-label={`Match score: ${score} percent, ${scoreLabel}`}>
                    <svg width={96} height={96} className="transform -rotate-90">
                      <circle cx={48} cy={48} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={6} />
                      <circle cx={48} cy={48} r={radius} fill="none" stroke={scoreColor} strokeWidth={6}
                        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                        className="transition-all duration-1000 ease-out" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold" style={{ color: scoreColor }}>{score}%</span>
                  </div>
                )}
              </div>
            </div>

            {opportunity.description && (
              <div className="mb-6">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Description</h2>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{opportunity.description}</p>
              </div>
            )}

            {opportunitySkills.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Skills & Requirements</h2>
                <div className="flex flex-wrap gap-2">
                  {opportunitySkills.map((link) => {
                    if (!link?.skills) return null
                    const weight = link.importance_weight || 1
                    return (
                      <span key={link.skills.id || link.skills.name}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-xl border inline-flex items-center gap-1.5 ${
                          link.is_mandatory ? 'bg-indigo-50 text-indigo-700 border-indigo-200/60' : 'bg-slate-100/80 text-slate-600 border-slate-200/60'
                        }`}>
                        <BookmarkCheck className={`w-3 h-3 ${link.is_mandatory ? 'text-indigo-400' : 'text-slate-400'}`} />
                        {link.skills.name}
                        <span className="text-[10px] opacity-60 font-normal">w{weight}</span>
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {missingSkillsList.length > 0 && (
              <div className="mb-6 bg-gradient-to-r from-rose-50/80 to-amber-50/80 p-4 rounded-2xl border border-rose-100/60">
                <span className="text-[10px] uppercase text-rose-600 font-bold tracking-wider block mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Missing Skills — {missingSkillsList.length} gap{missingSkillsList.length > 1 ? 's' : ''} to address
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {missingSkillsList.map((gap) => (
                    <span key={gap.id} className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/80 text-rose-600 border border-dashed border-amber-300/60 inline-flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      {gap.skills?.name || 'Required Skill'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {matchData?.estimated_time_to_close && (
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border border-indigo-100/60">
                <span className="text-xs font-bold text-indigo-600 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                  Estimated Learning Gap: {matchData.estimated_time_to_close}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-100/80">
              <div className="flex gap-2">
                {opportunity.opportunity_type && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{opportunity.opportunity_type}</span>
                )}
              </div>
              <div className="flex gap-3">
                {safeApplyUrl && (
                  <button onClick={(e) => handleApply(e, safeApplyUrl)}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-semibold no-underline transition-all duration-300 shadow-md hover:shadow-xl active:scale-[0.97] border-none cursor-pointer ${
                      applied
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 hover:bg-emerald-100'
                        : 'bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white'
                    }`}
                    aria-label={applied ? 'Applied to this position' : 'Apply to this position'}>
                    {applied ? (
                      <><CheckCircle2 className="w-4 h-4" /><span>Applied</span></>
                    ) : (
                      <><span>Apply Now</span><ExternalLink className="w-4 h-4" /></>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
