'use client'

import { useRef, useState } from 'react'
import { CV_ALLOWED_MIME_TYPE, CV_MAX_SIZE_LABEL } from '@/lib/cv-upload'

function PdfIcon() {
  return (
    <svg
      className="mx-auto h-12 w-12 text-indigo-500"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 3.5A1.5 1.5 0 0 1 8.5 2H14l5 5v13.5A1.5 1.5 0 0 1 17.5 22H8.5A1.5 1.5 0 0 1 7 20.5V3.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M14 2v5h5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M9 13h6M9 16h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * @param {{
 *   onFileSelect: (file: File | null) => boolean,
 *   disabled?: boolean,
 * }} props
 */
export default function CvDropZone({ onFileSelect, disabled = false }) {
  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null))
  const [isDragging, setIsDragging] = useState(false)

  function handleFiles(fileList) {
    const file = fileList?.[0] ?? null
    onFileSelect(file)
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDragging(false)
    if (disabled) return
    handleFiles(event.dataTransfer.files)
  }

  return (
    <div
      onDragEnter={(event) => {
        event.preventDefault()
        if (!disabled) setIsDragging(true)
      }}
      onDragOver={(event) => {
        event.preventDefault()
        if (!disabled) setIsDragging(true)
      }}
      onDragLeave={(event) => {
        event.preventDefault()
        setIsDragging(false)
      }}
      onDrop={handleDrop}
      className={[
        'rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
        isDragging
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-slate-300 bg-slate-50',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50',
      ].join(' ')}
      onClick={() => {
        if (!disabled) inputRef.current?.click()
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          if (!disabled) inputRef.current?.click()
        }
      }}
      aria-label="Upload CV drop zone"
    >
      <PdfIcon />

      <p className="mt-4 text-sm font-medium text-slate-900">
        Drag and drop your CV here
      </p>
      <p className="mt-1 text-sm text-slate-500">or</p>

      <button
        type="button"
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation()
          inputRef.current?.click()
        }}
        className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        Choose file
      </button>

      <p className="mt-6 text-xs text-slate-500">
        Accepted format: PDF only
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Maximum size: {CV_MAX_SIZE_LABEL}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={CV_ALLOWED_MIME_TYPE}
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          handleFiles(event.target.files)
          event.target.value = ''
        }}
      />
    </div>
  )
}
