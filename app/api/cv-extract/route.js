import { createClient } from '@/lib/supabase-server'
import { extractTextFromPdf } from '@/lib/pdf-parser'
import { extractCvData } from '@/lib/ai'
import {
  syncGlobalSkills,
  syncUserSkills,
} from '@/lib/skills'
import { updateReadinessScore } from '@/lib/scoring'
import { NextResponse } from 'next/server'
import {
  CV_STORAGE_BUCKET,
} from '@/lib/cv-upload'

export async function POST(request) {
  const supabase = await createClient()

  let upload = null
  let currentStep = 'Starting'

  try {
    // --------------------------------------------------
    // 1. Authenticate user
    // --------------------------------------------------
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          error: 'Not authenticated',
        },
        {
          status: 401,
        }
      )
    }

    // --------------------------------------------------
    // 2. Read request body
    // --------------------------------------------------
    const body = await request
      .json()
      .catch(() => ({}))

    const { uploadId } = body

    // --------------------------------------------------
    // 3. Load requested CV upload
    // --------------------------------------------------
    if (uploadId) {
      const {
        data,
        error,
      } = await supabase
        .from('cv_uploads')
        .select('*')
        .eq('id', uploadId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!error && data) {
        upload = data
      }
    }

    // If no explicit upload was found,
    // load the latest processing upload.
    if (!upload) {
      const {
        data,
        error,
      } = await supabase
        .from('cv_uploads')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'Processing')
        .order('uploaded_at', {
          ascending: false,
        })
        .limit(1)
        .maybeSingle()

      if (!error && data) {
        upload = data
      }
    }

    if (!upload) {
      return NextResponse.json(
        {
          error:
            'No pending CV upload found.',
        },
        {
          status: 404,
        }
      )
    }

    // --------------------------------------------------
    // 4. Extract PDF text
    // --------------------------------------------------
    currentStep = 'Extracting text'

    await supabase
      .from('cv_uploads')
      .update({
        processing_step: currentStep,
        error_message: null,
      })
      .eq('id', upload.id)

    const storagePath =
      upload.file_url.includes(
        `${CV_STORAGE_BUCKET}/`
      )
        ? upload.file_url
            .split(
              `${CV_STORAGE_BUCKET}/`
            )
            .pop()
        : upload.file_url

    if (!storagePath) {
      throw new Error(
        'Invalid CV storage path.'
      )
    }

    const {
      data: fileData,
      error: downloadError,
    } = await supabase.storage
      .from(CV_STORAGE_BUCKET)
      .download(storagePath)

    if (downloadError || !fileData) {
      console.error(
        'Storage download error:',
        downloadError
      )

      throw new Error(
        `Failed to download the CV file from storage: ${
          downloadError?.message ||
          'File missing'
        }`
      )
    }

    const arrayBuffer =
      await fileData.arrayBuffer()

    const buffer =
      Buffer.from(arrayBuffer)

    const text =
      await extractTextFromPdf(buffer)

    if (
      !text ||
      text.trim().length === 0
    ) {
      throw new Error(
        'Could not extract text from this PDF. Please make sure the uploaded file is a PDF with selectable text and not an image-only scan.'
      )
    }

    // --------------------------------------------------
    // 5. Analyze CV using Gemini
    // --------------------------------------------------
    currentStep = 'AI analyzing CV'

    await supabase
      .from('cv_uploads')
      .update({
        processing_step: currentStep,
      })
      .eq('id', upload.id)

    const cvData =
      await extractCvData(text)

    if (
      !cvData ||
      typeof cvData !== 'object' ||
      Array.isArray(cvData)
    ) {
      throw new Error(
        'AI analysis failed or returned an invalid response format.'
      )
    }

    // --------------------------------------------------
    // 6. Sync skills
    // --------------------------------------------------
    currentStep = 'Syncing skills'

    await supabase
      .from('cv_uploads')
      .update({
        processing_step: currentStep,
      })
      .eq('id', upload.id)

    const combinedSkills = []

    if (
      Array.isArray(cvData.skills)
    ) {
      const seen = new Set()

      cvData.skills.forEach(skill => {
        if (
          !skill ||
          typeof skill.name !== 'string'
        ) {
          return
        }

        const cleanedName =
          skill.name.trim()

        if (!cleanedName) {
          return
        }

        const normalizedName =
          cleanedName.toLowerCase()

        if (
          seen.has(normalizedName)
        ) {
          return
        }

        seen.add(normalizedName)

        combinedSkills.push({
          name: cleanedName,

          category:
            skill.category ||
            'Other relevant professional skills',

          proficiency:
            skill.proficiency ||
            'Beginner',

          proficiencyScore:
            Number(
              skill.proficiencyScore
            ) || 25,

          evidence:
            skill.evidence || '',
        })
      })
    }

    // Remove old CV-derived skills
    const {
      error: deleteError,
    } = await supabase
      .from('user_skills')
      .delete()
      .eq('user_id', user.id)
      .eq('source', 'CV')

    if (deleteError) {
      throw new Error(
        `Failed to clean previous CV skills: ${deleteError.message}`
      )
    }

    const resolvedGlobalSkills =
      await syncGlobalSkills(
        combinedSkills
      )

    await syncUserSkills(
      user.id,
      resolvedGlobalSkills,
      combinedSkills,
      'CV'
    )

    // --------------------------------------------------
    // 7. Update profile
    // --------------------------------------------------
    currentStep =
      'Updating profile'

    await supabase
      .from('cv_uploads')
      .update({
        processing_step:
          currentStep,
      })
      .eq('id', upload.id)

    await updateReadinessScore(
      supabase,
      user.id
    )

    // --------------------------------------------------
    // 8. Complete upload
    // --------------------------------------------------
    currentStep = 'Completed'

    const {
      error: completionError,
    } = await supabase
      .from('cv_uploads')
      .update({
        status: 'Completed',
        processing_step:
          'Completed',
        extracted_data: cvData,
        error_message: null,
      })
      .eq('id', upload.id)

    if (completionError) {
      throw new Error(
        `Failed to finalize CV processing: ${completionError.message}`
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: cvData,
      },
      {
        status: 200,
      }
    )
  } catch (error) {
    console.error(
      'CV Extraction Error:',
      error
    )

    const message =
      error instanceof Error
        ? error.message
        : 'Processing failed'

    // Detect temporary Gemini/API
    // availability errors.
    const temporaryAiFailure =
      message.includes(
        'AI CV analysis is temporarily unavailable'
      ) ||
      message.includes('HTTP 429') ||
      message.includes('HTTP 500') ||
      message.includes('HTTP 502') ||
      message.includes('HTTP 503') ||
      message.includes('HTTP 504')

    const publicMessage =
      temporaryAiFailure
        ? 'AI CV analysis is temporarily unavailable. Please try again shortly.'
        : message

    if (upload?.id) {
      const {
        error: failureUpdateError,
      } = await supabase
        .from('cv_uploads')
        .update({
          status: 'Failed',

          // Keep the exact stage where
          // the failure happened.
          processing_step:
            currentStep,

          error_message:
            publicMessage,
        })
        .eq('id', upload.id)

      if (failureUpdateError) {
        console.error(
          'Failed to save CV processing error:',
          failureUpdateError.message
        )
      }
    }

    return NextResponse.json(
      {
        error: publicMessage,
        failedStep: currentStep,
      },
      {
        status:
          temporaryAiFailure
            ? 503
            : 500,
      }
    )
  }
}