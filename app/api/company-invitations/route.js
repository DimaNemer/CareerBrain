import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET /api/company-invitations
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const {
      data: invitations,
      error: invitationsError,
    } = await supabase
      .from('company_invitations')
      .select(`
        id,
        company_id,
        invited_user_id,
        invited_by,
        job_title,
        role,
        status,
        created_at,
        responded_at,
        companies (
          id,
          name,
          logo_url,
          industry,
          location
        ),
        inviter:profiles!company_invitations_invited_by_fkey (
          id,
          full_name,
          username
        )
      `)
      .eq('invited_user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', {
        ascending: false,
      })

    if (invitationsError) {
      console.error(
        'Invitation load error:',
        invitationsError.message
      )

      return NextResponse.json(
        {
          error:
            'Unable to load company invitations',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        invitations: invitations || [],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(
      'Company invitation GET error:',
      error
    )

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}