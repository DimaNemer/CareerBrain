import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

/**
 * GET /api/v1/opportunities/[id]/gap-roadmap
 * Generates a STRICTLY USER-SPECIFIC action plan for a specific job opportunity.
 * Maps missing skills to tailored learning resources and matches open CollabSpace 
 * projects, enabling a direct application flow for the interested user profile.
 */
export async function GET(request, { params }) {
  const opportunityId = params.id;

  try {
    // 1. Initialize Supabase Client and Authenticate the current User
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { 
          error: { 
            code: 'UNAUTHORIZED', 
            message: 'Authentication is required to view your personalized roadmap.', 
            status: 401 
          } 
        },
        { status: 401 }
      );
    }

    // 2. Fetch USER-SPECIFIC missing skills for this exact job (From matching logic dataset)
    const { data: missingSkills, error: gapError } = await supabase
      .from('opportunity_missing_skills')
      .select('skill_id, skill_name, priority')
      .eq('opportunity_id', opportunityId)
      .eq('user_id', user.id);

    if (gapError) {
      throw gapError;
    }

    // If the user's profile is a 100% match, return a clean state
    if (!missingSkills || missingSkills.length === 0) {
      return NextResponse.json({
        opportunity_id: opportunityId,
        user_id: user.id,
        match_status: "PERFECT_MATCH",
        message: "Your profile is fully compatible with this job! No skill gaps detected.",
        roadmap: []
      });
    }

    // 3. Construct the dynamic Roadmap loop for each identified skill gap
    const roadmap = await Promise.all(
      missingSkills.map(async (skill) => {
        
        // A. Fetch curated courses & lessons for this specific missing skill
        const { data: resources } = await supabase
          .from('learning_resources')
          .select('id, title, provider, url, resource_type, is_free')
          .eq('skill_id', skill.skill_id)
          .limit(3);

        // B. Fetch open CollabSpace projects that urgently need this missing skill
        const { data: matchedProjects } = await supabase
          .from('projects')
          .select('id, title, description, owner_id, status')
          .contains('roles_needed_skills', [skill.skill_name])
          .eq('status', 'open')
          .limit(2);

        // C. Formulate directional metadata for the Frontend to flag the user as "Interested"
        const projectsWithApplyFlow = (matchedProjects || []).map(project => ({
          ...project,
          application_meta: {
            user_profile_status: "INTERESTED",
            can_apply: project.owner_id !== user.id,
            join_api_endpoint: `/api/v1/projects/${project.id}/join-requests`
          }
        }));

        return {
          skill_id: skill.skill_id,
          skill_name: skill.skill_name,
          priority: skill.priority,
          learning_resources: resources || [],
          suggested_collab_projects: projectsWithApplyFlow
        };
      })
    );

    // 4. Return the fully integrated, user-centric response
    return NextResponse.json({
      opportunity_id: opportunityId,
      user_id: user.id,
      match_status: "USER_GAP_ROADMAP_GENERATED",
      total_missing_skills: missingSkills.length,
      roadmap: roadmap
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: { 
          code: 'SERVER_ERROR', 
          message: error.message, 
          status: 500 
        } 
      },
      { status: 500 }
    );
  }
}