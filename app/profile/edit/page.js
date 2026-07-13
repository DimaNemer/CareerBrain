'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

const CURRENT_YEAR = new Date().getFullYear()

const HERO_BACKGROUND =
  'linear-gradient(135deg, #211D59 0%, #37319A 55%, #111936 100%)'

const INITIAL_FORM = {
  full_name: '',
  username: '',
  headline: '',
  bio: '',
  location: '',
  preferred_role: '',
  availability_status: '',
  profile_visibility: 'public',
  education_level: '',
  university: '',
  major: '',
  graduation_year: '',
  github_url: '',
  linkedin_url: '',
  portfolio_url: '',
}

const INITIAL_CERTIFICATE = {
  name: '',
  issuing_organization: '',
  issue_date: '',
  expiration_date: '',
  credential_id: '',
  credential_url: '',
}

export default function ProfileEditPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState(INITIAL_FORM)

  const [certificates, setCertificates] = useState([])
  const [certificateForm, setCertificateForm] =
    useState(INITIAL_CERTIFICATE)
  const [certificateLoading, setCertificateLoading] =
    useState(false)
  const [certificateError, setCertificateError] =
    useState('')
const [editingCertificateId, setEditingCertificateId] =
  useState(null)
  useEffect(() => {
    async function loadData() {
      try {
        const [profileResponse, certificatesResponse] =
          await Promise.all([
            fetch('/api/profile', {
              method: 'GET',
              cache: 'no-store',
            }),
            fetch('/api/profile/certificates', {
              method: 'GET',
              cache: 'no-store',
            }),
          ])

        const profileData = await profileResponse.json()
        const certificatesData =
          await certificatesResponse.json()

        if (profileResponse.status === 401) {
          router.replace('/login')
          return
        }

        if (!profileResponse.ok) {
          setError(
            profileData.error ||
              'Failed to load profile'
          )
        } else if (profileData.profile) {
          const profile = profileData.profile

          setForm({
            full_name: profile.full_name || '',
            username: profile.username || '',
            headline: profile.headline || '',
            bio: profile.bio || '',
            location: profile.location || '',
            preferred_role:
              profile.preferred_role || '',
            availability_status:
              profile.availability_status || '',
            profile_visibility:
              profile.profile_visibility || 'public',
            education_level:
              profile.education_level || '',
            university: profile.university || '',
            major: profile.major || '',
            graduation_year:
              profile.graduation_year || '',
            github_url: profile.github_url || '',
            linkedin_url:
              profile.linkedin_url || '',
            portfolio_url:
              profile.portfolio_url || '',
          })
        }

        if (!certificatesResponse.ok) {
          setCertificateError(
            certificatesData.error ||
              'Failed to load certificates'
          )
        } else {
          setCertificates(
            certificatesData.certificates || []
          )
        }
      } catch (loadError) {
        console.error('Profile load error:', loadError)
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  function handleChange(event) {
    const { name, value } = event.target

    setForm(previous => ({
      ...previous,
      [name]: value,
    }))

    setError('')
    setSuccess('')
  }

  function handleCertificateChange(event) {
    const { name, value } = event.target

    setCertificateForm(previous => ({
      ...previous,
      [name]: value,
    }))

    setCertificateError('')
  }

  function validateProfile() {
    const username = form.username
      .trim()
      .toLowerCase()

    if (!form.full_name.trim()) {
      return 'Full name is required'
    }

    if (!username) {
      return 'Username is required'
    }

    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      return 'Username must be 3–30 characters and contain only lowercase letters, numbers, or underscores'
    }

    if (form.headline.trim().length > 120) {
      return 'Headline must be under 120 characters'
    }

    if (form.bio.trim().length > 1000) {
      return 'About description must be under 1000 characters'
    }

    if (form.graduation_year) {
      const year = Number(form.graduation_year)

      if (
        Number.isNaN(year) ||
        year < 1950 ||
        year > CURRENT_YEAR + 10
      ) {
        return 'Please enter a valid graduation year'
      }
    }

    return null
  }
function handleEditCertificate(certificate) {
  setEditingCertificateId(certificate.id)

  setCertificateForm({
    name: certificate.name || '',
    issuing_organization:
      certificate.issuing_organization || '',
    issue_date: certificate.issue_date || '',
    expiration_date:
      certificate.expiration_date || '',
    credential_id:
      certificate.credential_id || '',
    credential_url:
      certificate.credential_url || '',
  })

  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: 'smooth',
  })
}

function handleCancelCertificateEdit() {
  setEditingCertificateId(null)
  setCertificateForm(INITIAL_CERTIFICATE)
  setCertificateError('')
} 

  async function handleSubmit(event) {
    event.preventDefault()

    const validationError = validateProfile()

    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      full_name: form.full_name.trim(),
      username: form.username.trim().toLowerCase(),
      headline: form.headline.trim(),
      bio: form.bio.trim(),
      location: form.location.trim(),
      preferred_role:
        form.preferred_role.trim(),
      availability_status:
        form.availability_status,
      profile_visibility:
        form.profile_visibility,
      education_level:
        form.education_level,
      university: form.university.trim(),
      major: form.major.trim(),
      graduation_year:
        form.graduation_year
          ? Number(form.graduation_year)
          : null,
      github_url: form.github_url.trim(),
      linkedin_url:
        form.linkedin_url.trim(),
      portfolio_url:
        form.portfolio_url.trim(),
    }

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(
          data.error || 'Failed to save profile'
        )
        return
      }

      setSuccess('Profile saved successfully')
      router.refresh()

      window.setTimeout(() => {
        router.push('/profile')
      }, 900)
    } catch (saveError) {
      console.error('Save profile error:', saveError)
      setError(
        'Something went wrong while saving'
      )
    } finally {
      setSaving(false)
    }
  }

 async function handleAddCertificate(event) {
  event.preventDefault()

  if (!certificateForm.name.trim()) {
    setCertificateError(
      'Certificate name is required'
    )
    return
  }

  setCertificateLoading(true)
  setCertificateError('')

  try {
    const editing = Boolean(editingCertificateId)

    const response = await fetch(
      '/api/profile/certificates',
      {
        method: editing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...certificateForm,
          id: editingCertificateId,
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      setCertificateError(
        data.error ||
          `Failed to ${editing ? 'update' : 'add'} certificate`
      )
      return
    }

    if (editing) {
      setCertificates(previous =>
        previous.map(certificate =>
          certificate.id === editingCertificateId
            ? data.certificate
            : certificate
        )
      )
    } else {
      setCertificates(previous => [
        data.certificate,
        ...previous,
      ])
    }

    setEditingCertificateId(null)
    setCertificateForm(INITIAL_CERTIFICATE)
    router.refresh()
  } catch {
    setCertificateError(
      'Failed to save certificate'
    )
  } finally {
    setCertificateLoading(false)
  }
}

  async function handleDeleteCertificate(
    certificateId
  ) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this certificate?'
    )

    if (!confirmed) return

    setCertificateError('')

    try {
      const response = await fetch(
        `/api/profile/certificates?certificateId=${encodeURIComponent(
          certificateId
        )}`,
        {
          method: 'DELETE',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setCertificateError(
          data.error ||
            'Failed to delete certificate'
        )
        return
      }

      setCertificates(previous =>
        previous.filter(
          certificate =>
            certificate.id !== certificateId
        )
      )

      router.refresh()
    } catch (deleteError) {
      console.error(
        'Delete certificate error:',
        deleteError
      )

      setCertificateError(
        'Failed to delete certificate'
      )
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F4F6FB',
          color: '#475569',
          fontSize: '14px',
        }}
      >
        Loading your profile...
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(180deg, #F3F4FA 0%, #F8FAFC 420px, #EEF1F7 100%)',
        padding: '20px 18px 70px',
      }}
    >
      <header
        style={{
          maxWidth: '1120px',
          margin: '0 auto',
          padding: '56px 60px',
          borderRadius: '28px',
          background: HERO_BACKGROUND,
          color: '#FFFFFF',
          boxShadow:
            '0 18px 42px rgba(33,29,89,0.20)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            right: '-90px',
            top: '-150px',
            background:
              'rgba(99,102,241,0.20)',
            filter: 'blur(4px)',
          }}
        />
<div
  style={{
    position: 'relative',
    zIndex: 2,
    marginBottom: '24px',
  }}
>
  <button
    type="button"
    onClick={() => router.push('/profile')}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 16px',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.18)',
      background: 'rgba(255,255,255,0.08)',
      color: '#FFFFFF',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: 600,
      transition: 'all 0.15s ease',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.background =
        'rgba(255,255,255,0.14)'
      e.currentTarget.style.borderColor =
        'rgba(255,255,255,0.30)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background =
        'rgba(255,255,255,0.08)'
      e.currentTarget.style.borderColor =
        'rgba(255,255,255,0.18)'
    }}
  >
    <ArrowLeft size={18} />
    Back to Profile
  </button>
</div>
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: '700px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '30px',
              background:
                'rgba(255,255,255,0.10)',
              border:
                '1px solid rgba(255,255,255,0.16)',
              color:
                'rgba(255,255,255,0.85)',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: '22px',
            }}
          >
            ✦ Professional profile
          </div>

          <h1
            style={{
              margin: '0 0 12px',
              fontSize: '38px',
              lineHeight: 1.15,
              fontWeight: 800,
              letterSpacing: '-1px',
            }}
          >
            Build a profile that represents you.
          </h1>

          <p
            style={{
              margin: 0,
              maxWidth: '650px',
              color:
                'rgba(255,255,255,0.72)',
              fontSize: '16px',
              lineHeight: 1.75,
            }}
          >
            Add your professional information,
            education, certifications, and
            external links so employers and
            teammates can understand your
            experience.
          </p>
        </div>
      </header>

      <main
        style={{
          maxWidth: '920px',
          margin: '-36px auto 0',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {error && (
          <Alert
            type="error"
            message={error}
          />
        )}

        {success && (
          <Alert
            type="success"
            message={success}
          />
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <Card
            icon="👤"
            title="Basic information"
            description="The main information displayed at the top of your profile."
          >
            <Row>
              <Field
                label="Full name"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Dima Nemer"
                required
                autoComplete="name"
                maxLength={100}
              />

              <Field
                label="Username"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="dimanemer"
                required
                autoComplete="username"
                maxLength={30}
                helpText="Lowercase letters, numbers, and underscores."
              />
            </Row>

            <Field
              label="Professional headline"
              name="headline"
              value={form.headline}
              onChange={handleChange}
              placeholder="Junior Full-Stack Developer"
              maxLength={120}
            />

            <TextareaField
              label="About"
              name="bio"
              value={form.bio}
              onChange={handleChange}
              placeholder="Describe your background, interests, experience, achievements, and the opportunities you are looking for."
              rows={5}
              maxLength={1000}
            />
          </Card>

          <Card
            icon="💼"
            title="Professional details"
            description="Help others understand your preferred role and current availability."
          >
            <Row>
              <Field
                label="Location"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Beirut, Lebanon"
                maxLength={100}
              />

              <Field
                label="Preferred role"
                name="preferred_role"
                value={form.preferred_role}
                onChange={handleChange}
                placeholder="Full-Stack Developer"
                maxLength={100}
              />
            </Row>

            <Row>
              <SelectField
                label="Availability"
                name="availability_status"
                value={
                  form.availability_status
                }
                onChange={handleChange}
                placeholder="Select availability"
                options={[
                  {
                    value: 'Available',
                    label: 'Available',
                  },
                  {
                    value:
                      'Open to opportunities',
                    label:
                      'Open to opportunities',
                  },
                  {
                    value: 'Busy',
                    label: 'Busy',
                  },
                  {
                    value: 'Not available',
                    label: 'Not available',
                  },
                ]}
              />

              <SelectField
                label="Profile visibility"
                name="profile_visibility"
                value={
                  form.profile_visibility
                }
                onChange={handleChange}
                placeholder="Select visibility"
                options={[
                  {
                    value: 'public',
                    label: 'Public',
                  },
                  {
                    value: 'members',
                    label:
                      'Registered members only',
                  },
                  {
                    value: 'private',
                    label: 'Private',
                  },
                ]}
              />
            </Row>
          </Card>

          <Card
            icon="🎓"
            title="Education"
            description="Add your degree, major, university, and expected or completed graduation year."
          >
            <Row>
              <SelectField
                label="Degree"
                name="education_level"
                value={form.education_level}
                onChange={handleChange}
                placeholder="Select degree"
                options={[
                  {
                    value: 'High School',
                    label: 'High School',
                  },
                  {
                    value: 'Bachelor',
                    label: 'Bachelor',
                  },
                  {
                    value: 'Master',
                    label: 'Master',
                  },
                  {
                    value: 'PhD',
                    label: 'PhD',
                  },
                  {
                    value: 'Bootcamp',
                    label: 'Bootcamp',
                  },
                  {
                    value: 'Self-taught',
                    label: 'Self-taught',
                  },
                ]}
              />

              <Field
                label="Major / field of study"
                name="major"
                value={form.major}
                onChange={handleChange}
                placeholder="Computer Science"
                maxLength={150}
              />
            </Row>

            <Row>
              <Field
                label="University or institution"
                name="university"
                value={form.university}
                onChange={handleChange}
                placeholder="Lebanese University"
                maxLength={150}
              />

              <Field
                label="Graduation year"
                name="graduation_year"
                type="number"
                value={form.graduation_year}
                onChange={handleChange}
                placeholder="2026"
                min={1950}
                max={CURRENT_YEAR + 10}
              />
            </Row>
          </Card>

          <Card
            icon="🔗"
            title="Professional links"
            description="Share links that allow people to review your work and experience."
          >
            <Field
              label="GitHub URL"
              name="github_url"
              type="url"
              value={form.github_url}
              onChange={handleChange}
              placeholder="https://github.com/username"
            />

            <Field
              label="LinkedIn URL"
              name="linkedin_url"
              type="url"
              value={form.linkedin_url}
              onChange={handleChange}
              placeholder="https://linkedin.com/in/username"
            />

            <Field
              label="Portfolio URL"
              name="portfolio_url"
              type="url"
              value={form.portfolio_url}
              onChange={handleChange}
              placeholder="https://yourportfolio.com"
            />
          </Card>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() =>
                router.push('/profile')
              }
              disabled={saving}
              style={secondaryButtonStyle}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{
                ...primaryButtonStyle,
                opacity: saving ? 0.7 : 1,
                cursor: saving
                  ? 'not-allowed'
                  : 'pointer',
              }}
            >
              {saving
                ? 'Saving...'
                : 'Save profile'}
            </button>
          </div>
        </form>

        {/* Separate form: do not place inside the profile form */}
        <section
          style={{
            ...cardStyle,
            marginTop: '24px',
          }}
        >
          <CardHeading
            icon="🏅"
            title="Licenses & certifications"
            description="Add certificates that support your professional experience and skills."
          />

          {certificateError && (
            <Alert
              type="error"
              message={certificateError}
            />
          )}

          <form
            onSubmit={handleAddCertificate}
            style={{
              padding: '20px',
              borderRadius: '16px',
              background:
                'linear-gradient(135deg, #F7F7FF, #EEF0FF)',
              border: '1px solid #DBDDFB',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
            }}
          >
            <Row>
              <Field
                label="Certificate name"
                name="name"
                value={certificateForm.name}
                onChange={
                  handleCertificateChange
                }
                placeholder="AWS Cloud Practitioner"
                required
                maxLength={150}
              />

              <Field
                label="Issuing organization"
                name="issuing_organization"
                value={
                  certificateForm.issuing_organization
                }
                onChange={
                  handleCertificateChange
                }
                placeholder="Amazon Web Services"
                maxLength={150}
              />
            </Row>

            <Row>
              <Field
                label="Issue date"
                name="issue_date"
                type="date"
                value={
                  certificateForm.issue_date
                }
                onChange={
                  handleCertificateChange
                }
              />

              <Field
                label="Expiration date"
                name="expiration_date"
                type="date"
                value={
                  certificateForm.expiration_date
                }
                onChange={
                  handleCertificateChange
                }
              />
            </Row>

            <Row>
              <Field
                label="Credential ID"
                name="credential_id"
                value={
                  certificateForm.credential_id
                }
                onChange={
                  handleCertificateChange
                }
                placeholder="ABC-123456"
                maxLength={150}
              />

              <Field
                label="Credential URL"
                name="credential_url"
                type="url"
                value={
                  certificateForm.credential_url
                }
                onChange={
                  handleCertificateChange
                }
                placeholder="https://..."
              />
            </Row>

           <div
  style={{
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  }}
>
  {editingCertificateId && (
    <button
      type="button"
      onClick={handleCancelCertificateEdit}
      disabled={certificateLoading}
      style={{
        ...secondaryButtonStyle,
        opacity: certificateLoading ? 0.7 : 1,
        cursor: certificateLoading
          ? 'not-allowed'
          : 'pointer',
      }}
    >
      Cancel edit
    </button>
  )}

  <button
    type="submit"
    disabled={certificateLoading}
    style={{
      ...primaryButtonStyle,
      opacity: certificateLoading ? 0.7 : 1,
      cursor: certificateLoading
        ? 'not-allowed'
        : 'pointer',
    }}
  >
    {certificateLoading
      ? editingCertificateId
        ? 'Updating...'
        : 'Adding...'
      : editingCertificateId
        ? 'Save certificate changes'
        : '+ Add certificate'}
  </button>
</div>
          </form>

          <div
            style={{
              marginTop: '18px',
            }}
          >
            {certificates.length === 0 ? (
              <EmptyCertificates />
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '12px',
                }}
              >
                {certificates.map(
                  certificate => (
                  <CertificateCard
  key={certificate.id}
  certificate={certificate}
  isEditing={
    editingCertificateId === certificate.id
  }
  onEdit={() =>
    handleEditCertificate(certificate)
  }
  onDelete={() =>
    handleDeleteCertificate(
      certificate.id
    )
  }
/>
                  )
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

function Alert({ type, message }) {
  const isError = type === 'error'

  return (
    <div
      role="alert"
      style={{
        padding: '12px 16px',
        borderRadius: '11px',
        fontSize: '13px',
        marginBottom: '16px',
        background: isError
          ? '#FEF2F2'
          : '#ECFDF5',
        color: isError
          ? '#DC2626'
          : '#047857',
        border: `1px solid ${
          isError
            ? '#FECACA'
            : '#A7F3D0'
        }`,
      }}
    >
      {message}
    </div>
  )
}

function Card({
  icon,
  title,
  description,
  children,
}) {
  return (
    <section style={cardStyle}>
      <CardHeading
        icon={icon}
        title={title}
        description={description}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
        }}
      >
        {children}
      </div>
    </section>
  )
}

function CardHeading({
  icon,
  title,
  description,
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '13px',
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background:
            'linear-gradient(135deg, #E8E7FF, #F2F1FF)',
          border: '1px solid #D9D7FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div>
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 750,
            color: '#111827',
            margin: '0 0 4px',
          }}
        >
          {title}
        </h2>

        <p
          style={{
            margin: 0,
            color: '#64748B',
            fontSize: '12px',
            lineHeight: 1.55,
          }}
        >
          {description}
        </p>
      </div>
    </div>
  )
}

function Row({ children }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '13px',
      }}
    >
      {children}
    </div>
  )
}

function Field({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  autoComplete,
  maxLength,
  min,
  max,
  helpText,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        style={labelStyle}
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        maxLength={maxLength}
        min={min}
        max={max}
        style={inputStyle}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
      />

      {helpText && (
        <p style={helpTextStyle}>
          {helpText}
        </p>
      )}

      {maxLength && type !== 'number' && (
        <div style={counterStyle}>
          {String(value).length}/{maxLength}
        </div>
      )}
    </div>
  )
}

function TextareaField({
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 4,
  maxLength,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        style={labelStyle}
      >
        {label}
      </label>

      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        style={{
          ...inputStyle,
          resize: 'vertical',
          lineHeight: 1.6,
          minHeight: '120px',
        }}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
      />

      {maxLength && (
        <div style={counterStyle}>
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  )
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        style={labelStyle}
      >
        {label}
      </label>

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        style={{
          ...inputStyle,
          cursor: 'pointer',
        }}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
      >
        <option value="">
          {placeholder}
        </option>

        {options.map(option => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function CertificateCard({
  certificate,
  isEditing,
  onEdit,
  onDelete,
}) {
  return (
    <article
      style={{
        padding: '16px',
        borderRadius: '15px',
        background: isEditing
          ? 'linear-gradient(135deg, #EEEFFF, #E4E5FF)'
          : 'linear-gradient(135deg, #FAFAFF, #F0F1FF)',
        border: isEditing
          ? '1.5px solid #818CF8'
          : '1px solid #DDDEFA',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '13px',
        boxShadow: isEditing
          ? '0 8px 22px rgba(55,49,154,0.12)'
          : 'none',
        transition:
          'border-color 0.15s, box-shadow 0.15s, background 0.15s',
      }}
    >
      <div
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: '#E7E7FF',
          color: '#37319A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          flexShrink: 0,
        }}
      >
        ◈
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            flexWrap: 'wrap',
            marginBottom: '4px',
          }}
        >
          <h3
            style={{
              margin: 0,
              color: '#111827',
              fontSize: '14px',
            }}
          >
            {certificate.name}
          </h3>

          {isEditing && (
            <span
              style={{
                padding: '2px 7px',
                borderRadius: '20px',
                background: '#37319A',
                color: '#FFFFFF',
                fontSize: '9px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              Editing
            </span>
          )}
        </div>

        {certificate.issuing_organization && (
          <p
            style={{
              margin: '0 0 5px',
              color: '#64748B',
              fontSize: '12px',
            }}
          >
            {certificate.issuing_organization}
          </p>
        )}

        {(certificate.issue_date ||
          certificate.expiration_date) && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              color: '#94A3B8',
              fontSize: '11px',
            }}
          >
            {certificate.issue_date && (
              <span>
                Issued{' '}
                {formatCertificateDate(
                  certificate.issue_date
                )}
              </span>
            )}

            {certificate.expiration_date && (
              <span>
                · Expires{' '}
                {formatCertificateDate(
                  certificate.expiration_date
                )}
              </span>
            )}
          </div>
        )}

        {certificate.credential_id && (
          <div
            style={{
              marginTop: '5px',
              color: '#64748B',
              fontSize: '11px',
            }}
          >
            Credential ID:{' '}
            {certificate.credential_id}
          </div>
        )}

        {certificate.credential_url && (
          <a
            href={certificate.credential_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              marginTop: '7px',
              color: '#37319A',
              fontSize: '11px',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            View credential ↗
          </a>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '7px',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={onEdit}
          disabled={isEditing}
          style={{
            padding: '6px 10px',
            borderRadius: '8px',
            border: '1px solid #D9D7FF',
            background: isEditing
              ? '#E5E7EB'
              : '#F2F1FF',
            color: isEditing
              ? '#9CA3AF'
              : '#37319A',
            fontSize: '10px',
            fontWeight: 700,
            cursor: isEditing
              ? 'not-allowed'
              : 'pointer',
          }}
        >
          {isEditing ? 'Editing' : 'Edit'}
        </button>

        <button
          type="button"
          onClick={onDelete}
          style={{
            padding: '6px 10px',
            borderRadius: '8px',
            border: '1px solid #FECACA',
            background: '#FEF2F2',
            color: '#DC2626',
            fontSize: '10px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Delete
        </button>
      </div>
    </article>
  )
}

function EmptyCertificates() {
  return (
    <div
      style={{
        padding: '30px 20px',
        textAlign: 'center',
        borderRadius: '15px',
        background: '#F8F9FD',
        border: '1px dashed #CCD0E5',
      }}
    >
      <div
        style={{
          fontSize: '28px',
          marginBottom: '8px',
        }}
      >
        🏅
      </div>

      <div
        style={{
          color: '#334155',
          fontSize: '13px',
          fontWeight: 700,
        }}
      >
        No certificates added yet
      </div>

      <p
        style={{
          color: '#94A3B8',
          fontSize: '11px',
          margin: '5px 0 0',
        }}
      >
        Add a certificate using the form above.
      </p>
    </div>
  )
}

function formatCertificateDate(date) {
  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}

function handleInputFocus(event) {
  event.target.style.borderColor = '#37319A'
  event.target.style.boxShadow =
    '0 0 0 3px rgba(55,49,154,0.12)'
  event.target.style.background = '#FFFFFF'
}

function handleInputBlur(event) {
  event.target.style.borderColor = '#D8DBEB'
  event.target.style.boxShadow = 'none'
  event.target.style.background = '#FAFBFF'
}

const cardStyle = {
  background: 'rgba(255,255,255,0.98)',
  border: '1px solid #E0E2EF',
  borderRadius: '20px',
  padding: '25px',
  boxShadow:
    '0 12px 34px rgba(33,29,89,0.08)',
}

const labelStyle = {
  display: 'block',
  marginBottom: '7px',
  color: '#334155',
  fontSize: '12px',
  fontWeight: 650,
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '11px 13px',
  background: '#FAFBFF',
  border: '1px solid #D8DBEB',
  borderRadius: '10px',
  color: '#111827',
  outline: 'none',
  fontFamily: 'inherit',
  fontSize: '13px',
  transition:
    'border-color 0.15s, box-shadow 0.15s, background 0.15s',
}

const helpTextStyle = {
  margin: '5px 0 0',
  color: '#94A3B8',
  fontSize: '10px',
  lineHeight: 1.45,
}

const counterStyle = {
  marginTop: '5px',
  textAlign: 'right',
  color: '#A0A7B8',
  fontSize: '10px',
}

const primaryButtonStyle = {
  padding: '10px 18px',
  border: 'none',
  borderRadius: '10px',
  color: '#FFFFFF',
  background:
    'linear-gradient(135deg, #37319A, #211D59)',
  boxShadow:
    '0 8px 18px rgba(55,49,154,0.22)',
  fontSize: '13px',
  fontWeight: 700,
}

const secondaryButtonStyle = {
  padding: '10px 18px',
  borderRadius: '10px',
  border: '1px solid #D8DBEB',
  background: '#FFFFFF',
  color: '#475569',
  fontSize: '13px',
  fontWeight: 650,
  cursor: 'pointer',
}