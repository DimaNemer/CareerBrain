import { formatFileSize } from '@/lib/cv-upload'

/**
 * @param {{ file: File }} props
 */
export default function CvFilePreview({ file }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 3.5A1.5 1.5 0 0 1 8.5 2H14l5 5v13.5A1.5 1.5 0 0 1 17.5 22H8.5A1.5 1.5 0 0 1 7 20.5V3.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M14 2v5h5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
        <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
      </div>
    </div>
  )
}
