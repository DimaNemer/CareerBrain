import { createClient } from '@/lib/supabase-server'
import { pipeline } from '@xenova/transformers'

export async function extractSkillsWithAI(opportunityId, jobDescription) {
  const supabase = await createClient()

  try {
    console.log(`[Local Vector Engine] Processing footprint for ID: ${opportunityId}`)

    // Strip out markup blocks
    const cleanContext = jobDescription.replace(/<[^>]*>/g, '').substring(0, 600)

    // 1. Core localized execution footprint inside server memory
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
    const output = await extractor(cleanContext, { pooling: 'mean', normalize: true })
    const jobVector = Array.from(output.data)

    // 2. Query your Supabase pgvector schema with a flexible threshold
    const { data: matchedSkills, error: rpcError } = await supabase.rpc(
      'match_skills',
      {
        query_embedding: jobVector,
        match_threshold: 0.01, // Captures close semantic variances perfectly
        match_count: 4         
      }
    )

    if (rpcError) {
      console.error(`❌ Semantic search crashed for job reference ${opportunityId}:`, rpcError.message)
      return
    }

    if (!matchedSkills || matchedSkills.length === 0) {
      console.log(`⚠️ No skill matches found for job ${opportunityId}. Verify your public.skills table has data!`)
      return
    }

    // 3. Map values with dynamically calculated weights based on similarity score
    const rowsToInsert = matchedSkills.map(skill => {
      // Scale weight cleanly from 1 to 5 based on proximity matrix values
      const calculatedWeight = Math.min(Math.max(Math.round(skill.similarity * 10), 1), 5)
      const checkMandatory = skill.similarity > 0.15

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
      console.error(`❌ Failed tracking layout injection for ${opportunityId}:`, insertError.message)
    } else {
      console.log(`🔥 [Local Vector Success] Linked ${rowsToInsert.length} skill badges to job ${opportunityId}`)
    }

  } catch (error) {
    console.error(`Local engine exception hit for ID ${opportunityId}:`, error.message)
  }
}