import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import UploadCvForm from './upload-cv-form'

export default async function UploadCvPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <UploadCvForm userId={user.id} />
}
