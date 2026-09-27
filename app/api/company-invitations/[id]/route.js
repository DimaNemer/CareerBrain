import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const VALID_ACTIONS = [
  'accept',
  'decline',
]

// PUT /api/company-invitations/[id]
export async function PUT(request, { params }) {
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

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Invalid invitation ID' },
        { status: 400 }
      )
    }

    let body

    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const action =
      typeof body.action === 'string'
        ? body.action.trim()
        : ''

    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        {
          error:
            'Invalid invitation action',
        },
        { status: 400 }
      )
    }

    const {
      data: invitation,
      error: invitationError,
    } = await supabase
      .from('company_invitations')
      .select(`
        id,
        company_id,
        invited_user_id,
        job_title,
        role,
        status
      `)
      .eq('id', id)
      .eq('invited_user_id', user.id)
      .maybeSingle()

    if (invitationError) {
      console.error(
        'Invitation lookup error:',
        invitationError.message
      )

      return NextResponse.json(
        {
          error:
            'Unable to load invitation',
        },
        { status: 500 }
      )
    }

    if (!invitation) {
      return NextResponse.json(
        {
          error:
            'Invitation not found',
        },
        { status: 404 }
      )
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        {
          error:
            'This invitation has already been answered',
        },
        { status: 409 }
      )
    }

    if (action === 'decline') {
      const {
        data: declinedInvitation,
        error: declineError,
      } = await supabase
        .from('company_invitations')
        .update({
          status: 'declined',
          responded_at:
            new Date().toISOString(),
        })
        .eq('id', invitation.id)
        .eq('invited_user_id', user.id)
        .eq('status', 'pending')
        .select()
        .single()

      if (declineError) {
        console.error(
          'Invitation decline error:',
          declineError.message
        )

        return NextResponse.json(
          {
            error:
              'Unable to decline invitation',
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        {
          message:
            'Invitation declined successfully',
          invitation:
            declinedInvitation,
        },
        { status: 200 }
      )
    }

    const {
      data: existingMembership,
      error: membershipCheckError,
    } = await supabase
      .from('company_members')
      .select('id, is_current')
      .eq(
        'company_id',
        invitation.company_id
      )
      .eq('user_id', user.id)
      .eq('is_current', true)
      .maybeSingle()

    if (membershipCheckError) {
      console.error(
        'Membership check error:',
        membershipCheckError.message
      )

      return NextResponse.json(
        {
          error:
            'Unable to verify current membership',
        },
        { status: 500 }
      )
    }

    if (existingMembership) {
      return NextResponse.json(
        {
          error:
            'You are already a member of this company',
        },
        { status: 409 }
      )
    }

    const today =
      new Date()
        .toISOString()
        .slice(0, 10)

    const {
      data: membership,
      error: membershipInsertError,
    } = await supabase
      .from('company_members')
      .insert({
        company_id:
          invitation.company_id,
        user_id: user.id,
        job_title:
          invitation.job_title || null,
        role: invitation.role,
        is_current: true,
        started_at: today,
        ended_at: null,
      })
      .select()
      .single()

    if (membershipInsertError) {
      console.error(
        'Membership insert error:',
        membershipInsertError.message
      )

      return NextResponse.json(
        {
          error:
            membershipInsertError.message ||
            'Unable to join company',
        },
        { status: 500 }
      )
    }

    const {
      data: acceptedInvitation,
      error: acceptError,
    } = await supabase
      .from('company_invitations')
      .update({
        status: 'accepted',
        responded_at:
          new Date().toISOString(),
      })
      .eq('id', invitation.id)
      .eq('invited_user_id', user.id)
      .eq('status', 'pending')
      .select()
      .single()

    if (acceptError) {
      console.error(
        'Invitation accept update error:',
        acceptError.message
      )

      return NextResponse.json(
        {
          error:
            'Membership was created, but the invitation could not be marked as accepted',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message:
          'Invitation accepted successfully',
        invitation:
          acceptedInvitation,
        membership,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(
      'Company invitation PUT error:',
      error
    )

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}