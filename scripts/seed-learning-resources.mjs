import { createClient } from "@supabase/supabase-js";
import { seedResources } from "../lib/data/seed-resources.js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL)  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Fix: validate URL format before attempting to insert (catches typos early,
// before they hit the DB and produce a less obvious constraint error)
function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

async function seed() {
  console.log("Seeding learning_resources...\n");

  // Load all skills once into a Map (avoids one query per resource — N+1 fix)
  const { data: allSkills, error: skillsError } = await supabase
    .from("skills")
    .select("id, name");

  if (skillsError) throw new Error(`Failed to load skills: ${skillsError.message}`);

  const skillMap = new Map(allSkills.map((s) => [s.name.toLowerCase(), s.id]));

  // Build the full list of rows in memory first, then send as ONE bulk upsert
  // instead of one HTTP request per resource inside a loop (N+1 fix)
  const rows = [];
  let skipped = 0;

  for (const resource of seedResources) {
    const skillId = skillMap.get(resource.skill_name.toLowerCase());

    if (!skillId) {
      console.warn(`SKIP — skill not found: "${resource.skill_name}"`);
      skipped++;
      continue;
    }

    if (!isValidUrl(resource.url)) {
      console.warn(`SKIP — invalid URL for "${resource.title}": ${resource.url}`);
      skipped++;
      continue;
    }

    rows.push({
      skill_id:         skillId,
      title:            resource.title,
      url:              resource.url,
      provider:         resource.provider,
      // normalize case so it always matches the DB CHECK constraints
      resource_type:    resource.resource_type?.toLowerCase()    ?? "course",
      difficulty_level: resource.difficulty_level?.toLowerCase() ?? "beginner",
      is_free:          resource.is_free,
      duration_hours:   resource.duration_hours ?? null,
      priority:         resource.priority        ?? 5,
      description:      resource.description     ?? null,
    });
  }

  if (rows.length === 0) {
    console.log("Nothing to seed — all rows were skipped.");
    return;
  }

  const { data, error } = await supabase
    .from("learning_resources")
    .upsert(rows, { onConflict: "url" })
    .select("id");

  if (error) {
    console.error(`\nBulk upsert failed: ${error.message}`);
    return;
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Seeded:  ${data.length}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

seed();
