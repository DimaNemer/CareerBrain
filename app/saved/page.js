'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Toaster, toast } from 'sonner'
import { Heart, MapPin, Clock, AlertTriangle, ArrowRight, Briefcase, Target, BookmarkCheck } from 'lucide-react'
import MissingSkillBadge from '@/components/MissingSkillBadge'

function getSafeUrl(url) {
  if (!url) return null
  try {
    const parsed = new URL(url)
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') ? parsed.toString() : null
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

export default function SavedOpportunitiesPage() {
  const [savedJobs, setSavedJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()

  const fetchSavedJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/opportunities/saved')
      if (res.status === 401) {
        router.push('/login')
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to populate collections feed')
      setSavedJobs(data.opportunities || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSavedJobs()
  }, [fetchSavedJobs])

  const handleUnsave = async (jobId) => {
    // Optimistic UI update: remove job instantly from list
    const previousSavedJobs = [...savedJobs]
    setSavedJobs(prev => prev.filter(job => job.id !== jobId))

    try {
      const res = await fetch(`/api/opportunities/saved?opportunity_id=${jobId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error()
      toast.success('Removed from saved opportunities')
    } catch {
      toast.error('Failed to remove bookmark. Please try again.')
      setSavedJobs(previousSavedJobs)
    }
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      <main className="max-w-[1000px] mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Saved Bookmarks
          </h1>
          <p className="text-base text-gray-500 mt-1">
            Your handpicked selection of securely isolated matching job records.
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4 text-gray-400">
              <div className="w-10 h-10 border-[3px] border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
              <span className="text-sm">Querying system storage channels...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-600 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {!loading && !error && savedJobs.length === 0 && (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <Heart className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-400 text-sm font-medium">
              No collection items located. Navigate to your central dashboard matrix to save targeted opportunities!
            </p>
          </div>
        )}

        {!loading && !error && savedJobs.length > 0 && (
          <div className="grid gap-5">
            {savedJobs.map(opportunity => {
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
                    onClick={() => handleUnsave(opportunity.id)}
                    className="absolute top-6 right-6 bg-transparent border-none cursor-pointer z-10 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Remove Bookmark"
                  >
                    <Heart className="w-5 h-5 fill-red-500 text-red-500 scale-110" />
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
                            <MissingSkillBadge key={gap.id} skillName={gap.skills?.name} skillId={gap.skills?.id} />
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