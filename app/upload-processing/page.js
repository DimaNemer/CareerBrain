import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import CvProcessor from '@/components/cv-upload/CvProcessor'

export default async function UploadProcessingPage({ searchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const params = await searchParams;
  const uploadId = params?.id || '';

  return (
    <main className="flex min-h-[calc(100vh-60px)] items-center justify-center bg-slate-50 px-6 py-10">
      <CvProcessor uploadId={uploadId} />
    </main>
  )
}
