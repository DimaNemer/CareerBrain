import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { embedAllSkills } from '@/lib/embed-skills'
import { rateLimit } from '@/lib/rate-limit'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { limited } = rateLimit(`embed:${user.id}`, 3, 60000)
    if (limited) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    await embedAllSkills()
    return NextResponse.json({ message: 'Master skills seeded' }, { status: 200 })
  } catch (err) {
    console.error('Embed error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
