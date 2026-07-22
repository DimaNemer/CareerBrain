import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

const PAGE_LIMIT = 20;
const MAX_PAGE   = 100;
const MAX_SKILL_NAME_LENGTH = 100;

const isValidUUID = (str) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const skillId   = searchParams.get("skill_id")?.trim()   || null;
    const skillName = searchParams.get("skill_name")?.trim() || null;
    const rawPage   = parseInt(searchParams.get("page") || "1", 10);
    const page      = Math.min(Math.max(1, rawPage), MAX_PAGE);
    const from      = (page - 1) * PAGE_LIMIT;
    const to        = from + PAGE_LIMIT - 1;

    if (!skillId && !skillName) {
      return NextResponse.json(
        { error: { code: "VALIDATION_FAILED", message: "Provide skill_id or skill_name.", status: 422 } },
        { status: 422 }
      );
    }

    if (skillId && !isValidUUID(skillId)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_FAILED", message: "skill_id must be a valid UUID.", status: 422 } },
        { status: 422 }
      );
    }

    // Guard against abusively long query strings
    if (skillName && skillName.length > MAX_SKILL_NAME_LENGTH) {
      return NextResponse.json(
        { error: { code: "VALIDATION_FAILED", message: "skill_name is too long.", status: 422 } },
        { status: 422 }
      );
    }

    // Public endpoint — learning resources are public data, no auth required
    const supabase = await createClient();
    let resolvedSkillId = skillId;

    if (!resolvedSkillId && skillName) {
      // Exact (case-insensitive) match against the official skill names list —
      // kept intentionally strict rather than a %wildcard% search, since skill
      // names are a controlled vocabulary documented for the team (see README).
      const { data: skill, error } = await supabase
        .from("skills")
        .select("id")
        .ilike("name", skillName)
        .single();

      if (error || !skill) {
        return NextResponse.json(
          { error: { code: "SKILL_NOT_FOUND", message: `No skill found: "${skillName}".`, status: 404 } },
          { status: 404 }
        );
      }
      resolvedSkillId = skill.id;
    }

    const { data: resources, error: dbError, count } = await supabase
      .from("learning_resources")
      .select(
        "id, title, provider, url, resource_type, is_free, duration_hours, difficulty_level, priority, description",
        { count: "exact" }
      )
      .eq("skill_id", resolvedSkillId)
      .order("priority", { ascending: true  })
      .order("is_free",  { ascending: false })
      .range(from, to);

    if (dbError) throw dbError;

    return NextResponse.json({
      data: resources,
      meta: {
        skill_id:    resolvedSkillId,
        count:       resources.length,
        total:       count,
        page,
        total_pages: Math.ceil(count / PAGE_LIMIT),
      },
    });

  } catch (error) {
    console.error("[learning-resources] GET error:", error.message);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again.", status: 500 } },
      { status: 500 }
    );
  }
}
