import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.NOTIFICATION_EMAIL_FROM || 'Career Brain <onboarding@resend.dev>'

export async function sendJobMatchEmail({ to, userName, jobTitle, company, location, jobType, matchScore, matchedSkills, jobId, applicationUrl }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const jobUrl = applicationUrl || `${siteUrl}/opportunities/${jobId}`
  const percent = Math.round((matchScore || 0) * 100)
  const skillsList = (matchedSkills || []).slice(0, 4).map(s => `<strong>${s}</strong>`).join(' & ')

  // Resend free tier with onboarding@resend.dev — all emails route to verified address
  const VERIFIED_EMAIL = 'sabbadih5@gmail.com'
  const targetEmail = VERIFIED_EMAIL

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:#4F46E5;padding:32px 40px;text-align:center;">
          <div style="font-size:28px;margin-bottom:8px;">🧠</div>
          <h1 style="color:#FFFFFF;font-size:22px;font-weight:700;margin:0;letter-spacing:-0.3px;">Career Brain</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:40px;">
          <p style="color:#334155;font-size:16px;margin:0 0 16px;">Hi <strong>${userName || 'there'}</strong>,</p>
          <p style="color:#334155;font-size:16px;margin:0 0 24px;">A new job has been posted that matches your skills${skillsList ? ` in ${skillsList}` : ''}.</p>

          <!-- Job Card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;margin-bottom:24px;">
            <tr><td style="padding:24px;">
              <p style="color:#4F46E5;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;">New Match · ${percent}%</p>
              <h2 style="color:#0F172A;font-size:20px;font-weight:700;margin:0 0 4px;">${jobTitle}</h2>
              <p style="color:#475569;font-size:15px;margin:0 0 16px;">${company}</p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  ${location ? `<td style="padding-right:16px;"><span style="color:#64748B;font-size:13px;">📍 ${location}</span></td>` : ''}
                  ${jobType ? `<td><span style="color:#64748B;font-size:13px;">💼 ${jobType}</span></td>` : ''}
                </tr>
              </table>
            </td></tr>
          </table>

          <!-- CTA Button -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0 24px;">
              <a href="${jobUrl}" style="display:inline-block;background:#4F46E5;color:#FFFFFF;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">View Opportunity & Apply →</a>
            </td></tr>
          </table>

          <p style="color:#94A3B8;font-size:13px;margin:0;">This match was calculated based on your skills profile and the job requirements.</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:20px 40px;text-align:center;">
          <p style="color:#94A3B8;font-size:12px;margin:0;">© ${new Date().getFullYear()} Career Brain. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [targetEmail],
      subject: `New Job Match: ${jobTitle} – ${company}`,
      html,
    })

    if (error) {
      console.error('[Email] Resend error:', error.message)
      return { success: false, error: error.message }
    }

    console.log(`[Email] Sent to ${targetEmail} | ID: ${data?.id}`)
    return { success: true, id: data?.id }
  } catch (err) {
    console.error('[Email] Send failed:', err.message)
    return { success: false, error: err.message }
  }
}
