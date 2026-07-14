import { createClient } from '@/lib/supabase-server'

/**
 * Finds existing skills in the global table (case-insensitive)
 * and inserts any missing skills.
 * @param {Array<{name: string, category: string}>} extractedSkills 
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
export async function syncGlobalSkills(extractedSkills) {
  const supabase = await createClient()

  if (extractedSkills.length === 0) return []

  // Fetch all global skills to perform case-insensitive local lookup
  const { data: allGlobalSkills, error: fetchError } = await supabase
    .from('skills')
    .select('id, name')

  if (fetchError) {
    console.error('Error fetching global skills:', fetchError)
    throw new Error('Failed to fetch existing skills.')
  }

  // Map lowercase name to skill record
  const globalSkillsMap = {}
  allGlobalSkills.forEach(s => {
    globalSkillsMap[s.name.toLowerCase().trim()] = s
  })

  const resolvedSkills = []
  const toInsert = []

  extractedSkills.forEach(s => {
    const normName = s.name.toLowerCase().trim()
    if (globalSkillsMap[normName]) {
      resolvedSkills.push(globalSkillsMap[normName])
    } else {
      // Avoid duplicate insert objects
      if (!toInsert.some(item => item.name.toLowerCase().trim() === normName)) {
        toInsert.push({
          name: s.name.trim(),
          category: s.category || 'Other'
        })
      }
    }
  })

  // Insert missing skills
  if (toInsert.length > 0) {
    const { data: insertedSkills, error: insertError } = await supabase
      .from('skills')
      .insert(toInsert)
      .select('id, name')

    if (insertError) {
      console.error('Error inserting global skills:', insertError)
    } else if (insertedSkills) {
      resolvedSkills.push(...insertedSkills)
    }
  }

  return resolvedSkills
}

function mapProficiencyToLevel(proficiency) {
  const p = String(proficiency || '').toLowerCase().trim()
  if (p === 'expert') return 5
  if (p === 'advanced') return 4
  if (p === 'intermediate') return 3
  return 1 // Beginner / Default
}

/**
 * Maps the extracted skills to the user's profile.
 * Avoids duplicate user_skills entries.
 * @param {string} userId 
 * @param {Array<{id: string, name: string}>} resolvedGlobalSkills 
 * @param {Array<{name: string, proficiency?: string, proficiency_level?: number, proficiencyScore?: number, evidence?: string}>} originalSkills 
 * @param {string} source - default 'CV'
 */
export async function syncUserSkills(userId, resolvedGlobalSkills, originalSkills, source = 'CV') {
  const supabase = await createClient()

  // Fetch user's current skills
  const { data: currentUserSkills, error: fetchUserError } = await supabase
    .from('user_skills')
    .select('id, skill_id')
    .eq('user_id', userId)

  if (fetchUserError) {
    console.error('Error fetching user skills:', fetchUserError)
    throw new Error('Failed to fetch user skills.')
  }

  const existingSkillIds = new Set(currentUserSkills.map(us => us.skill_id))

  const toInsert = []

  // Create lookup for proficiency details
  const nameToSkillDetails = {}
  for (const s of originalSkills) {
    const details = {
      level: s.proficiency_level || mapProficiencyToLevel(s.proficiency),
      score: Number(s.proficiencyScore) || null,
      evidence: s.evidence || null
    }
    nameToSkillDetails[s.name.toLowerCase()] = details
  }

  for (const globalSkill of resolvedGlobalSkills) {
    if (!existingSkillIds.has(globalSkill.id)) {
      const details = nameToSkillDetails[globalSkill.name.toLowerCase()] || { level: 1, score: null, evidence: null }
      toInsert.push({
        user_id: userId,
        skill_id: globalSkill.id,
        proficiency_level: details.level,
        proficiency_score: details.score,
        evidence: details.evidence,
        source: source
      })
    }
  }

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('user_skills')
      .insert(toInsert)

    if (insertError) {
      console.error('Error inserting user skills:', insertError)
      throw new Error('Failed to insert user skills.')
    }
  }
}
