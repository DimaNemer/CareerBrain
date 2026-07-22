import { createClient } from '@/lib/supabase-server'
import { pipeline } from '@xenova/transformers'

// Reuse extractor to avoid re-initializing model repeatedly
let extractorPromise = null
async function getExtractor() {
  if (!extractorPromise) extractorPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
  return extractorPromise
}

const DEFAULT_MASTER_SKILLS = [
  // Software & Engineering
  'React',
  'JavaScript',
  'Node.js',
  'Python',
  'TypeScript',
  'SQL',
  'AWS',
  'Docker',
  'HTML',
  'CSS',
  'Product Management',
  'Data Science',
  'Go',
  'Rust',
  'DevOps',
  'Kubernetes',
  'GraphQL',
  'API Development',
  'Test Automation',
  'CI/CD',
  // Healthcare & Clinical
  'Healthcare',
  'Patient Care',
  'Clinical',
  'Medical',
  'Therapy',
  'Pediatrics',
  'Diagnostics',
  'Treatment Planning',
  'Mental Health',
  'Nursing',
  // Education & Training
  'Education',
  'Teaching',
  'Training',
  'Curriculum Development',
  'Instructional Design',
  'Public Speaking',
  'Coaching',
  // General Professional
  'Communication',
  'Leadership',
  'Project Management',
  'Research',
  'Data Analysis',
  'Writing',
  'Customer Service',
  'Operations',
  'Negotiation',
  'Strategic Planning',
  'Team Management',
  'Budgeting',
  'Marketing',
  'Sales',
  'Human Resources',
  'Compliance',
  'Risk Management',
  'Vendor Management'
]

/**
 * Ensures standard master skills exist and that each has a 384-dimension embedding.
 */
export async function embedAllSkills() {
  const supabase = await createClient()

  console.log('⏳ Ensuring master skills exist and embeddings are populated...')

  const { data: existingSkills, error: fetchError } = await supabase
    .from('skills')
    .select('id, name, embedding')

  if (fetchError) {
    console.error('Failed querying skills table:', fetchError.message)
    return
  }

  const existingNames = new Set(existingSkills.map((skill) => skill.name))
  const missingNames = DEFAULT_MASTER_SKILLS.filter((name) => !existingNames.has(name))

  if (missingNames.length > 0) {
    const { error: insertError } = await supabase
      .from('skills')
      .insert(missingNames.map((name) => ({ name })))

    if (insertError) {
      console.error('Failed inserting master skills:', insertError.message)
      return
    }
    console.log(`✅ Inserted ${missingNames.length} default master skills.`)
  }

  const { data: allSkills, error: allSkillsError } = await supabase
    .from('skills')
    .select('id, name, embedding')
    .in('name', DEFAULT_MASTER_SKILLS)

  if (allSkillsError) {
    console.error('Failed fetching master skill records:', allSkillsError.message)
    return
  }

  const skillsToEmbed = allSkills.filter((skill) => {
    return !Array.isArray(skill.embedding) || skill.embedding.length !== 384
  })

  if (skillsToEmbed.length === 0) {
    console.log('✅ All master skills already have valid embeddings.')
    return
  }

  console.log(`⏳ Building local vectors for ${skillsToEmbed.length} master skills...`)

  try {
    const extractor = await getExtractor()
    const updates = []

    for (const skill of skillsToEmbed) {
      const output = await extractor(skill.name, { pooling: 'mean', normalize: true })
      updates.push({ id: skill.id, embedding: Array.from(output.data) })
    }

    const { error: batchError } = await supabase.from('skills').upsert(updates, { onConflict: 'id' })
    if (batchError) {
      console.error('Failed to batch-update skill embeddings:', batchError.message)
    } else {
      console.log(`Seeded embeddings for ${updates.length} master skills`)
    }
  } catch (err) {
    console.error('Local vector seeding engine hit a roadblock:', err.message)
  }
}