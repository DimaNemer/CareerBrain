'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
}

export default function CreateJobPage() {
  const router = useRouter()

  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(event) {
    const { name, value, type, checked } = event.target

    setForm(previousForm => ({
      ...previousForm,
      [name]: type === 'checkbox' ? checked : value,
    }))

    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const title = form.title.trim()
    const description = form.description.trim()

    if (!title) {
      setError('Job title is required')
      return
    }

    if (title.length > 150) {
      setError('Job title must be under 150 characters')
      return
    }

    if (!description) {
      setError('Job description is required')
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
        ? undefined
        : Number(form.salary_min)

    const maximumSalary =
      form.salary_max === ''
        ? undefined
        : Number(form.salary_max)

    if (
      minimumSalary !== undefined &&
      (!Number.isFinite(minimumSalary) || minimumSalary < 0)
    ) {
      setError('Minimum salary must be a valid positive number')
      return
    }

    if (
      maximumSalary !== undefined &&
      (!Number.isFinite(maximumSalary) || maximumSalary < 0)
    ) {
      setError('Maximum salary must be a valid positive number')
      return
    }

    if (
      minimumSalary !== undefined &&
      maximumSalary !== undefined &&
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
      employment_type: form.employment_type,
      experience_level: form.experience_level,
      description,
      requirements: form.requirements.trim(),
      is_active: form.is_active,
    }

    /*
     * Add salary fields only when the employer entered them.
     * This prevents empty strings from being sent to the API.
     */
    if (minimumSalary !== undefined) {
      payload.salary_min = minimumSalary
    }

    if (maximumSalary !== undefined) {
      payload.salary_max = maximumSalary
    }

    setLoading(true)

    try {
      const response = await fetch('/api/employer/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Unable to create the job')
        return
      }

      router.push('/employer/dashboard')
      router.refresh()
    } catch (requestError) {
      console.error('Create job request failed:', requestError)

      setError(
        'Something went wrong. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <div style={topSectionStyle}>
          <div>
            <Link
              href="/employer/dashboard"
              style={backLinkStyle}
            >
              ← Back to employer dashboard
            </Link>

            <p style={eyebrowStyle}>Employer workspace</p>

            <h1 style={headingStyle}>
              Create a new job
            </h1>

            <p style={descriptionStyle}>
              Add the role details that job seekers will
              see on the opportunities page.
            </p>
          </div>
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
                <span style={requiredStyle}> *</span>
              </label>

              <input
                name="title"
                type="text"
                required
                maxLength={150}
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Frontend Developer"
                autoComplete="off"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
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
                  autoComplete="address-level2"
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Employment type
                </label>

                <select
                  name="employment_type"
                  value={form.employment_type}
                  onChange={handleChange}
                  style={selectStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
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
                value={form.experience_level}
                onChange={handleChange}
                style={selectStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
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
                <span style={requiredStyle}> *</span>
              </label>

              <textarea
                name="description"
                required
                minLength={50}
                maxLength={5000}
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the role, responsibilities, team and what the successful candidate will work on..."
                rows={8}
                style={textareaStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
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
                onFocus={handleFocus}
                onBlur={handleBlur}
              />

              <div style={helperRowStyle}>
                <span style={helperTextStyle}>
                  Add one requirement per line for clarity.
                </span>

                <span style={helperTextStyle}>
                  {form.requirements.length}/5000
                </span>
              </div>
            </div>

            <div>
              <div style={sectionHeadingStyle}>
                Salary range
              </div>

              <p style={sectionDescriptionStyle}>
                Salary is optional. Enter the expected
                annual salary range in USD.
              </p>

              <div style={twoColumnStyle}>
                <div>
                  <label style={labelStyle}>
                    Minimum salary
                  </label>

                  <div style={salaryWrapperStyle}>
                    <span style={currencyStyle}>$</span>

                    <input
                      name="salary_min"
                      type="number"
                      min="0"
                      step="1"
                      value={form.salary_min}
                      onChange={handleChange}
                      placeholder="50000"
                      inputMode="numeric"
                      style={salaryInputStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>
                    Maximum salary
                  </label>

                  <div style={salaryWrapperStyle}>
                    <span style={currencyStyle}>$</span>

                    <input
                      name="salary_max"
                      type="number"
                      min="0"
                      step="1"
                      value={form.salary_max}
                      onChange={handleChange}
                      placeholder="70000"
                      inputMode="numeric"
                      style={salaryInputStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>
                </div>
              </div>
            </div>

            <label style={statusCardStyle}>
              <div style={statusTextStyle}>
                <span style={statusTitleStyle}>
                  Publish this job immediately
                </span>

                <span style={statusDescriptionStyle}>
                  Active jobs will appear for job seekers
                  on the opportunities page.
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
                href="/employer/dashboard"
                style={cancelButtonStyle}
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...submitButtonStyle,
                  cursor: loading
                    ? 'not-allowed'
                    : 'pointer',
                  opacity: loading ? 0.65 : 1,
                  boxShadow: loading
                    ? 'none'
                    : '0 4px 16px rgba(91,79,232,0.4)',
                }}
              >
                {loading
                  ? 'Creating job...'
                  : form.is_active
                    ? 'Create and publish job'
                    : 'Save inactive job'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}

function handleFocus(event) {
  event.target.style.borderColor =
    'rgba(91,79,232,0.7)'

  event.target.style.background =
    'rgba(255,255,255,0.08)'
}

function handleBlur(event) {
  event.target.style.borderColor =
    'rgba(255,255,255,0.1)'

  event.target.style.background =
    'rgba(255,255,255,0.06)'
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
  letterSpacing: '-0.6px',
}

const descriptionStyle = {
  margin: 0,
  color: 'rgba(255,255,255,0.5)',
  fontSize: '15px',
  lineHeight: 1.6,
}

const cardStyle = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px)',
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
  border: '1px solid rgba(239,68,68,0.25)',
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
  letterSpacing: '0.2px',
}

const requiredStyle = {
  color: '#FCA5A5',
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '13px 16px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#fff',
  outline: 'none',
  fontFamily: 'inherit',
  fontSize: '15px',
  transition:
    'border-color 0.2s ease, background 0.2s ease',
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
  marginBottom: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 700,
}

const sectionDescriptionStyle = {
  margin: '0 0 14px',
  color: 'rgba(255,255,255,0.42)',
  fontSize: '12px',
  lineHeight: 1.5,
}

const salaryWrapperStyle = {
  position: 'relative',
}

const currencyStyle = {
  position: 'absolute',
  left: '16px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'rgba(255,255,255,0.42)',
  fontSize: '15px',
  pointerEvents: 'none',
}

const salaryInputStyle = {
  ...inputStyle,
  paddingLeft: '34px',
}

const statusCardStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '18px',
  padding: '18px',
  background: 'rgba(91,79,232,0.08)',
  border: '1px solid rgba(129,140,248,0.2)',
  borderRadius: '14px',
  cursor: 'pointer',
}

const statusTextStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '5px',
}

const statusTitleStyle = {
  color: '#fff',
  fontSize: '14px',
  fontWeight: 700,
}

const statusDescriptionStyle = {
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
  border: '1px solid rgba(255,255,255,0.1)',
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
  transition:
    'opacity 0.2s ease, box-shadow 0.2s ease',
}