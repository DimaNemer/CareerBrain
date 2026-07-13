import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const VALID_LEVELS = [1, 2, 3, 4, 5]

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

    const { data: userSkills, error } = await supabase
      .from('user_skills')
      .select(`
        id,
        proficiency_level,
        source,
        skills (
          id,
          name,
          category
        )
      `)
        .eq('user_id', user.id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      skills: userSkills || [],
    })
  } catch (error) {
    console.error('GET profile skills error:', error)

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
    const category = body.category?.trim() || 'Other'
    const proficiencyLevel = Number(body.proficiency_level)

    if (!name) {
      return NextResponse.json(
        { error: 'Skill name is required' },
        { status: 400 }
      )
    }

    if (!VALID_LEVELS.includes(proficiencyLevel)) {
      return NextResponse.json(
        { error: 'Select a valid proficiency level' },
        { status: 400 }
      )
    }

    const { data: existingSkill, error: findError } =
      await supabase
        .from('skills')
        .select('id, name, category')
        .ilike('name', name)
        .maybeSingle()

    if (findError) {
      return NextResponse.json(
        { error: findError.message },
        { status: 500 }
      )
    }

    let skill = existingSkill

    if (!skill) {
      const { data: newSkill, error: createError } =
        await supabase
          .from('skills')
          .insert({
            name,
            category,
          })
          .select('id, name, category')
          .single()

      if (createError) {
        return NextResponse.json(
          { error: createError.message },
          { status: 500 }
        )
      }

      skill = newSkill
    }

    const { data: existingUserSkill } = await supabase
      .from('user_skills')
      .select('id, source')
      .eq('user_id', user.id)
      .eq('skill_id', skill.id)
      .maybeSingle()

    if (existingUserSkill) {
      return NextResponse.json(
        { error: 'This skill is already in your profile' },
        { status: 409 }
      )
    }

    const { data: userSkill, error: insertError } =
      await supabase
        .from('user_skills')
        .insert({
          user_id: user.id,
          skill_id: skill.id,
          proficiency_level: proficiencyLevel,
          source: 'Manual',
        })
        .select(`
          id,
          proficiency_level,
          source,
          skills (
            id,
            name,
            category
          )
        `)
        .single()

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { skill: userSkill },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST profile skill error:', error)

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
    const userSkillId = searchParams.get('userSkillId')

    if (!userSkillId) {
      return NextResponse.json(
        { error: 'userSkillId is required' },
        { status: 400 }
      )
    }

    const { data: userSkill } = await supabase
      .from('user_skills')
      .select('id, source')
      .eq('id', userSkillId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!userSkill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      )
    }

    if (userSkill.source === 'Project') {
      return NextResponse.json(
        {
          error:
            'Project-verified skills cannot be removed manually',
        },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('user_skills')
      .delete()
      .eq('id', userSkillId)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Skill removed',
    })
  } catch (error) {
    console.error('DELETE profile skill error:', error)

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}