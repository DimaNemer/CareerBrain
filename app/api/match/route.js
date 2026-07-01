import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized profile request rejected' }, { status: 401 });
    }

    const userId = user.id;

    // 2. Trigger lightning fast localized database calculation
    const { error: rpcError } = await supabase.rpc('calculate_user_job_matches', {
      target_user_id: userId
    });

    if (rpcError) throw rpcError;

    // 3. Query calculated structures dynamically to populate UI
    const { data: records, error: queryError } = await supabase
      .from('match_results')
      .select(`
        id,
        match_score,
        estimated_time_to_close,
        opportunities (
          id,
          title,
          company
        ),
        missing_skills:missing_skills(
          id,
          priority,
          required_level,
          skills:skill_id(name)
        )
      `)
      .eq('user_id', userId)
      .order('match_score', { ascending: false });

    if (queryError) throw queryError;

    return NextResponse.json({ success: true, data: records }, { status: 200 });

  } catch (error) {
    console.error('Server Calculation Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}