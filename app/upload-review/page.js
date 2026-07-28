import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ReviewScreenClient from './ReviewScreenClient'

export default async function UploadReviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch the latest CV upload data to show what was extracted (optional)
  // But actually the user skills are already saved to the database by the extraction route.
  // So we just fetch the user's current skills to display.
  
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      user_skills (
        id,
        proficiency_level,
        source,
        skills ( name, category )
      )
    `)
    .eq('id', user.id)
    .single()

  const skills = profile?.user_skills || []

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Review your Skills</h1>
        <p className="text-slate-600 mt-2 text-sm leading-relaxed">
          Career Brain has extracted these skills from your CV. 
          Please review them, adjust your proficiency levels, and add any missing skills before continuing.
        </p>
      </div>

      <ReviewScreenClient initialSkills={skills} />
    </main>
  )
}
