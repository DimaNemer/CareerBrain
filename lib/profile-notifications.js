import { createServiceClient } from '@/lib/supabase-service'

export async function sendProfileViewNotification({ profileOwnerId, viewerId }) {
  if (profileOwnerId === viewerId) return { success: false, error: 'Self-view' }

  try {
    const supabase = createServiceClient()

    const { data: viewerProfile } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', viewerId)
      .maybeSingle()

    const viewerName = viewerProfile?.full_name || viewerProfile?.username || 'Someone'

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: profileOwnerId,
        type: 'profile_view',
        title: 'Profile viewed',
        message: `${viewerName} viewed your profile`,
        is_read: false,
        is_emailed: false,
        action_url: `/profile/${viewerId}`,
        data: { viewer_id: viewerId, viewer_name: viewerName },
      })

    if (notificationError) throw notificationError

    return { success: true }
  } catch (error) {
    console.error('[Profile notification] Failed:', error.message)
    return { success: false, error: error.message }
  }
}
