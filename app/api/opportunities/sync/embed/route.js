import { NextResponse } from 'next/server'
import { embedAllSkills } from '@/lib/embed-skills'

export async function POST() {
  try {
    await embedAllSkills()
    return NextResponse.json({ message: 'Master skills seeded' }, { status: 200 })
  } catch (err) {
    console.error('Embed error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
