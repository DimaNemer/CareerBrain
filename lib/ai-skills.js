import { createClient } from '@/lib/supabase-server'
import { pipeline } from '@xenova/transformers'

// Reuse a single extractor instance per worker/process lifecycle.
let extractorPromise = null
export async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
  }
  return extractorPromise
}

export async function extractSkillsWithAI(opportunityId, jobDescription) {
  const supabase = await createClient()

  try {
    // Strip out markup blocks
    const cleanContext = jobDescription.replace(/<[^>]*>/g, '').substring(0, 600)

    // 1. Core localized execution footprint inside server memory (reused extractor)
    const extractor = await getExtractor()
    const output = await extractor(cleanContext, { pooling: 'mean', normalize: true })
    const jobVector = Array.from(output.data)

    // 2. Query your Supabase pgvector schema with a flexible threshold
    const { data: matchedSkills, error: rpcError } = await supabase.rpc(
      'match_skills',
      {
        query_embedding: jobVector,
        match_threshold: 0.10, // Captures close semantic variances perfectly
        match_count: 4         
      }
    )

    if (rpcError) {
      console.error(`Semantic search failed for ${opportunityId}:`, rpcError.message)
      return
    }

    if (!matchedSkills || matchedSkills.length === 0) {
      console.log(`No skill matches for job ${opportunityId}`)
      return
    }

    // 3. Map values with dynamically calculated weights based on similarity score
    const rowsToInsert = matchedSkills.map(skill => {
      // Scale weight cleanly from 1 to 5 based on proximity matrix values
      const calculatedWeight = Math.min(Math.max(Math.round(skill.similarity * 10), 1), 5)
      const checkMandatory = skill.similarity > 0.30

      return {
        opportunity_id: opportunityId,
        skill_id: skill.id,
        importance_weight: calculatedWeight,
        is_mandatory: checkMandatory
      }
    })

    // 4. Commit rows cleanly into your junction table mapping structure
    const { error: insertError } = await supabase
      .from('opportunity_skills')
      .insert(rowsToInsert)

    if (insertError) {
      console.error(`Failed to insert skills for ${opportunityId}:`, insertError.message)
    }

  } catch (error) {
    console.error(`Local engine exception hit for ID ${opportunityId}:`, error.message)
  }
}