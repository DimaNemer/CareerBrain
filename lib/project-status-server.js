export async function syncProjectStatusWithRoles(supabase, projectId) {
  const { data: roles, error: rolesError } = await supabase
    .from('project_roles')
    .select('quantity_needed')
    .eq('project_id', projectId)

  if (rolesError) {
    return { error: rolesError }
  }

  if (roles.length === 0) {
    return { error: null }
  }

  const allRolesFilled = roles.every(
    (role) => Number(role.quantity_needed) === 0
  )
  const nextStatus = allRolesFilled ? 'active' : 'open'

  const { error: updateError } = await supabase
    .from('projects')
    .update({ status: nextStatus })
    .eq('id', projectId)
    .in('status', ['open', 'active'])

  return { error: updateError }
}
