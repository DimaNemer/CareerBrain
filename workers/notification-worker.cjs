const { createClient } = require('@supabase/supabase-js')
const { Resend } = require('resend')
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
function getEnv(key) {
  const match = envContent.match(new RegExp('^' + key + '=(.+)$', 'm'))
  return match ? match[1].trim() : process.env[key]
}

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY')
const RESEND_KEY = getEnv('RESEND_API_KEY')
const SITE_URL = getEnv('NEXT_PUBLIC_SITE_URL') || 'http://localhost:3000'
const MATCH_THRESHOLD = 0.60
const POLL_INTERVAL = 60 * 1000

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
const resend = new Resend(RESEND_KEY)

async function processUser(user) {
  const userId = user.id
  const userEmail = user.email

  const { count: skillCount } = await supabase
    .from('user_skills').select('*', { count: 'exact', head: true }).eq('user_id', userId)
  if (!skillCount || skillCount === 0) return { notifications: 0, emails: 0 }

  try {
    await supabase.rpc('calculate_user_job_matches', { target_user_id: userId })
  } catch (e) {
    console.error('  [RPC] Error for', userEmail, ':', e.message)
  }

  const { data: matches } = await supabase
    .from('match_results')
    .select(`
      id, opportunity_id, match_score, estimated_time_to_close,
      opportunities ( id, title, company, location, opportunity_type, application_url ),
      missing_skills ( skills ( name ) )
    `)
    .eq('user_id', userId)
    .gte('match_score', MATCH_THRESHOLD)

  if (!matches || matches.length === 0) return { notifications: 0, emails: 0 }

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
    .from('notifications').select('id, data, is_emailed')
    .eq('user_id', userId).eq('type', 'job_match')
    .in('data->>job_id', opportunityIds)

  const existingMap = new Map((existing || []).map(n => [n.data?.job_id, n]))

  const { data: profile } = await supabase
    .from('profiles').select('full_name').eq('id', userId).single()

  let created = 0
  let emails = 0

  for (const match of uniqueMatches) {
    const job = match.opportunities
    if (!job) continue

    const existingNotif = existingMap.get(job.id)

    if (existingNotif) continue

    const matchedSkills = (match.missing_skills || [])
      .map(ms => ms.skills?.name).filter(Boolean).slice(0, 3)
    const skillsText = matchedSkills.length > 0 ? ' in ' + matchedSkills.join(' & ') : ''

    let notifId = existingNotif?.id

    if (!existingNotif) {
      const { data: inserted, error: notifErr } = await supabase.from('notifications').insert({
        user_id: userId,
        type: 'job_match',
        title: '\u{1F680} New Match: ' + job.title + ' at ' + job.company,
        message: 'We found a new opportunity matching your skills' + skillsText + '. Tap to view details and apply!',
        is_read: false,
        action_url: '/opportunities/' + job.id,
        data: {
          job_id: job.id, job_title: job.title, company: job.company,
          location: job.location, job_type: job.opportunity_type,
          match_score: match.match_score, matched_skills: matchedSkills,
          application_url: job.application_url,
          estimated_time_to_close: match.estimated_time_to_close,
        },
      }).select('id').single()

      if (notifErr) {
        console.error('  [Worker] Insert error:', notifErr.message)
        continue
      }

      notifId = inserted?.id
      created++
    }

    if (userEmail && notifId) {
      const targetEmail = userEmail
      const percent = Math.round(match.match_score * 100)

      // ── Dev guard ─────────────────────────────────────────────────────────
      // Resend's free plan (using onboarding@resend.dev) redirects ALL emails
      // to the verified address, so badihkabir / badih00 emails end up in
      // sabbadih5's inbox. Until a real domain is configured, only send to the
      // verified dev address and skip everyone else.
      const DEV_VERIFIED_EMAIL = 'sabbadih5@gmail.com'
      const isUsingResendSandbox = !process.env.NOTIFICATION_EMAIL_FROM?.includes('@') ||
        process.env.NOTIFICATION_EMAIL_FROM.includes('resend.dev') ||
        process.env.NODE_ENV !== 'production'

      if (isUsingResendSandbox && targetEmail !== DEV_VERIFIED_EMAIL) {
        console.log('  [DEV] Skipping email to', targetEmail, '(not verified sender — would redirect to', DEV_VERIFIED_EMAIL + ')')
        // Still mark notification as created in DB, just no email sent
        continue
      }
      // ── End dev guard ──────────────────────────────────────────────────────

      const { error: eErr } = await resend.emails.send({
        from: 'Career Brain <onboarding@resend.dev>',
        to: [targetEmail],
        subject: 'New Job Match: ' + job.title + ' - ' + job.company,
        html: '<p>Hi ' + (profile?.full_name || 'there') + ', a new job matches your skills' + skillsText + ': <strong>' + job.title + '</strong> at ' + job.company + ' (' + percent + '% match).</p><p><a href="' + SITE_URL + '/opportunities/' + job.id + '">View Opportunity and Apply</a></p>',
      })
      if (!eErr) {
        emails++
        await supabase
          .from('notifications')
          .update({ is_emailed: true })
          .eq('id', notifId)
      } else {
        console.error('  [Worker] Email failed for', targetEmail, ':', eErr.message || eErr)
      }
    }
  }

  return { notifications: created, emails }
}

async function runCycle() {
  const startTime = Date.now()
  console.log('\n--- Cycle started at', new Date().toLocaleTimeString(), '---')

  const { data: users, error } = await supabase.auth.admin.listUsers()
  if (error) { console.error('Failed to list users:', error.message); return }

  let totalNotifs = 0
  let totalEmails = 0

  for (const user of users.users) {
    try {
      const result = await processUser(user)
      if (result.notifications > 0 || result.emails > 0) {
        console.log('  ' + user.email + ': +' + result.notifications + ' notifs, +' + result.emails + ' emails')
      }
      totalNotifs += result.notifications
      totalEmails += result.emails
    } catch (e) {
      console.error('  Error processing', user.email, ':', e.message)
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  if (totalNotifs > 0 || totalEmails > 0) {
    console.log('  Summary: +' + totalNotifs + ' notifs, +' + totalEmails + ' emails (' + elapsed + 's)')
  } else {
    console.log('  No new notifications (' + elapsed + 's)')
  }
}

async function main() {
  console.log('=== Career Brain Notification Worker ===')
  console.log('Supabase:', SUPABASE_URL)
  console.log('Polling every', POLL_INTERVAL / 1000, 'seconds')
  console.log('Match threshold:', MATCH_THRESHOLD * 100 + '%')
  console.log('Starting...\n')

  await runCycle()

  setInterval(runCycle, POLL_INTERVAL)
}

main().catch(err => {
  console.error('Worker crashed:', err)
  process.exit(1)
})
