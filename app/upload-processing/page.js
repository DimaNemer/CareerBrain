import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function UploadProcessingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="flex min-h-[calc(100vh-60px)] items-center justify-center bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-lg rounded-xl bg-white p-8 text-center shadow-sm">
        <div
          className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600"
          role="status"
          aria-label="Processing"
        />

        <h1 className="mb-4 text-2xl font-bold text-slate-900">
          Analyzing your CV
        </h1>

        <div className="space-y-3 text-sm leading-relaxed text-slate-600">
          <p>Your CV has been uploaded successfully.</p>
          <p>
            Career Brain is now analyzing your experience and extracting your skills.
          </p>
          <p>This usually takes a few seconds...</p>
        </div>
      </div>
    </main>
  )
}
