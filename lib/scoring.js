/**
 * Mapping to normalize different skill category formats (e.g. from database, LLM, or user manual inputs)
 * into the 7 primary scoring categories + 1 other category.
 */
const CATEGORY_MAP = {
  'technical skills': 'technical',
  'technical': 'technical',
  
  'communication skills': 'communication',
  'communication': 'communication',
  
  'soft skills': 'softSkills',
  'soft_skills': 'softSkills',
  'softskills': 'softSkills',
  
  'language skills': 'language',
  'language': 'language',
  'languages': 'language',
  
  'leadership and management skills': 'leadership',
  'leadership and management': 'leadership',
  'leadership': 'leadership',
  
  'tools and software': 'tools',
  'tools': 'tools',
  
  'domain or industry knowledge': 'domainKnowledge',
  'domain knowledge': 'domainKnowledge',
  'domain_knowledge': 'domainKnowledge',
  
  'other relevant professional skills': 'other',
  'other': 'other'
}

/**
 * Calculates category scores and the overall readiness score (0 to 100)
 * based on user skills, proficiency levels, and evidence.
 * 
 * @param {Object} profile - User profile data (for potential compatibility)
 * @param {Array} userSkills - Array of user skills with global skill details, e.g. [{ proficiency_level, proficiency_score, evidence, skills: { name, category } }]
 * @returns {{ readinessScore: number, categoryScores: Object }}
 */
export function calculateReadinessScore(profile, userSkills) {
  const categoryScores = {
    technical: 0,
    communication: 0,
    softSkills: 0,
    language: 0,
    leadership: 0,
    tools: 0,
    domainKnowledge: 0
  }

  if (!userSkills || userSkills.length === 0) {
    return { readinessScore: 0, categoryScores }
  }

  // 1. Group skills by normalized category
  const grouped = {}
  userSkills.forEach(us => {
    const rawCat = us.skills?.category || 'other'
    const normalizedCat = CATEGORY_MAP[rawCat.toLowerCase().trim()] || 'other'
    
    if (!grouped[normalizedCat]) {
      grouped[normalizedCat] = []
    }
    grouped[normalizedCat].push(us)
  })

  // 2. Calculate category scores (max 100 per category)
  // Formula: categoryScore = (average_proficiency * 0.50) + (unique_skills * 6, max 30) + (evidence * 5, max 20)
  Object.keys(categoryScores).forEach(cat => {
    const skillsInCat = grouped[cat] || []
    if (skillsInCat.length === 0) {
      categoryScores[cat] = 0
      return
    }

    // A. Proficiency Contribution (50%): Average of proficiency scores (inferred if null)
    const totalProfScore = skillsInCat.reduce((sum, us) => {
      if (us.proficiency_score !== undefined && us.proficiency_score !== null) {
        return sum + Number(us.proficiency_score)
      }
      // Infer score from proficiency_level (1-5 range)
      const level = us.proficiency_level || 1
      if (level >= 5) return sum + 100 // Expert
      if (level >= 4) return sum + 75  // Advanced
      if (level >= 3) return sum + 50  // Intermediate
      return sum + 25                 // Beginner/Elementary
    }, 0)
    
    const avgProf = totalProfScore / skillsInCat.length
    const profContribution = (avgProf / 100) * 50

    // B. Skill Diversity Contribution (30%): Unique skills (each adds 6 pts, max 30)
    const uniqueSkills = new Set(skillsInCat.map(us => us.skills?.name?.toLowerCase().trim())).size
    const diversityContribution = Math.min(uniqueSkills * 6, 30)

    // C. Evidence Contribution (20%): Skills with CV evidence (each adds 5 pts, max 20)
    const evidenceCount = skillsInCat.filter(us => us.evidence && us.evidence.trim().length > 3).length
    const evidenceContribution = Math.min(evidenceCount * 5, 20)

    // Sum and cap at 100
    categoryScores[cat] = Math.min(100, Math.round(profContribution + diversityContribution + evidenceContribution))
  })

  // 3. Calculate weighted final readiness score
  // technical: 35%, communication: 15%, softSkills: 15%, language: 10%, leadership: 10%, tools: 10%, domainKnowledge: 5%
  const rawScore = 
    (categoryScores.technical || 0) * 0.35 +
    (categoryScores.communication || 0) * 0.15 +
    (categoryScores.softSkills || 0) * 0.15 +
    (categoryScores.language || 0) * 0.10 +
    (categoryScores.leadership || 0) * 0.10 +
    (categoryScores.tools || 0) * 0.10 +
    (categoryScores.domainKnowledge || 0) * 0.05

  const readinessScore = Math.min(100, Math.max(0, Math.round(rawScore)))

  return { readinessScore, categoryScores }
}

/**
 * Shared database helper to recalculate user's readiness score and update profiles table.
 * Fetches all necessary user skills and global skill category properties.
 * 
 * @param {Object} supabase - Supabase server/browser client instance
 * @param {string} userId - User ID to compute the score for
 * @returns {Promise<{ readinessScore: number, categoryScores: Object } | null>}
 */
export async function updateReadinessScore(supabase, userId) {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        user_skills (
          id,
          proficiency_level,
          proficiency_score,
          evidence,
          source,
          skills (
            id,
            name,
            category
          )
        )
      `)
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error('Error fetching profile for score update:', profileError)
      return null
    }

    const { readinessScore, categoryScores } = calculateReadinessScore(profile, profile.user_skills || [])

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        readiness_score: readinessScore,
        category_scores: categoryScores,
        score_calculated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error saving updated readiness score:', updateError)
    }

    return { readinessScore, categoryScores }
  } catch (err) {
    console.error('Failed to run updateReadinessScore:', err)
    return null
  }
}
