'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { theme } from '@/constants/colors'
import Link from 'next/link'

const STEPS = [
  { id: 'upload', label: 'Uploading CV' },
  { id: 'extract_text', label: 'Extracting text from PDF' },
  { id: 'ai_analyze', label: 'AI analyzing CV and experiences' },
  { id: 'sync_skills', label: 'Extracting and categorizing skills' },
  { id: 'calc_score', label: 'Calculating readiness score' },
  { id: 'completed', label: 'Updating profile' }
]

function CircularProgress({ score, size = 100, strokeWidth = 8, color }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (score / 100) * circumference

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justify: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={theme.border.light}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
        />
      </svg>
      <div style={{ position: 'absolute', fontSize: '20px', fontWeight: '800', color: theme.text.primary }}>
        {score}%
      </div>
    </div>
  )
}

export default function CvProcessor({ uploadId }) {
  const router = useRouter()
  const supabase = createClient()
  const hasStarted = useRef(false)
  const startTime = useRef(Date.now())

  const [status, setStatus] = useState('Processing') // Processing, Failed, Completed
  const [currentStep, setCurrentStep] = useState('Extracting text')
  const [errorMessage, setErrorMessage] = useState('')
  const [duration, setDuration] = useState('0.0')
  const [extractedData, setExtractedData] = useState(null)
  const [profileData, setProfileData] = useState(null)

  // Start logic
  useEffect(() => {
    if (!uploadId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setErrorMessage('Missing upload identification.')
      setStatus('Failed')
      return
    }

    if (hasStarted.current) return
    hasStarted.current = true

    processCv()
  }, [uploadId])

  // Polling logic during processing
  useEffect(() => {
    if (status !== 'Processing') return

    const interval = setInterval(async () => {
      const { data, error } = await supabase
        .from('cv_uploads')
        .select('status, processing_step, error_message, extracted_data')
        .eq('id', uploadId)
        .single()

      if (!error && data) {
        if (data.processing_step) {
          setCurrentStep(data.processing_step)
        }
        if (data.status === 'Failed') {
          setStatus('Failed')
          setErrorMessage(data.error_message || 'Processing failed at step: ' + data.processing_step)
          clearInterval(interval)
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [status, uploadId])

  async function processCv() {
    try {
      const response = await fetch('/api/cv-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId })
      })

      if (response.ok) {
        const result = await response.json()
        setExtractedData(result.data)

        // Fetch recalculated profile score details
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('readiness_score, category_scores')
            .eq('id', user.id)
            .single()

          if (profile) {
            setProfileData({
              score: profile.readiness_score || 0,
              categoryScores: profile.category_scores || {}
            })
          }
        }

        setDuration(((Date.now() - startTime.current) / 1000).toFixed(1))
        setStatus('Completed')
        setCurrentStep('Completed')
      } else {
        const errText = await response.text()
        let parsedErr = 'Unexpected server error'
        try {
          parsedErr = JSON.parse(errText).error
        } catch (_) {
          parsedErr = errText
        }
        throw new Error(parsedErr)
      }
    } catch (err) {
      console.error('Error during CV processing:', err)
      setErrorMessage(err.message || 'Processing failed')
      setStatus('Failed')
    }
  }

  const handleRetry = async () => {
    setStatus('Processing')
    setCurrentStep('Extracting text')
    setErrorMessage('')
    startTime.current = Date.now()

    // Reset status in DB to Processing
    await supabase
      .from('cv_uploads')
      .update({ status: 'Processing', processing_step: 'Extracting text', error_message: null })
      .eq('id', uploadId)

    // Re-trigger extraction
    processCv()
  }

  // Map database processing step to visual steps
  const getStepStatus = (stepId) => {
    if (status === 'Failed') {
      const activeStepIndex = STEPS.findIndex(s => getStepMapping(s.id) === currentStep)
      const currentStepIndex = STEPS.findIndex(s => s.id === stepId)
      if (currentStepIndex === activeStepIndex) return 'failed'
      if (currentStepIndex < activeStepIndex) return 'success'
      return 'pending'
    }

    if (status === 'Completed') return 'success'

    const activeStepIndex = STEPS.findIndex(s => getStepMapping(s.id) === currentStep)
    const currentStepIndex = STEPS.findIndex(s => s.id === stepId)

    if (currentStepIndex < activeStepIndex) return 'success'
    if (currentStepIndex === activeStepIndex) return 'active'
    return 'pending'
  }

  const getStepMapping = (stepId) => {
    const map = {
      upload: 'Uploading CV',
      extract_text: 'Extracting text',
      ai_analyze: 'AI analyzing CV',
      sync_skills: 'Syncing skills',
      calc_score: 'Calculating readiness score',
      completed: 'Completed'
    }
    return map[stepId] || ''
  }

  // Helpers for score color
  const getScoreColor = (s) => {
    if (s >= 70) return theme.score.high
    if (s >= 40) return theme.score.medium
    return theme.score.low
  }

  // Group skills by category
  const groupedSkills = (extractedData?.skills || []).reduce((acc, s) => {
    const cat = s.category || 'Other relevant professional skills'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s.name)
    return acc
  }, {})

  if (status === 'Completed') {
    return (
      <div style={{
        width: '100%',
        maxWidth: '640px',
        background: theme.bg.card,
        border: `1px solid ${theme.border.light}`,
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      }}>
        {/* Success header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <span style={{ fontSize: '28px' }}>🎉</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: theme.text.primary, margin: '0 0 6px' }}>
            CV Processed Successfully!
          </h1>
          <p style={{ fontSize: '14px', color: theme.text.secondary }}>
            Career Brain has completed the processing and scoring pipeline.
          </p>
        </div>

        {/* Info Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '28px',
        }}>
          <div style={{
            background: theme.bg.secondary,
            border: `1px solid ${theme.border.light}`,
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '12px', color: theme.text.secondary, display: 'block', marginBottom: '4px' }}>
              Processing Duration
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: theme.text.primary }}>
              {duration}s
            </span>
          </div>
          <div style={{
            background: theme.bg.secondary,
            border: `1px solid ${theme.border.light}`,
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '12px', color: theme.text.secondary, display: 'block', marginBottom: '4px' }}>
              Extracted Skills
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: theme.text.primary }}>
              {extractedData?.skills?.length || 0}
            </span>
          </div>
        </div>

        {/* Readiness Score circular preview */}
        {profileData && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            background: theme.bg.indigoSoft,
            border: `1px solid ${theme.border.indigo}`,
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '28px',
          }}>
            <CircularProgress score={profileData.score} color={getScoreColor(profileData.score)} />
            <div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: theme.text.indigo }}>
                Profile Readiness Score
              </span>
              <p style={{ fontSize: '13px', color: theme.text.secondary, marginTop: '2px', lineHeight: 1.4 }}>
                Your CV skills are well-balanced! Review extracted details and suggested actions in your profile card.
              </p>
            </div>
          </div>
        )}

        {/* Grouped Skills preview */}
        {Object.keys(groupedSkills).length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: theme.text.primary, marginBottom: '12px' }}>
              Extracted Skill Categories
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '160px', overflowY: 'auto', paddingRight: '4px' }}>
              {Object.entries(groupedSkills).map(([cat, skillNames]) => (
                <div key={cat} style={{ background: theme.bg.secondary, padding: '10px 12px', borderRadius: '8px', border: `1px solid ${theme.border.light}` }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: theme.text.secondary, display: 'block', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                    {cat}
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {skillNames.map((name, i) => (
                      <span key={i} style={{ fontSize: '11px', background: '#fff', border: `1px solid ${theme.border.light}`, padding: '2px 8px', borderRadius: '4px', color: theme.text.primary }}>
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/upload-review" style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
            background: theme.action.primary,
            color: '#fff',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
            textAlign: 'center'
          }}>
            Review Extracted Skills
          </Link>
          <Link href="/profile" style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
            background: theme.bg.secondary,
            border: `1px solid ${theme.border.light}`,
            color: theme.text.primary,
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
            textAlign: 'center'
          }}>
            Go to Profile
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '480px',
      background: theme.bg.card,
      border: `1px solid ${theme.border.light}`,
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        {status === 'Failed' ? (
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
          </div>
        ) : (
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: theme.bg.indigoSoft,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <span className="animate-spin" style={{ fontSize: '20px' }}>⚙️</span>
          </div>
        )}
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: theme.text.primary, margin: '0 0 4px' }}>
          {status === 'Failed' ? 'Extraction Failed' : 'Analyzing your CV'}
        </h1>
        <p style={{ fontSize: '13px', color: theme.text.secondary }}>
          {status === 'Failed' ? 'Something went wrong during processing' : 'Please keep this tab open while we extract details'}
        </p>
      </div>

      {/* Steps List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
        {STEPS.map((step) => {
          const stepStatus = getStepStatus(step.id)
          return (
            <div key={step.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: '10px',
              border: `1px solid ${stepStatus === 'active' ? theme.border.indigo : theme.border.light}`,
              background: stepStatus === 'active' ? theme.bg.indigoSoft : theme.bg.secondary,
              opacity: stepStatus === 'pending' ? 0.5 : 1,
              transition: 'all 0.3s ease'
            }}>
              <span style={{
                fontSize: '13px',
                fontWeight: stepStatus === 'active' ? 700 : 500,
                color: stepStatus === 'active' ? theme.text.indigo : theme.text.primary
              }}>
                {step.label}
              </span>

              {/* Status Icons */}
              {stepStatus === 'success' && (
                <span style={{ color: theme.score.high, fontSize: '14px', fontWeight: 'bold' }}>✓ Done</span>
              )}
              {stepStatus === 'active' && (
                <span style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: theme.text.indigo,
                  boxShadow: `0 0 8px ${theme.text.indigo}`,
                }} />
              )}
              {stepStatus === 'failed' && (
                <span style={{ color: theme.score.low, fontSize: '14px', fontWeight: 'bold' }}>✗ Failed</span>
              )}
              {stepStatus === 'pending' && (
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.border.medium }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Error Message Box */}
      {status === 'Failed' && errorMessage && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '8px',
          padding: '12px 14px',
          marginBottom: '24px',
          fontSize: '12px',
          color: theme.score.low,
          lineHeight: 1.4
        }}>
          <strong>Reason:</strong> {errorMessage}
        </div>
      )}

      {/* Action buttons */}
      {status === 'Failed' ? (
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={handleRetry}
            style={{
              flex: 1,
              padding: '12px',
              background: theme.action.primary,
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Retry Step
          </button>
          <Link href="/upload-cv" style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
            background: theme.bg.secondary,
            border: `1px solid ${theme.border.light}`,
            color: theme.text.primary,
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
            textAlign: 'center'
          }}>
            Cancel
          </Link>
        </div>
      ) : null}
    </div>
  )
}
