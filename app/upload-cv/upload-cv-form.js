'use client'

import CvDropZone from '@/components/cv-upload/CvDropZone'
import CvFilePreview from '@/components/cv-upload/CvFilePreview'
import { useCvUpload } from '@/hooks/useCvUpload'

/**
 * @param {{ userId: string }} props
 */
export default function UploadCvForm({ userId }) {
  const {
    selectedFile,
    loading,
    success,
    error,
    selectFile,
    uploadCv,
  } = useCvUpload({ userId })

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Upload your CV
        </h1>
        <p className="mb-6 text-slate-600">
          Upload a PDF of your CV so Career Brain can analyze your experience and skills.
        </p>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700"
          >
            {success}
          </div>
        )}

        <div className="space-y-5">
          <CvDropZone onFileSelect={selectFile} disabled={loading} />

          {selectedFile && <CvFilePreview file={selectedFile} />}

          <button
            type="button"
            onClick={uploadCv}
            disabled={!selectedFile || loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                aria-hidden="true"
              />
            )}
            {loading ? 'Uploading...' : 'Upload CV'}
          </button>
        </div>
      </div>
    </main>
  )
}
