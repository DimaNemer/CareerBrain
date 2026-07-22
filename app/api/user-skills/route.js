import { createClient } from '@/lib/supabase-server'
import { updateReadinessScore } from '@/lib/scoring'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { skillName, category, proficiency_level, source } = await request.json()
    if (!skillName) return NextResponse.json({ error: 'Skill name required' }, { status: 400 })

    const normalizedName = skillName.trim()

    // Find or create in global skills
    let { data: globalSkill } = await supabase
      .from('skills')
      .select('id')
      .ilike('name', normalizedName)
      .single()

    if (!globalSkill) {
      const { data: newSkill, error: insertError } = await supabase
        .from('skills')
        .insert({ name: normalizedName, category: category || 'Other' })
        .select('id')
        .single()
      
      if (insertError) throw insertError
      globalSkill = newSkill
    }

    // Insert into user_skills
    const { data: userSkill, error: usError } = await supabase
      .from('user_skills')
      .insert({
        user_id: user.id,
        skill_id: globalSkill.id,
        proficiency_level: Number(proficiency_level) || 1,
        source: source || 'Manual'
      })
      .select(`id, proficiency_level, source, skills(name, category)`)
      .single()

    if (usError) {
      if (usError.code === '23505') { // Unique violation
        return NextResponse.json({ error: 'Skill already added' }, { status: 400 })
      }
      throw usError
    }

    await updateReadinessScore(supabase, user.id)

    return NextResponse.json({ userSkill }, { status: 201 })
  } catch (err) {
    console.error('Add skill error:', err)
    return NextResponse.json({ error: 'Failed to add skill' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { id, proficiency_level } = await request.json()
    
    // Ensure the user_skill belongs to the user
    const { data: existing, error: verifyError } = await supabase
      .from('user_skills')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
      
    if (verifyError || !existing) return NextResponse.json({ error: 'Skill not found' }, { status: 404 })

    const { error: updateError } = await supabase
      .from('user_skills')
      .update({ proficiency_level: Number(proficiency_level) || 1 })
      .eq('id', id)

    if (updateError) throw updateError

    await updateReadinessScore(supabase, user.id)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('Update skill error:', err)
    return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const { error: deleteError } = await supabase
      .from('user_skills')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) throw deleteError

    await updateReadinessScore(supabase, user.id)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('Delete skill error:', err)
    return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 })
  }
}
