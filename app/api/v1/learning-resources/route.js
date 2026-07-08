import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

/**
 * GET /api/v1/learning-resources?skill_id=...
 * Fetch all learning resources associated with a specific skill
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const skillId = searchParams.get('skill_id');

    // Validate that skill_id query parameter is provided
    if (!skillId) {
      return NextResponse.json(
        { 
          error: { 
            code: 'VALIDATION_FAILED', 
            message: 'The skill_id parameter is required for this search.', 
            status: 422 
          } 
        },
        { status: 422 }
      );
    }

    // Initialize Supabase client and fetch authenticated user (Security NFR)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { 
          error: { 
            code: 'UNAUTHORIZED', 
            message: 'Authentication is required to access these learning resources.', 
            status: 401 
          } 
        },
        { status: 401 }
      );
    }

    // Query learning resources filtered by the specified skill_id
    const { data: resources, error: dbError } = await supabase
      .from('learning_resources')
      .select('id, title, provider, url, resource_type, is_free')
      .eq('skill_id', skillId);

    if (dbError) {
      throw dbError;
    }

    // Return successfully structured JSON response
    return NextResponse.json({
      skill_id: skillId,
      count: resources.length,
      resources: resources
    });

  } catch (error) {
    // Global catch block using the team's standard error response format
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
}لهف