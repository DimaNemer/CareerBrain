import { sendProjectNotificationEmail } from '@/lib/email'
import { createServiceClient } from '@/lib/supabase-service'

export async function sendProjectNotification({
  recipientId,
  type,
  title,
  message,
  projectId,
  data = {},
}) {
  try {
    const supabase = createServiceClient()
    const actionUrl = `/projects/${projectId}`

    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        type,
        title,
        message,
        is_read: false,
        is_emailed: false,
        action_url: actionUrl,
        data: { ...data, project_id: projectId },
      })
      .select('id')
      .single()

    if (notificationError) throw notificationError

    const [{ data: authUser }, { data: profile }] = await Promise.all([
      supabase.auth.admin.getUserById(recipientId),
      supabase.from('profiles').select('full_name, username').eq('id', recipientId).maybeSingle(),
    ])

    const emailResult = await sendProjectNotificationEmail({
      to: authUser?.user?.email,
      recipientName: profile?.full_name || profile?.username,
      subject: title,
      message,
      actionUrl,
    })

    if (emailResult.success) {
      await supabase
        .from('notifications')
        .update({ is_emailed: true })
        .eq('id', notification.id)
    } else {
      console.error('[Project notification] Email failed:', emailResult.error)
    }

    return { success: true, notificationId: notification.id, email: emailResult }
  } catch (error) {
    console.error('[Project notification] Failed:', error.message)
    return { success: false, error: error.message }
  }
}
