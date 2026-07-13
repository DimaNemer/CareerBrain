import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

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

    const { data: certificates, error } = await supabase
      .from('user_certificates')
      .select(`
        id,
        name,
        issuing_organization,
        issue_date,
        expiration_date,
        credential_id,
        credential_url,
        created_at
      `)
      .eq('user_id', user.id)
      .order('issue_date', {
        ascending: false,
        nullsFirst: false,
      })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      certificates: certificates || [],
    })
  } catch (error) {
    console.error('GET certificates error:', error)

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
export async function POST(request) {
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

    const body = await request.json()

    const name = body.name?.trim()
    const issuingOrganization =
      body.issuing_organization?.trim() || null

    if (!name) {
      return NextResponse.json(
        { error: 'Certificate name is required' },
        { status: 400 }
      )
    }

    if (name.length > 150) {
      return NextResponse.json(
        { error: 'Certificate name is too long' },
        { status: 400 }
      )
    }

    const { data: certificate, error } = await supabase
      .from('user_certificates')
      .insert({
        user_id: user.id,
        name,
        issuing_organization: issuingOrganization,
        issue_date: body.issue_date || null,
        expiration_date: body.expiration_date || null,
        credential_id: body.credential_id?.trim() || null,
        credential_url: body.credential_url?.trim() || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { certificate },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST certificate error:', error)

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
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

    const body = await request.json()

    const certificateId = body.id
    const name = body.name?.trim()

    if (!certificateId) {
      return NextResponse.json(
        { error: 'Certificate id is required' },
        { status: 400 }
      )
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Certificate name is required' },
        { status: 400 }
      )
    }

    const { data: certificate, error } = await supabase
      .from('user_certificates')
      .update({
        name,
        issuing_organization:
          body.issuing_organization?.trim() || null,
        issue_date: body.issue_date || null,
        expiration_date: body.expiration_date || null,
        credential_id:
          body.credential_id?.trim() || null,
        credential_url:
          body.credential_url?.trim() || null,
      })
      .eq('id', certificateId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ certificate })
  } catch (error) {
    console.error('PUT certificate error:', error)

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
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

    const { searchParams } = new URL(request.url)
    const certificateId = searchParams.get('certificateId')

    if (!certificateId) {
      return NextResponse.json(
        { error: 'certificateId is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('user_certificates')
      .delete()
      .eq('id', certificateId)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Certificate deleted',
    })
  } catch (error) {
    console.error('DELETE certificate error:', error)

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}