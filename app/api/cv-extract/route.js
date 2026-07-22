import { createClient } from '@/lib/supabase-server';
import { extractTextFromPdf } from '@/lib/pdf-parser';
import { extractCvData } from '@/lib/ai';
import { syncGlobalSkills, syncUserSkills } from '@/lib/skills';
import { updateReadinessScore } from '@/lib/scoring';
import { NextResponse } from 'next/server';
import { CV_STORAGE_BUCKET } from '@/lib/cv-upload';

export async function POST(request) {
  const supabase = await createClient();
  let upload = null;

  try {
    // Get authenticated user from request cookies
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { uploadId } = body;

    // Get specific or latest pending CV upload for the user
    if (uploadId) {
      const { data, error } = await supabase
        .from('cv_uploads')
        .select('*')
        .eq('id', uploadId)
        .eq('user_id', user.id)
        .single();
      if (!error && data) {
        upload = data;
      }
    }

    if (!upload) {
      const { data, error } = await supabase
        .from('cv_uploads')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'Processing')
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .single();
      if (!error && data) {
        upload = data;
      }
    }

    if (!upload) {
      return NextResponse.json({ error: 'No pending CV upload found.' }, { status: 404 });
    }

    // Update step: Download PDF and Extract text
    await supabase
      .from('cv_uploads')
      .update({ processing_step: 'Extracting text' })
      .eq('id', upload.id);

    // Download the PDF from Supabase Storage
    const storagePath = upload.file_url.replace(`${CV_STORAGE_BUCKET}/`, '');
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(CV_STORAGE_BUCKET)
      .download(storagePath);

    if (downloadError || !fileData) {
      throw new Error('Failed to download the CV file.');
    }

    // Convert Blob to Buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF
    const text = await extractTextFromPdf(buffer);
    if (!text || text.trim().length === 0) {
      throw new Error('Text extraction from CV returned empty content.');
    }

    // Update step: AI analyzing CV
    await supabase
      .from('cv_uploads')
      .update({ processing_step: 'AI analyzing CV' })
      .eq('id', upload.id);

    // Call LLM to parse CV data
    const cvData = await extractCvData(text);
    if (!cvData || (typeof cvData !== 'object')) {
      throw new Error('AI analysis failed or returned invalid response format.');
    }

    // Update step: Syncing skills
    await supabase
      .from('cv_uploads')
      .update({ processing_step: 'Syncing skills' })
      .eq('id', upload.id);

    // Sync skills using structured format
    const combinedSkills = [];
    if (cvData.skills && Array.isArray(cvData.skills)) {
      const seen = new Set();
      cvData.skills.forEach(s => {
        if (s.name) {
          const normName = s.name.trim().toLowerCase();
          if (!seen.has(normName)) {
            seen.add(normName);
            combinedSkills.push({
              name: s.name.trim(),
              category: s.category || 'Other relevant professional skills',
              proficiency: s.proficiency || 'Beginner',
              proficiencyScore: Number(s.proficiencyScore) || 25,
              evidence: s.evidence || ''
            });
          }
        }
      });
    }

    // Clean up previous CV skills to allow correct re-uploads without duplicates
    const { error: deleteError } = await supabase
      .from('user_skills')
      .delete()
      .eq('user_id', user.id)
      .eq('source', 'CV');

    if (deleteError) {
      throw new Error(`Failed to clean previous CV skills: ${deleteError.message}`);
    }

    const resolvedGlobalSkills = await syncGlobalSkills(combinedSkills);
    await syncUserSkills(user.id, resolvedGlobalSkills, combinedSkills, 'CV');

    // Update step: Calculating readiness score
    await supabase
      .from('cv_uploads')
      .update({ processing_step: 'Calculating readiness score' })
      .eq('id', upload.id);

    // Recalculate and update the user's readiness score in public.profiles table
    await updateReadinessScore(supabase, user.id);

    // Update CV upload status to Completed
    await supabase
      .from('cv_uploads')
      .update({ status: 'Completed', extracted_data: cvData, processing_step: 'Completed' })
      .eq('id', upload.id);

    return NextResponse.json({ success: true, data: cvData }, { status: 200 });
  } catch (err) {
    console.error('CV Extraction Error:', err);
    
    if (upload && upload.id) {
      await supabase
        .from('cv_uploads')
        .update({ status: 'Failed', error_message: err.message || 'Processing failed' })
        .eq('id', upload.id);
    }

    return NextResponse.json({ error: err.message || 'Processing failed' }, { status: 500 });
  }
}
