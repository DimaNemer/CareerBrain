import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { limited } = rateLimit(`applied-list:${user.id}`, 20, 60000)
    if (limited) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { data, error } = await supabase
      .from('applied_opportunities')
      .select('opportunity_id, applied_at')
      .eq('user_id', user.id)

    if (error) {
      console.error('Failed to fetch applied jobs:', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ applied: data || [] }, { status: 200 })
  } catch (err) {
    console.error('GET /api/opportunities/applied error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { limited } = rateLimit(`applied-add:${user.id}`, 10, 60000)
    if (limited) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    let opportunityId
    try {
      const body = await request.json()
      opportunityId = body.opportunity_id
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (!opportunityId) {
      return NextResponse.json({ error: 'opportunity_id required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('applied_opportunities')
      .insert({ user_id: user.id, opportunity_id: opportunityId })

    if (error && !error.message?.includes('duplicate') && !error.message?.includes('unique') && !error.message?.includes('violates')) {
      console.error('Failed to mark as applied:', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Marked as applied' }, { status: 201 })
  } catch (err) {
    console.error('POST /api/opportunities/applied error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { limited } = rateLimit(`applied-remove:${user.id}`, 10, 60000)
    if (limited) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    const opportunityId = searchParams.get('opportunity_id')

    if (!opportunityId) {
      return NextResponse.json({ error: 'opportunity_id required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('applied_opportunities')
      .delete()
      .eq('user_id', user.id)
      .eq('opportunity_id', opportunityId)

    if (error) {
      console.error('Failed to remove applied marker:', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Removed applied marker' }, { status: 200 })
  } catch (err) {
    console.error('DELETE /api/opportunities/applied error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
