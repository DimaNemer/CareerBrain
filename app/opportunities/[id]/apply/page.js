'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

import Link from 'next/link'
import {
  ArrowLeft,
  Briefcase,
  FileText,
  Send,
  AlertTriangle,
  Upload,
  X,
} from 'lucide-react'
import { Toaster, toast } from 'sonner'

export default function ApplyForJobPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [job, setJob] = useState(null)
 const [resumeFile, setResumeFile] = useState(null)
const [uploadedResumePath, setUploadedResumePath] =
  useState(null)
const [uploadingResume, setUploadingResume] =
  useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [existingApplication, setExistingApplication] =
  useState(null)

  const questions = Array.isArray(job?.job_application_questions)
  ? [...job.job_application_questions].sort(
      (a, b) =>
        (a.display_order ?? 0) -
        (b.display_order ?? 0)
    )
  : []

const coverLetterRequirement =
  job?.cover_letter_requirement || 'optional'

const showCoverLetter =
  coverLetterRequirement !== 'not_requested'

const coverLetterRequired =
  coverLetterRequirement === 'required'

const requireResume =
  job?.require_resume !== false

  useEffect(() => {
    async function loadJob() {
      try {
        const response = await fetch(`/api/jobs/${params.id}`)

        if (response.status === 401) {
          router.push('/login')
          return
        }

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Job not found')
        }

        if (!data.job?.is_employer_job) {
          throw new Error('This application page is only available for internal jobs')
        }

       setJob(data.job)

const applicationResponse = await fetch(
  `/api/jobs/${params.id}/apply`
)

if (applicationResponse.ok) {
  const applicationData =
    await applicationResponse.json()

  if (applicationData.has_applied) {
    setExistingApplication(
      applicationData.application
    )
  }
}

      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadJob()
  }, [params.id, router])

function updateAnswer(questionId, value) {
  setAnswers((currentAnswers) => ({
    ...currentAnswers,
    [questionId]: value,
  }))
}

function handleResumeSelection(event) {
  const file = event.target.files?.[0]

  if (!file) return

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]

  if (!allowedTypes.includes(file.type)) {
    toast.error(
      'Please upload a PDF, DOC, or DOCX file'
    )
    event.target.value = ''
    return
  }

  const maxFileSize = 5 * 1024 * 1024

  if (file.size > maxFileSize) {
    toast.error(
      'Resume must not be larger than 5 MB'
    )
    event.target.value = ''
    return
  }

  setResumeFile(file)
  setUploadedResumePath(null)
}
async function uploadResume() {
  if (!resumeFile) {
    return uploadedResumePath
  }

  setUploadingResume(true)

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error(
        'You must be logged in to upload a resume'
      )
    }

    const extension =
      resumeFile.name.split('.').pop()?.toLowerCase()

    const safeFileName =
      resumeFile.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .slice(0, 80)

    const filePath =
      `${user.id}/${crypto.randomUUID()}-${safeFileName}.${extension}`

    const { data, error } = await supabase.storage
      .from('resumes')
      .upload(filePath, resumeFile, {
        cacheControl: '3600',
        contentType: resumeFile.type,
        upsert: false,
      })

    if (error) {
      console.error(
        'Resume upload failed:',
        error
      )

      throw new Error(
        'Unable to upload your resume'
      )
    }

    setUploadedResumePath(data.path)

    return data.path
  } finally {
    setUploadingResume(false)
  }
}
  async function handleSubmit(event) {
    event.preventDefault()

 if (
  requireResume &&
  !resumeFile &&
  !uploadedResumePath
) {
  toast.error(
    'Please upload your resume before applying'
  )
  return
}

if (
  coverLetterRequired &&
  !coverLetter.trim()
) {
  toast.error(
    'A cover letter is required for this job'
  )
  return
}

for (const question of questions) {
  const answer = answers[question.id]

  if (
    question.is_required &&
    (
      answer === undefined ||
      answer === null ||
      String(answer).trim() === ''
    )
  ) {
    toast.error(
      `Please answer: ${question.question_text}`
    )

    return
  }
}

    setSubmitting(true)

    try {
      let resumePath = uploadedResumePath

if (requireResume && !resumePath) {
  resumePath = await uploadResume()
}
      const response = await fetch(`/api/jobs/${params.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      body: JSON.stringify({
cv_url:
  requireResume
    ? resumePath
    : null,
  cover_letter:
    showCoverLetter && coverLetter.trim()
      ? coverLetter.trim()
      : null,

  answers: questions
    .map((question) => ({
      question_id: question.id,
      answer_text:
        answers[question.id] !== undefined &&
        answers[question.id] !== null
          ? String(answers[question.id]).trim()
          : '',
    }))
    .filter(
      (answer) => answer.answer_text !== ''
    ),
}),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to submit application')
      }

      toast.success('Application submitted successfully')

      setTimeout(() => {
        router.push(`/opportunities/${params.id}`)
      }, 1000)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />

          <p className="text-slate-500">
            {error || 'Job not found'}
          </p>

          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to opportunities
          </Link>
        </div>
      </div>
    )
  }
  if (existingApplication) {
  return (
    <>
      <Toaster position="top-center" richColors />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-emerald-100 flex items-center justify-center">
            <FileText className="w-8 h-8 text-emerald-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Application submitted
          </h1>

          <p className="text-slate-500 mt-3">
            You have already applied for this job.
          </p>

          <div className="mt-5 inline-flex items-center rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 capitalize">
            Status: {existingApplication.status}
          </div>

          <Link
            href={`/opportunities/${params.id}`}
            className="mt-7 flex items-center justify-center gap-2 w-full px-5 py-3 rounded-2xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to job
          </Link>
        </div>
      </div>
    </>
  )
}

  return (
    <>
      <Toaster position="top-center" richColors />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20">
        <main className="max-w-[760px] mx-auto px-4 md:px-6 py-8 md:py-12">
          <Link
            href={`/opportunities/${params.id}`}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 font-medium mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to job
          </Link>

          <div className="bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-lg">
            <div className="mb-8">
              <div className="flex items-center gap-2 text-indigo-600 mb-3">
                <Briefcase className="w-5 h-5" />
                <span className="text-sm font-semibold">
                  Internal application
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                Apply for {job.title}
              </h1>

              <p className="text-sm text-slate-500 mt-2">
                {job.company || job.company_name || 'Employer'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
    {requireResume && (
  <div>
    <label
      htmlFor="resume"
      className="block text-sm font-semibold text-slate-700 mb-2"
    >
      Resume
      <span className="text-rose-500 ml-1">
        *
      </span>
    </label>

    {!resumeFile ? (
      <label
        htmlFor="resume"
        className="flex flex-col items-center justify-center gap-3 w-full px-6 py-8 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer transition-colors"
      >
        <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center">
          <Upload className="w-5 h-5 text-indigo-600" />
        </div>

        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">
            Upload your resume
          </p>

          <p className="text-xs text-slate-400 mt-1">
            PDF, DOC or DOCX — maximum 5 MB
          </p>
        </div>

        <input
          id="resume"
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleResumeSelection}
          className="hidden"
        />
      </label>
    ) : (
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-700 truncate">
              {resumeFile.name}
            </p>

            <p className="text-xs text-slate-400">
              {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setResumeFile(null)
            setUploadedResumePath(null)
          }}
          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          aria-label="Remove resume"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )}
  </div>
)}

             {showCoverLetter && (
  <div>
    <label
      htmlFor="cover_letter"
      className="block text-sm font-semibold text-slate-700 mb-2"
    >
      Cover letter

      {coverLetterRequired ? (
        <span className="text-rose-500 ml-1">
          *
        </span>
      ) : (
        <span className="font-normal text-slate-400 ml-1">
          Optional
        </span>
      )}
    </label>

    <textarea
      id="cover_letter"
      value={coverLetter}
      onChange={(event) =>
        setCoverLetter(event.target.value)
      }
      rows={9}
      maxLength={5000}
      required={coverLetterRequired}
      placeholder="Tell the employer why you are interested in this role..."
      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-y"
    />

    <div className="flex justify-end mt-2">
      <span className="text-xs text-slate-400">
        {coverLetter.length}/5000
      </span>
    </div>
  </div>
)}

{questions.length > 0 && (
  <div className="space-y-5">
    <div>
      <h2 className="text-base font-bold text-slate-900">
        Additional questions
      </h2>

      <p className="text-sm text-slate-500 mt-1">
        Answer the questions requested by the employer.
      </p>
    </div>

    {questions.map((question, index) => {
      const fieldId = `question-${question.id}`
      const value = answers[question.id] ?? ''

      return (
        <div
          key={question.id}
          className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
        >
          <label
            htmlFor={fieldId}
            className="block text-sm font-semibold text-slate-700 mb-3"
          >
            {index + 1}. {question.question_text}

            {question.is_required ? (
              <span className="text-rose-500 ml-1">
                *
              </span>
            ) : (
              <span className="font-normal text-slate-400 ml-1">
                Optional
              </span>
            )}
          </label>

          {question.question_type === 'yes_no' && (
            <select
              id={fieldId}
              value={value}
              required={question.is_required}
              onChange={(event) =>
                updateAnswer(
                  question.id,
                  event.target.value
                )
              }
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            >
              <option value="">
                Select an answer
              </option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          )}

          {question.question_type === 'short_text' && (
            <input
              id={fieldId}
              type="text"
              value={value}
              required={question.is_required}
              maxLength={500}
              placeholder="Enter your answer"
              onChange={(event) =>
                updateAnswer(
                  question.id,
                  event.target.value
                )
              }
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          )}

          {question.question_type === 'long_text' && (
            <textarea
              id={fieldId}
              value={value}
              required={question.is_required}
              rows={5}
              maxLength={2000}
              placeholder="Enter your answer"
              onChange={(event) =>
                updateAnswer(
                  question.id,
                  event.target.value
                )
              }
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-y"
            />
          )}

          {question.question_type === 'number' && (
            <input
              id={fieldId}
              type="number"
              value={value}
              required={question.is_required}
              placeholder="Enter a number"
              onChange={(event) =>
                updateAnswer(
                  question.id,
                  event.target.value
                )
              }
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          )}

          {question.question_type === 'single_choice' && (
            <select
              id={fieldId}
              value={value}
              required={question.is_required}
              onChange={(event) =>
                updateAnswer(
                  question.id,
                  event.target.value
                )
              }
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            >
              <option value="">
                Select an answer
              </option>

              {(question.options || []).map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                )
              )}
            </select>
          )}
        </div>
      )
    })}
  </div>
)}

             <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
  <h2 className="text-sm font-bold text-slate-800 mb-3">
    The employer will receive
  </h2>

  <div className="space-y-2 text-sm text-slate-600">
    {requireResume && (
      <p>✓ Your resume</p>
    )}

    {showCoverLetter && (
      <p>
        ✓ Your cover letter
        {!coverLetterRequired && ' if provided'}
      </p>
    )}

    {job.share_profile !== false && (
      <p>✓ Your CareerBrain profile</p>
    )}

    {job.share_match_score !== false && (
      <p>✓ Your skills and match score</p>
    )}

    {questions.length > 0 && (
      <p>✓ Your screening-question answers</p>
    )}
  </div>
</div>

<div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-100">
  <div className="flex items-center gap-2 text-xs text-slate-500">
    <FileText className="w-4 h-4" />
    Your application will be visible to this employer.
  </div>

  <button
    type="submit"
    disabled={submitting || uploadingResume}
    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 shadow-md hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
  >
  {submitting || uploadingResume ? (
  uploadingResume
    ? 'Uploading resume...'
    : 'Submitting...'
    ) : (
      <>
        <span>Submit application</span>
        <Send className="w-4 h-4" />
      </>
    )}
  </button>
</div>
            </form>
          </div>
        </main>
      </div>
    </>
  )
}