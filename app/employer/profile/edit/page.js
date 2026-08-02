'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const initialForm = {
  company_name: '',
  company_size: '',
  company_industry: '',
  company_location: '',
  company_website: '',
  company_description: '',
  employer_headline: '',
  employer_experience: '',
  company_values: '',
  company_benefits: '',
}

export default function EditEmployerProfilePage() {
  const router = useRouter()

  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch(
          '/api/employer/profile',
          {
            cache: 'no-store',
          }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Unable to load employer profile'
          )
        }

        const profile = data.profile

        setForm({
          company_name:
            profile.company_name || '',

          company_size:
            profile.company_size || '',

          company_industry:
            profile.company_industry || '',

          company_location:
            profile.company_location || '',

          company_website:
            profile.company_website || '',

          company_description:
            profile.company_description || '',

          employer_headline:
            profile.employer_headline || '',

          employer_experience:
            profile.employer_experience || '',

          company_values:
            profile.company_values || '',

          company_benefits:
            profile.company_benefits || '',
        })
      } catch (loadError) {
        console.error(
          'Employer profile load failed:',
          loadError
        )

        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  function handleChange(event) {
    const { name, value } = event.target

    setForm(currentForm => ({
      ...currentForm,
      [name]: value,
    }))

    setError('')
    setSuccess('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (!form.company_name.trim()) {
      setError('Company name is required')
      return
    }

    if (form.company_name.trim().length > 100) {
      setError(
        'Company name must not exceed 100 characters'
      )
      return
    }

    if (
      form.employer_headline.trim().length > 200
    ) {
      setError(
        'Employer headline must not exceed 200 characters'
      )
      return
    }

    if (
      form.company_description.trim().length >
      5000
    ) {
      setError(
        'Company description must not exceed 5000 characters'
      )
      return
    }

    if (
      form.employer_experience.trim().length >
      5000
    ) {
      setError(
        'Employer experience must not exceed 5000 characters'
      )
      return
    }

    if (
      form.company_values.trim().length > 3000
    ) {
      setError(
        'Company values must not exceed 3000 characters'
      )
      return
    }

    if (
      form.company_benefits.trim().length > 3000
    ) {
      setError(
        'Company benefits must not exceed 3000 characters'
      )
      return
    }

    if (form.company_website.trim()) {
      try {
        const url = new URL(
          form.company_website.trim()
        )

        if (
          url.protocol !== 'http:' &&
          url.protocol !== 'https:'
        ) {
          throw new Error()
        }
      } catch {
        setError(
          'Company website must be a valid HTTP or HTTPS URL'
        )
        return
      }
    }

    const payload = {
      company_name:
        form.company_name.trim(),

      company_size:
        form.company_size || null,

      company_industry:
        form.company_industry.trim() || null,

      company_location:
        form.company_location.trim() || null,

      company_website:
        form.company_website.trim() || null,

      company_description:
        form.company_description.trim() || null,

      employer_headline:
        form.employer_headline.trim() || null,

      employer_experience:
        form.employer_experience.trim() || null,

      company_values:
        form.company_values.trim() || null,

      company_benefits:
        form.company_benefits.trim() || null,
    }

    setSaving(true)

    try {
      const response = await fetch(
        '/api/employer/profile',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Unable to update employer profile'
        )
      }

      setSuccess(
        'Employer profile updated successfully'
      )

      setTimeout(() => {
        router.push('/employer/profile')
        router.refresh()
      }, 800)
    } catch (saveError) {
      console.error(
        'Employer profile update failed:',
        saveError
      )

      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingContainerStyle}>
          <div style={spinnerStyle} />

          <p style={loadingTextStyle}>
            Loading employer profile...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <Link
          href="/employer/profile"
          style={backLinkStyle}
        >
          ← Back to employer profile
        </Link>

        <section style={headerStyle}>
          <p style={eyebrowStyle}>
            Employer profile
          </p>

          <h1 style={headingStyle}>
            Edit company profile
          </h1>

          <p style={headerDescriptionStyle}>
            Update the company and employer
            information shown on your profile.
          </p>
        </section>

        <section style={cardStyle}>
          {error && (
            <div style={errorStyle}>
              {error}
            </div>
          )}

          {success && (
            <div style={successStyle}>
              {success}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={formStyle}
          >
            <section style={formSectionStyle}>
              <div style={sectionHeadingRowStyle}>
                <div>
                  <h2 style={sectionTitleStyle}>
                    Company information
                  </h2>

                  <p
                    style={sectionDescriptionStyle}
                  >
                    Basic information about your
                    company.
                  </p>
                </div>
              </div>

              <div style={twoColumnStyle}>
                <Field
                  label="Company name"
                  required
                >
                  <input
                    name="company_name"
                    type="text"
                    value={form.company_name}
                    onChange={handleChange}
                    maxLength={100}
                    placeholder="e.g. Career Brain Ltd"
                    style={inputStyle}
                    required
                  />
                </Field>

                <Field label="Company size">
                  <select
                    name="company_size"
                    value={form.company_size}
                    onChange={handleChange}
                    style={selectStyle}
                  >
                    <option value="">
                      Select company size
                    </option>

                    <option value="1-10">
                      1–10 employees
                    </option>

                    <option value="11-50">
                      11–50 employees
                    </option>

                    <option value="51-200">
                      51–200 employees
                    </option>

                    <option value="201-500">
                      201–500 employees
                    </option>

                    <option value="500+">
                      500+ employees
                    </option>
                  </select>
                </Field>
              </div>

              <div style={twoColumnStyle}>
                <Field label="Industry">
                  <input
                    name="company_industry"
                    type="text"
                    value={form.company_industry}
                    onChange={handleChange}
                    maxLength={100}
                    placeholder="e.g. Technology"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Location">
                  <input
                    name="company_location"
                    type="text"
                    value={form.company_location}
                    onChange={handleChange}
                    maxLength={150}
                    placeholder="e.g. London, UK"
                    style={inputStyle}
                  />
                </Field>
              </div>

              <Field label="Company website">
                <input
                  name="company_website"
                  type="url"
                  value={form.company_website}
                  onChange={handleChange}
                  maxLength={2048}
                  placeholder="https://example.com"
                  style={inputStyle}
                />
              </Field>

              <Field
                label="Company description"
                helper={`${form.company_description.length}/5000`}
              >
                <textarea
                  name="company_description"
                  value={form.company_description}
                  onChange={handleChange}
                  maxLength={5000}
                  rows={8}
                  placeholder="Describe the company, its products, services and mission..."
                  style={textareaStyle}
                />
              </Field>
            </section>

            <div style={dividerStyle} />

            <section style={formSectionStyle}>
              <div style={sectionHeadingRowStyle}>
                <div>
                  <h2 style={sectionTitleStyle}>
                    Employer information
                  </h2>

                  <p
                    style={sectionDescriptionStyle}
                  >
                    Optional professional
                    information about the employer
                    or company representative.
                  </p>
                </div>
              </div>

              <Field
                label="Professional headline"
                helper={`${form.employer_headline.length}/200`}
              >
                <input
                  name="employer_headline"
                  type="text"
                  value={form.employer_headline}
                  onChange={handleChange}
                  maxLength={200}
                  placeholder="e.g. Building teams that create meaningful products"
                  style={inputStyle}
                />
              </Field>

              <Field
                label="Professional experience"
                helper={`${form.employer_experience.length}/5000`}
              >
                <textarea
                  name="employer_experience"
                  value={form.employer_experience}
                  onChange={handleChange}
                  maxLength={5000}
                  rows={7}
                  placeholder="Describe your professional experience, hiring background or company leadership experience..."
                  style={textareaStyle}
                />
              </Field>
            </section>

            <div style={dividerStyle} />

            <section style={formSectionStyle}>
              <div style={sectionHeadingRowStyle}>
                <div>
                  <h2 style={sectionTitleStyle}>
                    Company culture
                  </h2>

                  <p
                    style={sectionDescriptionStyle}
                  >
                    Help candidates understand your
                    company values and benefits.
                  </p>
                </div>
              </div>

              <Field
                label="Company values"
                helper={`${form.company_values.length}/3000`}
              >
                <textarea
                  name="company_values"
                  value={form.company_values}
                  onChange={handleChange}
                  maxLength={3000}
                  rows={6}
                  placeholder="Describe the values that guide your company..."
                  style={textareaStyle}
                />
              </Field>

              <Field
                label="Benefits and workplace"
                helper={`${form.company_benefits.length}/3000`}
              >
                <textarea
                  name="company_benefits"
                  value={form.company_benefits}
                  onChange={handleChange}
                  maxLength={3000}
                  rows={6}
                  placeholder="Describe benefits, flexibility, learning opportunities or workplace culture..."
                  style={textareaStyle}
                />
              </Field>
            </section>

            <div style={actionsStyle}>
              <Link
                href="/employer/profile"
                style={cancelButtonStyle}
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                style={{
                  ...saveButtonStyle,
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

function Field({
  label,
  helper,
  required = false,
  children,
}) {
  return (
    <div>
      <div style={labelRowStyle}>
        <label style={labelStyle}>
          {label}

          {required && (
            <span style={requiredStyle}>
              {' '}*
            </span>
          )}
        </label>

        {helper && (
          <span style={helperStyle}>
            {helper}
          </span>
        )}
      </div>

      {children}
    </div>
  )
}

const pageStyle = {
  minHeight: '100vh',
  background:
    'linear-gradient(135deg, #0A0F1E 0%, #0D1528 50%, #0A0F1E 100%)',
  color: '#FFFFFF',
  padding: '48px 24px 70px',
  fontFamily: 'Inter, system-ui, sans-serif',
}

const containerStyle = {
  width: '100%',
  maxWidth: '900px',
  margin: '0 auto',
}

const backLinkStyle = {
  display: 'inline-block',
  marginBottom: '28px',
  color: 'rgba(255,255,255,0.55)',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 600,
}

const headerStyle = {
  marginBottom: '28px',
}

const eyebrowStyle = {
  margin: '0 0 8px',
  color: '#A5B4FC',
  fontSize: '13px',
  fontWeight: 700,
}

const headingStyle = {
  margin: '0 0 10px',
  color: '#FFFFFF',
  fontSize: '34px',
  lineHeight: 1.2,
}

const headerDescriptionStyle = {
  margin: 0,
  color: 'rgba(255,255,255,0.48)',
  fontSize: '14px',
  lineHeight: 1.6,
}

const cardStyle = {
  padding: '30px',
  borderRadius: '24px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
}

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '26px',
}

const formSectionStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
}

const sectionHeadingRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '16px',
}

const sectionTitleStyle = {
  margin: '0 0 6px',
  color: '#FFFFFF',
  fontSize: '18px',
}

const sectionDescriptionStyle = {
  margin: 0,
  color: 'rgba(255,255,255,0.4)',
  fontSize: '12px',
  lineHeight: 1.5,
}

const twoColumnStyle = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '16px',
}

const labelRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '8px',
}

const labelStyle = {
  color: 'rgba(255,255,255,0.72)',
  fontSize: '13px',
  fontWeight: 700,
}

const requiredStyle = {
  color: '#FCA5A5',
}

const helperStyle = {
  color: 'rgba(255,255,255,0.3)',
  fontSize: '11px',
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '13px 15px',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.055)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#FFFFFF',
  outline: 'none',
  fontFamily: 'inherit',
  fontSize: '14px',
}

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
  colorScheme: 'dark',
}

const textareaStyle = {
  ...inputStyle,
  minHeight: '130px',
  resize: 'vertical',
  lineHeight: 1.7,
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
  paddingTop: '6px',
  flexWrap: 'wrap',
}

const cancelButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '46px',
  padding: '0 20px',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.72)',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 700,
}

const saveButtonStyle = {
  minHeight: '46px',
  padding: '0 22px',
  border: 'none',
  borderRadius: '12px',
  background:
    'linear-gradient(135deg, #5B4FE8, #7C3AED)',
  color: '#FFFFFF',
  fontFamily: 'inherit',
  fontSize: '14px',
  fontWeight: 700,
  boxShadow:
    '0 4px 16px rgba(91,79,232,0.35)',
}

const errorStyle = {
  marginBottom: '22px',
  padding: '13px 16px',
  borderRadius: '12px',
  background: 'rgba(239,68,68,0.12)',
  border: '1px solid rgba(239,68,68,0.25)',
  color: '#FCA5A5',
  fontSize: '13px',
}

const successStyle = {
  marginBottom: '22px',
  padding: '13px 16px',
  borderRadius: '12px',
  background: 'rgba(16,185,129,0.12)',
  border: '1px solid rgba(16,185,129,0.25)',
  color: '#6EE7B7',
  fontSize: '13px',
}

const loadingContainerStyle = {
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
  border: '3px solid rgba(255,255,255,0.15)',
  borderTopColor: '#818CF8',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
}

const loadingTextStyle = {
  color: 'rgba(255,255,255,0.5)',
  fontSize: '14px',
}