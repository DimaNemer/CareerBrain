import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/employer/team/invites/mine
 * Returns all pending invites from company_invites addressed to the current logged-in user's email.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const email = user.email?.trim().toLowerCase()
    if (!email) {
      return NextResponse.json({ invites: [] }, { status: 200 })
    }

    const serviceSupabase = createServiceClient()

    const { data: invites, error } = await serviceSupabase
      .from('company_invites')
      .select(`
        id,
        company_id,
        email,
        role,
        job_title,
        status,
        created_at,
        invited_by,
        companies:company_id (
          id,
          name,
          logo_url,
          industry,
          location
        )
      `)
      .eq('email', email)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Invites Mine] Error fetching invites:', error.message)
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 })
    }

    // Resolve inviter profiles
    const inviterIds = [...new Set((invites || []).map(i => i.invited_by).filter(Boolean))]
    let inviterMap = {}
    if (inviterIds.length > 0) {
      const { data: profiles } = await serviceSupabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', inviterIds)
      if (profiles) {
        inviterMap = Object.fromEntries(profiles.map(p => [p.id, p]))
      }
    }

    const formatted = (invites || []).map((inv) => ({
      ...inv,
      companies: inv.companies,
      inviter: inviterMap[inv.invited_by] || null,
    }))

    return NextResponse.json({ invites: formatted }, { status: 200 })
  } catch (err) {
    console.error('[Invites Mine] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
