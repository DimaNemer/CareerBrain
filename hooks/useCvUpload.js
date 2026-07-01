'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  buildCvFileUrl,
  buildCvStoragePath,
  CV_ALLOWED_MIME_TYPE,
  CV_STORAGE_BUCKET,
  validateCvFile,
} from '@/lib/cv-upload'

/**
 * @param {{ userId: string }} options
 */
export function useCvUpload({ userId }) {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState(/** @type {File | null} */ (null))
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  function clearMessages() {
    setError('')
    setSuccess('')
  }

  /**
   * @param {File | null} file
   * @returns {boolean}
   */
  function selectFile(file) {
    clearMessages()

    const validation = validateCvFile(file)
    if (!validation.valid) {
      setSelectedFile(null)
      setError(validation.error)
      return false
    }

    setSelectedFile(file)
    return true
  }

  async function uploadCv() {
    clearMessages()

    const validation = validateCvFile(selectedFile)
    if (!validation.valid) {
      setError(validation.error)
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const storagePath = buildCvStoragePath(userId, selectedFile.name)
      const fileUrl = buildCvFileUrl(userId, selectedFile.name)

      const { error: storageError } = await supabase.storage
        .from(CV_STORAGE_BUCKET)
        .upload(storagePath, selectedFile, {
          contentType: CV_ALLOWED_MIME_TYPE,
          upsert: false,
        })

      if (storageError) {
        if (storageError.message?.includes('already exists')) {
          setError('A file with this name already exists. Please rename your CV and try again.')
        } else {
          setError('Failed to upload your CV. Please try again.')
        }
        return
      }

      const response = await fetch('/api/cv-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_url: fileUrl }),
      })

      const result = await response.json()

      if (!response.ok) {
        await supabase.storage.from(CV_STORAGE_BUCKET).remove([storagePath])
        setError(result.error || 'Failed to save your upload. Please try again.')
        return
      }

      setSuccess('CV uploaded successfully! Redirecting...')
      router.push('/upload-processing')
      router.refresh()
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return {
    selectedFile,
    loading,
    success,
    error,
    selectFile,
    uploadCv,
    clearMessages,
  }
}
