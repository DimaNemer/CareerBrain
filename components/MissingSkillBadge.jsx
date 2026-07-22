'use client'

import { useEffect, useState } from 'react'
import { Zap, ExternalLink } from 'lucide-react'

const COURSERA_FALLBACK = (skill) =>
  `https://www.coursera.org/search?query=${encodeURIComponent(skill)}`
const YOUTUBE_FALLBACK = (skill) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(skill + ' tutorial for beginners')}`

export default function MissingSkillBadge({ skillName, skillId }) {
  const skill = skillName || 'Required Skill'

  const [courseraUrl, setCourseraUrl] = useState(() => COURSERA_FALLBACK(skill))
  const [youtubeUrl, setYoutubeUrl] = useState(() => YOUTUBE_FALLBACK(skill))

  useEffect(() => {
    if (!skillId) return

    let cancelled = false
    async function fetchResources() {
      try {
        const res = await fetch(`/api/v1/learning-resources?skill_id=${skillId}`)
        if (!res.ok) return
        const { data } = await res.json()
        if (!data?.length || cancelled) return

        const coursera = data.find(
          (r) => r.provider?.toLowerCase().includes('coursera')
        )
        const youtube = data.find(
          (r) => r.provider?.toLowerCase().includes('youtube') ||
                 r.url?.includes('youtube.com')
        )

        if (coursera?.url) setCourseraUrl(coursera.url)
        if (youtube?.url) setYoutubeUrl(youtube.url)
      } catch {}
    }

    fetchResources()
    return () => { cancelled = true }
  }, [skillId])

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white/80 text-rose-500 border border-dashed border-amber-300 inline-flex items-center gap-1">
        <Zap className="w-3 h-3 text-amber-400" />
        {skill}
      </span>

      <div className="flex items-center gap-1 ml-1">
        <a
          href={courseraUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200/60 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300 transition-all duration-200 no-underline shadow-sm hover:shadow"
          aria-label={`Learn ${skill} on Coursera`}
        >
          Coursera
          <ExternalLink className="w-2.5 h-2.5" />
        </a>

        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200/60 hover:bg-red-100 hover:text-red-700 hover:border-red-300 transition-all duration-200 no-underline shadow-sm hover:shadow"
          aria-label={`Watch ${skill} tutorials on YouTube`}
        >
          YouTube
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  )
}
