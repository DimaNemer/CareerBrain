/** @typedef {{ valid: true }} CvValidationSuccess */
/** @typedef {{ valid: false, error: string }} CvValidationFailure */
/** @typedef {CvValidationSuccess | CvValidationFailure} CvValidationResult */

export const CV_MAX_SIZE_BYTES = 5 * 1024 * 1024
export const CV_MAX_SIZE_LABEL = '5MB'
export const CV_ALLOWED_MIME_TYPE = 'application/pdf'
export const CV_UPLOAD_STATUS = 'Processing'
export const CV_STORAGE_BUCKET = 'cvs'

/**
 * @param {File | null | undefined} file
 * @returns {CvValidationResult}
 */
export function validateCvFile(file) {
  if (!file) {
    return { valid: false, error: 'Please select a PDF file to upload.' }
  }

  const isPdf =
    file.type === CV_ALLOWED_MIME_TYPE ||
    file.name.toLowerCase().endsWith('.pdf')

  if (!isPdf) {
    return {
      valid: false,
      error: 'Only PDF files are accepted. Images, Word documents, and other formats are not supported.',
    }
  }

  if (file.size > CV_MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `File is too large. Maximum size is ${CV_MAX_SIZE_LABEL}.`,
    }
  }

  if (file.size === 0) {
    return { valid: false, error: 'The selected file is empty. Please choose a valid PDF.' }
  }

  return { valid: true }
}

/**
 * @param {string} filename
 * @returns {string}
 */
export function sanitizeCvFilename(filename) {
  const baseName = filename.split(/[/\\]/).pop() || 'cv.pdf'
  const sanitized = baseName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return sanitized.toLowerCase().endsWith('.pdf') ? sanitized : `${sanitized}.pdf`
}

export function buildCvStoragePath(userId, filename) {
  if (/^\d{13}_/.test(filename)) {
    return `${userId}/${filename}`
  }
  const timestamp = Date.now();
  return `${userId}/${timestamp}_${sanitizeCvFilename(filename)}`
}

/**
 * @param {string} userId
 * @param {string} filename
 * @returns {string}
 */
export function buildCvFileUrl(userId, filename) {
  return `${CV_STORAGE_BUCKET}/${buildCvStoragePath(userId, filename)}`
}

/**
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
