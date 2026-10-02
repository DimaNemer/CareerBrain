import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import TeamManager from '@/components/employer/TeamManager'

export const metadata = {
  title: 'Manage team',
}

export default async function EmployerTeamPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'employer') {
    redirect('/dashboard')
  }

  // Company is resolved from the caller's own membership, never from a
  // route parameter, so this page cannot be pointed at another company.
  const { data: membership } = await supabase
    .from('company_members')
    .select(`
      company_id,
      role,
      job_title,
      companies (
        id,
        name
      )
    `)
    .eq('user_id', user.id)
    .eq('is_current', true)
    .maybeSingle()

  if (!membership) {
    redirect('/dashboard')
  }

  const company = Array.isArray(membership.companies)
    ? membership.companies[0]
    : membership.companies

  if (!company) {
    redirect('/dashboard')
  }

  const { data: members, error: membersError } = await supabase
    .from('company_members')
    .select(`
      id,
      user_id,
      role,
      job_title,
      created_at,
      profiles (
        id,
        full_name,
        username,
        avatar_url
      )
    `)
    .eq('company_id', company.id)
    .eq('is_current', true)
    .order('created_at', { ascending: true })

  if (membersError) {
    console.error(
      'Employer team page load error:',
      membersError.message
    )
  }

  const safeMembers = members || []
  const canManage = ['owner', 'admin'].includes(membership.role)

  // Pending invite emails are only exposed to admins, matching the API.
  let pendingInvites = []

  if (canManage) {
    const { data: inviteRows, error: invitesError } = await supabase
      .from('company_invites')
      .select('id, email, role, job_title, status, created_at')
      .eq('company_id', company.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (invitesError) {
      // Expected until supabase/migrations/00003_company_invites.sql is applied.
      console.error(
        'Employer pending invites error:',
        invitesError.message
      )
    } else {
      pendingInvites = inviteRows || []
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #0A0F1E 0%, #0D1528 50%, #0A0F1E 100%)',
        color: '#fff',
        padding: '40px 24px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
        <TeamManager
          companyName={company.name || 'Your company'}
          initialMembers={safeMembers}
          initialInvites={pendingInvites}
          canManage={canManage}
          currentUserId={user.id}
          currentRole={membership.role}
          currentJobTitle={membership.job_title}
        />
      </div>
    </main>
  )
}