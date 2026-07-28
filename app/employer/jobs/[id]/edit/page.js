'use client'

import { useEffect, useState } from 'react'
import {
  useParams,
  useRouter,
} from 'next/navigation'
import Link from 'next/link'

const initialForm = {
  title: '',
  location: '',
  employment_type: '',
  experience_level: '',
  description: '',
  requirements: '',
  salary_min: '',
  salary_max: '',
  is_active: true,

  require_resume: true,
  cover_letter_requirement: 'optional',
  share_profile: true,
  share_match_score: true,
}

export default function EditJobPage() {
  const params = useParams()
  const router = useRouter()

  const [form, setForm] = useState(initialForm)
  const [loadingJob, setLoadingJob] =
    useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadJob() {
      try {
        const response = await fetch(
          `/api/employer/jobs/${params.id}`
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error || 'Unable to load the job'
          )
        }

        const job = data.job || data

        setForm({
          title: job.title || '',
          location: job.location || '',
          employment_type:
            job.employment_type || '',
          experience_level:
            job.experience_level || '',
          description: job.description || '',
          requirements: job.requirements || '',

          salary_min:
            job.salary_min === null ||
            job.salary_min === undefined
              ? ''
              : String(job.salary_min),

          salary_max:
            job.salary_max === null ||
            job.salary_max === undefined
              ? ''
              : String(job.salary_max),

          is_active: job.is_active !== false,

          require_resume:
            job.require_resume !== false,

          cover_letter_requirement:
            job.cover_letter_requirement ||
            'optional',

          share_profile:
            job.share_profile !== false,

          share_match_score:
            job.share_match_score !== false,
        })
      } catch (loadError) {
        console.error(
          'Load job failed:',
          loadError
        )

        setError(loadError.message)
      } finally {
        setLoadingJob(false)
      }
    }

    if (params.id) {
      loadJob()
    }
  }, [params.id])

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target

    setForm(previousForm => ({
      ...previousForm,
      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }))

    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const title = form.title.trim()
    const description =
      form.description.trim()

    if (!title) {
      setError('Job title is required')
      return
    }

    if (title.length > 150) {
      setError(
        'Job title must be under 150 characters'
      )
      return
    }

    if (!description) {
      setError(
        'Job description is required'
      )
      return
    }

    if (description.length < 50) {
      setError(
        'Job description must be at least 50 characters'
      )
      return
    }

    const minimumSalary =
      form.salary_min === ''
        ? null
        : Number(form.salary_min)

    const maximumSalary =
      form.salary_max === ''
        ? null
        : Number(form.salary_max)

    if (
      minimumSalary !== null &&
      (
        !Number.isFinite(minimumSalary) ||
        minimumSalary < 0
      )
    ) {
      setError(
        'Minimum salary must be a valid positive number'
      )
      return
    }

    if (
      maximumSalary !== null &&
      (
        !Number.isFinite(maximumSalary) ||
        maximumSalary < 0
      )
    ) {
      setError(
        'Maximum salary must be a valid positive number'
      )
      return
    }

    if (
      minimumSalary !== null &&
      maximumSalary !== null &&
      minimumSalary > maximumSalary
    ) {
      setError(
        'Minimum salary cannot exceed maximum salary'
      )
      return
    }

    const payload = {
      title,
      location: form.location.trim(),
      employment_type:
        form.employment_type,
      experience_level:
        form.experience_level,
      description,
      requirements:
        form.requirements.trim(),

      salary_min: minimumSalary,
      salary_max: maximumSalary,

      is_active: form.is_active,

      require_resume:
        form.require_resume,

      cover_letter_requirement:
        form.cover_letter_requirement,

      share_profile:
        form.share_profile,

      share_match_score:
        form.share_match_score,
    }

    setSaving(true)

    try {
      const response = await fetch(
        `/api/employer/jobs/${params.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify(payload),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(
          data.error ||
            'Unable to update the job'
        )
        return
      }

      router.push(
        `/employer/jobs/${params.id}`
      )
      router.refresh()
    } catch (requestError) {
      console.error(
        'Update job request failed:',
        requestError
      )

      setError(
        'Something went wrong. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loadingJob) {
    return (
      <main style={pageStyle}>
        <div style={loadingStyle}>
          <div style={spinnerStyle} />

          <p style={loadingTextStyle}>
            Loading job...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <Link
          href={`/employer/jobs/${params.id}`}
          style={backLinkStyle}
        >
          ← Back to job details
        </Link>

        <div style={topSectionStyle}>
          <p style={eyebrowStyle}>
            Employer workspace
          </p>

          <h1 style={headingStyle}>
            Edit job
          </h1>

          <p style={descriptionStyle}>
            Update the job information and
            application settings.
          </p>
        </div>

        <section style={cardStyle}>
          {error && (
            <div style={errorStyle}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={formStyle}
          >
            <div>
              <label style={labelStyle}>
                Job title
                <span style={requiredStyle}>
                  {' '}*
                </span>
              </label>

              <input
                name="title"
                type="text"
                required
                maxLength={150}
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Frontend Developer"
                style={inputStyle}
              />

              <div style={helperRowStyle}>
                <span style={helperTextStyle}>
                  Use a clear and specific title.
                </span>

                <span style={helperTextStyle}>
                  {form.title.length}/150
                </span>
              </div>
            </div>

            <div style={twoColumnStyle}>
              <div>
                <label style={labelStyle}>
                  Location
                </label>

                <input
                  name="location"
                  type="text"
                  maxLength={150}
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. London, UK or Remote"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Employment type
                </label>

                <select
                  name="employment_type"
                  value={
                    form.employment_type
                  }
                  onChange={handleChange}
                  style={selectStyle}
                >
                  <option value="">
                    Select employment type
                  </option>

                  <option value="full-time">
                    Full-time
                  </option>

                  <option value="part-time">
                    Part-time
                  </option>

                  <option value="contract">
                    Contract
                  </option>

                  <option value="internship">
                    Internship
                  </option>

                  <option value="freelance">
                    Freelance
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>
                Experience level
              </label>

              <select
                name="experience_level"
                value={
                  form.experience_level
                }
                onChange={handleChange}
                style={selectStyle}
              >
                <option value="">
                  Select experience level
                </option>

                <option value="entry">
                  Entry level
                </option>

                <option value="junior">
                  Junior
                </option>

                <option value="mid">
                  Mid-level
                </option>

                <option value="senior">
                  Senior
                </option>

                <option value="lead">
                  Lead
                </option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>
                Job description
                <span style={requiredStyle}>
                  {' '}*
                </span>
              </label>

              <textarea
                name="description"
                required
                minLength={50}
                maxLength={5000}
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the role, responsibilities and team..."
                rows={8}
                style={textareaStyle}
              />

              <div style={helperRowStyle}>
                <span style={helperTextStyle}>
                  Minimum 50 characters.
                </span>

                <span style={helperTextStyle}>
                  {form.description.length}/5000
                </span>
              </div>
            </div>

            <div>
              <label style={labelStyle}>
                Requirements
              </label>

              <textarea
                name="requirements"
                maxLength={5000}
                value={form.requirements}
                onChange={handleChange}
                placeholder={`e.g.
• Experience with React and Next.js
• Strong JavaScript skills
• Good communication and teamwork`}
                rows={7}
                style={textareaStyle}
              />

              <div style={helperRowStyle}>
                <span style={helperTextStyle}>
                  Add one requirement per line.
                </span>

                <span style={helperTextStyle}>
                  {form.requirements.length}/5000
                </span>
              </div>
            </div>

            <div>
              <h2 style={sectionHeadingStyle}>
                Salary range
              </h2>

              <p style={sectionDescriptionStyle}>
                Salary is optional. Enter the
                expected annual salary range in
                USD.
              </p>

              <div style={twoColumnStyle}>
                <div>
                  <label style={labelStyle}>
                    Minimum salary
                  </label>

                  <input
                    name="salary_min"
                    type="number"
                    min="0"
                    step="1"
                    value={form.salary_min}
                    onChange={handleChange}
                    placeholder="50000"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    Maximum salary
                  </label>

                  <input
                    name="salary_max"
                    type="number"
                    min="0"
                    step="1"
                    value={form.salary_max}
                    onChange={handleChange}
                    placeholder="70000"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            <div style={dividerStyle} />

            <div>
              <h2 style={sectionHeadingStyle}>
                Application settings
              </h2>

              <p style={sectionDescriptionStyle}>
                Choose what candidates must
                provide when applying.
              </p>
            </div>

            <label style={settingCardStyle}>
              <div style={settingTextStyle}>
                <span style={settingTitleStyle}>
                  Require a resume
                </span>

                <span
                  style={settingDescriptionStyle}
                >
                  Candidates must upload a resume
                  before applying.
                </span>
              </div>

              <input
                name="require_resume"
                type="checkbox"
                checked={
                  form.require_resume
                }
                onChange={handleChange}
                style={checkboxStyle}
              />
            </label>

            <div>
              <label style={labelStyle}>
                Cover letter
              </label>

              <select
                name="cover_letter_requirement"
                value={
                  form.cover_letter_requirement
                }
                onChange={handleChange}
                style={selectStyle}
              >
                <option value="not_requested">
                  Not requested
                </option>

                <option value="optional">
                  Optional
                </option>

                <option value="required">
                  Required
                </option>
              </select>
            </div>

            <label style={settingCardStyle}>
              <div style={settingTextStyle}>
                <span style={settingTitleStyle}>
                  Share candidate profile
                </span>

                <span
                  style={settingDescriptionStyle}
                >
                  Allow the employer to view the
                  candidate’s Career Brain
                  profile.
                </span>
              </div>

              <input
                name="share_profile"
                type="checkbox"
                checked={
                  form.share_profile
                }
                onChange={handleChange}
                style={checkboxStyle}
              />
            </label>

            <label style={settingCardStyle}>
              <div style={settingTextStyle}>
                <span style={settingTitleStyle}>
                  Share skills and match score
                </span>

                <span
                  style={settingDescriptionStyle}
                >
                  Include the candidate’s skills
                  and job-match information.
                </span>
              </div>

              <input
                name="share_match_score"
                type="checkbox"
                checked={
                  form.share_match_score
                }
                onChange={handleChange}
                style={checkboxStyle}
              />
            </label>

            <div style={dividerStyle} />

            <label style={statusCardStyle}>
              <div style={settingTextStyle}>
                <span style={settingTitleStyle}>
                  Job is active
                </span>

                <span
                  style={settingDescriptionStyle}
                >
                  Active jobs appear on the
                  opportunities page.
                </span>
              </div>

              <input
                name="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={handleChange}
                style={checkboxStyle}
              />
            </label>

            <div style={actionsStyle}>
              <Link
                href={`/employer/jobs/${params.id}`}
                style={cancelButtonStyle}
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                style={{
                  ...submitButtonStyle,
                  opacity: saving ? 0.65 : 1,
                  cursor: saving
                    ? 'not-allowed'
                    : 'pointer',
                }}
              >
                {saving
                  ? 'Saving changes...'
                  : 'Save changes'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}

const pageStyle = {
  minHeight: '100vh',
  background:
    'linear-gradient(135deg, #0A0F1E 0%, #0D1528 50%, #0A0F1E 100%)',
  color: '#fff',
  padding: '48px 24px',
  fontFamily: 'Inter, system-ui, sans-serif',
}

const containerStyle = {
  width: '100%',
  maxWidth: '900px',
  margin: '0 auto',
}

const topSectionStyle = {
  marginBottom: '28px',
}

const backLinkStyle = {
  display: 'inline-block',
  marginBottom: '26px',
  color: 'rgba(255,255,255,0.55)',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 600,
}

const eyebrowStyle = {
  margin: '0 0 8px',
  color: '#818CF8',
  fontSize: '14px',
  fontWeight: 700,
}

const headingStyle = {
  margin: '0 0 10px',
  fontSize: '34px',
  lineHeight: 1.2,
}

const descriptionStyle = {
  margin: 0,
  color: 'rgba(255,255,255,0.5)',
  fontSize: '15px',
}

const cardStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '24px',
  padding: '32px',
}

const errorStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '9px',
  marginBottom: '22px',
  padding: '13px 16px',
  background: 'rgba(239,68,68,0.12)',
  border:
    '1px solid rgba(239,68,68,0.25)',
  borderRadius: '12px',
  color: '#FCA5A5',
  fontSize: '14px',
}

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '22px',
}

const twoColumnStyle = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '16px',
}

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  color: 'rgba(255,255,255,0.72)',
  fontSize: '13px',
  fontWeight: 600,
}

const requiredStyle = {
  color: '#FCA5A5',
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '13px 16px',
  background: 'rgba(255,255,255,0.06)',
  border:
    '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#fff',
  outline: 'none',
  fontFamily: 'inherit',
  fontSize: '15px',
}

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
  colorScheme: 'dark',
}

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: '150px',
  lineHeight: 1.6,
}

const helperRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  marginTop: '7px',
}

const helperTextStyle = {
  color: 'rgba(255,255,255,0.32)',
  fontSize: '11px',
}

const sectionHeadingStyle = {
  margin: '0 0 5px',
  color: '#fff',
  fontSize: '17px',
  fontWeight: 700,
}

const sectionDescriptionStyle = {
  margin: '0 0 14px',
  color: 'rgba(255,255,255,0.42)',
  fontSize: '12px',
  lineHeight: 1.5,
}

const settingCardStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '18px',
  padding: '18px',
  background: 'rgba(255,255,255,0.035)',
  border:
    '1px solid rgba(255,255,255,0.09)',
  borderRadius: '14px',
  cursor: 'pointer',
}

const statusCardStyle = {
  ...settingCardStyle,
  background: 'rgba(91,79,232,0.08)',
  border:
    '1px solid rgba(129,140,248,0.2)',
}

const settingTextStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '5px',
}

const settingTitleStyle = {
  color: '#fff',
  fontSize: '14px',
  fontWeight: 700,
}

const settingDescriptionStyle = {
  color: 'rgba(255,255,255,0.42)',
  fontSize: '12px',
  lineHeight: 1.5,
}

const checkboxStyle = {
  width: '20px',
  height: '20px',
  flexShrink: 0,
  accentColor: '#5B4FE8',
  cursor: 'pointer',
}

const dividerStyle = {
  height: '1px',
  background: 'rgba(255,255,255,0.08)',
}

const actionsStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: '12px',
  marginTop: '6px',
  flexWrap: 'wrap',
}

const cancelButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '46px',
  padding: '0 20px',
  background: 'rgba(255,255,255,0.05)',
  border:
    '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: 'rgba(255,255,255,0.7)',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 700,
}

const submitButtonStyle = {
  minHeight: '46px',
  padding: '0 22px',
  background:
    'linear-gradient(135deg, #5B4FE8, #7C3AED)',
  border: 'none',
  borderRadius: '12px',
  color: '#fff',
  fontFamily: 'inherit',
  fontSize: '14px',
  fontWeight: 700,
}

const loadingStyle = {
  minHeight: '70vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '14px',
}

const spinnerStyle = {
  width: '34px',
  height: '34px',
  border:
    '3px solid rgba(255,255,255,0.15)',
  borderTopColor: '#818CF8',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
}

const loadingTextStyle = {
  color: 'rgba(255,255,255,0.5)',
  fontSize: '14px',
}