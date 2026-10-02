/**
 * Company / employer notification helpers.
 *
 * Security notes:
 * - These helpers use the service-role client, which BYPASSES row level
 *   security. That is acceptable for inserting notifications, but it means
 *   recipients must never come from client input.
 * - The recipient set is therefore resolved from `company_members` INSIDE this
 *   module, and the low-level insert is not exported. Callers cannot hand in a
 *   user id, so the "recipients are company-derived" rule is enforced by the
 *   module boundary rather than by convention.
 */
import { createServiceClient } from '@/lib/supabase-service'

/**
 * Returns the user ids of everyone currently attached to a company.
 * Deactivated memberships are skipped.
 */
export async function getCompanyMemberIds(companyId, { roles } = {}) {
  try {
    const supabase = createServiceClient()

    let query = supabase
      .from('company_members')
      .select('user_id, role')
      .eq('company_id', companyId)
      .eq('is_current', true)

    if (Array.isArray(roles) && roles.length > 0) {
      query = query.in('role', roles)
    }

    const { data, error } = await query

    if (error) throw error

    return [...new Set((data || []).map((row) => row.user_id).filter(Boolean))]
  } catch (error) {
    console.error('[Company notification] Member lookup failed:', error.message)
    return []
  }
}

/**
 * Counts owners so callers can refuse to remove or demote the last one.
 */
export async function countCompanyOwners(companyId) {
  try {
    const supabase = createServiceClient()

    const { count, error } = await supabase
      .from('company_members')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('role', 'owner')
      .eq('is_current', true)

    if (error) throw error

    return count || 0
  } catch (error) {
    console.error('[Company notification] Owner count failed:', error.message)
    return 0
  }
}

async function insertCompanyNotification({
  recipientId,
  type,
  title,
  message,
  actionUrl,
  companyId,
  data = {},
}) {
  const supabase = createServiceClient()

  const { error } = await supabase.from('notifications').insert({
    user_id: recipientId,
    type,
    title,
    message,
    is_read: false,
    is_emailed: false,
    action_url: actionUrl,
    data: { ...data, company_id: companyId },
  })

  if (error) throw error
}

/**
 * Fan a notification out to a set of company members.
 *
 * Deliberately NOT exported: it accepts an arbitrary recipient list, which is
 * only safe because callers derive that list via `getCompanyMemberIds`.
 * Keep it module-private so a future route cannot pass a body-supplied id.
 */
async function sendCompanyNotifications({
  companyId,
  recipientIds,
  type,
  title,
  message,
  actionUrl,
  data = {},
}) {
  const uniqueRecipients = [...new Set((recipientIds || []).filter(Boolean))]

  if (uniqueRecipients.length === 0) {
    return { success: true, notified: 0 }
  }

  const results = await Promise.allSettled(
    uniqueRecipients.map((recipientId) =>
      insertCompanyNotification({
        recipientId,
        type,
        title,
        message,
        actionUrl,
        companyId,
        data,
      })
    )
  )

  const failed = results.filter((result) => result.status === 'rejected')

  failed.forEach((result) => {
    console.error('[Company notification] Insert failed:', result.reason?.message)
  })

  return {
    success: failed.length === 0,
    notified: uniqueRecipients.length - failed.length,
  }
}

/**
 * Convenience wrapper: resolve the company's members and notify them.
 */
export async function sendCompanyNotificationToMembers({
  companyId,
  type,
  title,
  message,
  actionUrl,
  data = {},
  roles,
  excludeUserIds = [],
}) {
  const memberIds = await getCompanyMemberIds(companyId, { roles })
  const recipients = memberIds.filter((id) => !excludeUserIds.includes(id))

  return sendCompanyNotifications({
    companyId,
    recipientIds: recipients,
    type,
    title,
    message,
    actionUrl,
    data,
  })
}
