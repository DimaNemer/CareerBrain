import { createServiceClient } from '@/lib/supabase-service'
import { sendJobMatchEmail } from '@/lib/email'

const MATCH_THRESHOLD = 0.60

export async function autoMatchAndNotify(userId) {
  if (!userId) return { notifications: 0, emails: 0 }

  const supabase = createServiceClient()
  const result = { notifications: 0, emails: 0 }

  try {
    const { count: skillCount } = await supabase
      .from('user_skills')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (!skillCount || skillCount === 0) return result

    try {
      await supabase.rpc('calculate_user_job_matches', { target_user_id: userId })
    } catch (e) {
      console.error('[AutoMatch] Match calc error:', e.message)
    }

    const { data: matches } = await supabase
      .from('match_results')
      .select(`
        id, user_id, opportunity_id, match_score, estimated_time_to_close,
        opportunities ( id, title, company, location, opportunity_type, application_url ),
        missing_skills ( skills ( name ) )
      `)
      .eq('user_id', userId)
      .gte('match_score', MATCH_THRESHOLD)

    if (!matches || matches.length === 0) return result

    const uniqueMatches = Object.values(
      matches.reduce((acc, m) => {
        if (!acc[m.opportunity_id] || m.match_score > acc[m.opportunity_id].match_score) {
          acc[m.opportunity_id] = m
        }
        return acc
      }, {})
    )

    const opportunityIds = uniqueMatches.map(m => m.opportunity_id)

    const { data: existing } = await supabase
      .from('notifications')
      .select('id, data, is_emailed')
      .eq('user_id', userId)
      .eq('type', 'job_match')
      .in('data->>job_id', opportunityIds)

    const existingMap = new Map((existing || []).map(n => [n.data?.job_id, n]))

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single()

    const { data: authUser } = await supabase.auth.admin.getUserById(userId)
    const userEmail = authUser?.user?.email

    for (const match of uniqueMatches) {
      const job = match.opportunities
      if (!job) continue

      const existingNotif = existingMap.get(job.id)

      // Skip if it was already created AND already emailed (or doesn't need email)
      if (existingNotif && existingNotif.is_emailed) continue
      // If it already exists and we don't have an email to send, also skip
      if (existingNotif && !userEmail) continue

      const matchedSkills = (match.missing_skills || [])
        .map(ms => ms.skills?.name)
        .filter(Boolean)
        .slice(0, 3)

      const skillsText = matchedSkills.length > 0
        ? ` in **${matchedSkills.join('** & **')}**`
        : ''

      const title = `🚀 New Match: ${job.title} at ${job.company}`
      const message = `We found a new opportunity matching your skills${skillsText}. Tap to view details and apply!`

      let notifId = existingNotif?.id

      if (!existingNotif) {
        const { data: inserted, error: notifErr } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'job_match',
            title,
            message,
            is_read: false,
            action_url: `/opportunities/${job.id}`,
            data: {
              job_id: job.id,
              job_title: job.title,
              company: job.company,
              location: job.location,
              job_type: job.opportunity_type,
              match_score: match.match_score,
              matched_skills: matchedSkills,
              application_url: job.application_url,
              estimated_time_to_close: match.estimated_time_to_close,
            },
          })
          .select('id')
          .single()

        if (notifErr) {
          console.error('[AutoMatch] Insert error:', notifErr.message)
          continue
        }

        notifId = inserted?.id
        result.notifications++
      }

      if (userEmail && notifId) {
        try {
          const emailResult = await sendJobMatchEmail({
            to: userEmail,
            userName: profile?.full_name,
            jobTitle: job.title,
            company: job.company,
            location: job.location,
            jobType: job.opportunity_type,
            matchScore: match.match_score,
            matchedSkills,
            jobId: job.id,
            applicationUrl: job.application_url,
          })
          if (emailResult.success) {
            result.emails++
            await supabase
              .from('notifications')
              .update({ is_emailed: true })
              .eq('id', notifId)
          }
        } catch (e) {
          console.error('[AutoMatch] Email sending error:', e.message || e)
        }
      }
    }
  } catch (err) {
    console.error('[AutoMatch] Error:', err.message)
  }

  return result
}
