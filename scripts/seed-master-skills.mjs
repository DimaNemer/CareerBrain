import 'dotenv/config'
import { createServiceClient } from '../lib/supabase-service.js'
import { pipeline } from '@xenova/transformers'

const DEFAULT_MASTER_SKILLS = [
  'React',
  'JavaScript',
  'Node.js',
  'Python',
  'Sales',
  'TypeScript',
  'SQL',
  'AWS',
  'Docker',
  'HTML',
  'CSS',
  'Product Management',
  'Data Science'
]

async function run() {
  const supabase = createServiceClient()

  console.log('⏳ Ensuring master skills exist and embeddings are populated...')

  const { data: existingSkills, error: fetchError } = await supabase
    .from('skills')
    .select('id, name, embedding')

  if (fetchError) {
    console.error('Failed querying skills table:', fetchError.message)
    process.exit(1)
  }

  const existingNames = new Set(existingSkills.map((skill) => skill.name))
  const missingNames = DEFAULT_MASTER_SKILLS.filter((name) => !existingNames.has(name))

  if (missingNames.length > 0) {
    const { error: insertError } = await supabase
      .from('skills')
      .insert(missingNames.map((name) => ({ name })))

    if (insertError) {
      console.error('Failed inserting master skills:', insertError.message)
      process.exit(1)
    }
    console.log(`✅ Inserted ${missingNames.length} default master skills.`)
  }

  const { data: allSkills, error: allSkillsError } = await supabase
    .from('skills')
    .select('id, name, embedding')
    .in('name', DEFAULT_MASTER_SKILLS)

  if (allSkillsError) {
    console.error('Failed fetching master skill records:', allSkillsError.message)
    process.exit(1)
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
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')

    for (const skill of skillsToEmbed) {
      const output = await extractor(skill.name, { pooling: 'mean', normalize: true })
      const embedding = Array.from(output.data)

      const { error: updateError } = await supabase
        .from('skills')
        .update({ embedding })
        .eq('id', skill.id)

      if (updateError) {
        console.error(`❌ Failed updating skill "${skill.name}":`, updateError.message)
      } else {
        console.log(`✅ Seeded embedding for master skill: "${skill.name}"`)
      }
    }

    console.log('🎉 Master skills successfully vectorized and saved.')
  } catch (err) {
    console.error('Local vector seeding engine hit a roadblock:', err.message)
    process.exit(1)
  }
}

run().catch((err) => {
  console.error('Seed script failed:', err)
  process.exit(1)
})
