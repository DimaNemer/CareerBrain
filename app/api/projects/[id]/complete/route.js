// import { createClient } from '@/lib/supabase-server'
// import { NextResponse } from 'next/server'

// export async function POST(request, { params }) {
//   try {
//     const supabase = await createClient()
//     const { id: projectId } = await params

//     const { data: { user }, error: authError } = await supabase.auth.getUser()
//     if (authError || !user) {
//       return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
//     }

//     const { data: project } = await supabase
//       .from('projects')
//       .select('id, owner_id, status, title')
//       .eq('id', projectId)
//       .is('deleted_at', null)
//       .single()

//     if (!project) {
//       return NextResponse.json({ error: 'Project not found' }, { status: 404 })
//     }

//     if (project.owner_id !== user.id) {
//       return NextResponse.json(
//         { error: 'Only the project owner can mark the project as complete' },
//         { status: 403 }
//       )
//     }

//     if (project.status === 'completed') {
//       return NextResponse.json(
//         { error: 'Project is already marked as complete' },
//         { status: 400 }
//       )
//     }

//     const { data: existingRequest } = await supabase
//       .from('completion_requests')
//       .select('id, status')
//       .eq('project_id', projectId)
//       .eq('status', 'pending')
//       .maybeSingle()

//     if (existingRequest) {
//       return NextResponse.json(
//         { error: 'A completion request is already pending' },
//         { status: 400 }
//       )
//     }

//     const { data: members } = await supabase
//       .from('project_members')
//       .select('user_id')
//       .eq('project_id', projectId)
//       .is('left_at', null)

//     const memberCount = members?.length || 0
//     const requiredConfirmations = Math.min(Math.max(Math.ceil(memberCount / 2), 1), 5)

//     const { data: completionRequest, error: requestError } = await supabase
//       .from('completion_requests')
//       .insert({
//         project_id: projectId,
//         requested_by: user.id,
//         status: 'pending',
//         required_confirmations: requiredConfirmations,
//       })
//       .select()
//       .single()

//     if (requestError) {
//       return NextResponse.json({ error: requestError.message }, { status: 500 })
//     }

//     await supabase
//       .from('completion_confirmations')
//       .insert({
//         request_id: completionRequest.id,
//         user_id: user.id,
//         confirmed: true,
//         confirmed_at: new Date().toISOString(),
//       })

//     if (memberCount === 0) {
//       await finalizeCompletion(supabase, projectId, completionRequest.id, user.id)
//       return NextResponse.json(
//         { message: 'Project marked as complete', status: 'completed' },
//         { status: 200 }
//       )
//     }

//     return NextResponse.json(
//       {
//         message: `Waiting for ${requiredConfirmations - 1} more confirmation(s).`,
//         status: 'pending',
//         required: requiredConfirmations,
//         confirmed: 1,
//       },
//       { status: 200 }
//     )
//   } catch {
//     return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
//   }
// }

// export async function PUT(request, { params }) {
//   try {
//     const supabase = await createClient()
//     const { id: projectId } = await params

//     const { data: { user }, error: authError } = await supabase.auth.getUser()
//     if (authError || !user) {
//       return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
//     }

//     const { data: member } = await supabase
//       .from('project_members')
//       .select('id')
//       .eq('project_id', projectId)
//       .eq('user_id', user.id)
//       .is('left_at', null)
//       .maybeSingle()

//     if (!member) {
//       return NextResponse.json(
//         { error: 'Only project members can confirm completion' },
//         { status: 403 }
//       )
//     }

//     const { data: completionRequest } = await supabase
//       .from('completion_requests')
//       .select('id, required_confirmations, status')
//       .eq('project_id', projectId)
//       .eq('status', 'pending')
//       .single()

//     if (!completionRequest) {
//       return NextResponse.json(
//         { error: 'No pending completion request found' },
//         { status: 404 }
//       )
//     }

//     const { data: alreadyConfirmed } = await supabase
//       .from('completion_confirmations')
//       .select('id')
//       .eq('request_id', completionRequest.id)
//       .eq('user_id', user.id)
//       .maybeSingle()

//     if (alreadyConfirmed) {
//       return NextResponse.json(
//         { error: 'You have already confirmed this completion request' },
//         { status: 400 }
//       )
//     }

//     await supabase
//       .from('completion_confirmations')
//       .insert({
//         request_id: completionRequest.id,
//         user_id: user.id,
//         confirmed: true,
//         confirmed_at: new Date().toISOString(),
//       })

//     const { count: confirmationCount } = await supabase
//       .from('completion_confirmations')
//       .select('id', { count: 'exact' })
//       .eq('request_id', completionRequest.id)
//       .eq('confirmed', true)

//     if (confirmationCount >= completionRequest.required_confirmations) {
//       await finalizeCompletion(supabase, projectId, completionRequest.id, user.id)
//       return NextResponse.json(
//         { message: 'Project is now complete', status: 'completed' },
//         { status: 200 }
//       )
//     }

//     const remaining = completionRequest.required_confirmations - confirmationCount
//     return NextResponse.json(
//       {
//         message: `${remaining} more confirmation(s) needed.`,
//         status: 'pending',
//         confirmed: confirmationCount,
//         required: completionRequest.required_confirmations,
//       },
//       { status: 200 }
//     )
//   } catch {
//     return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
//   }
// }

// async function finalizeCompletion(supabase, projectId, requestId, verifiedBy) {
//   await supabase
//     .from('projects')
//     .update({ status: 'completed' })
//     .eq('id', projectId)

//   await supabase
//     .from('completion_requests')
//     .update({ status: 'approved' })
//     .eq('id', requestId)

//   await supabase
//     .from('completed_projects')
//     .insert({
//       project_id: projectId,
//       verified_by: verifiedBy,
//       completed_at: new Date().toISOString(),
//     })

//   const { data: projectRoles } = await supabase
//     .from('project_roles')
//     .select('skill_id')
//     .eq('project_id', projectId)
//     .not('skill_id', 'is', null)

//   const skillIds = projectRoles?.map(r => r.skill_id) || []
//   if (skillIds.length === 0) return

//   const { data: members } = await supabase
//     .from('project_members')
//     .select('user_id')
//     .eq('project_id', projectId)

//   const { data: project } = await supabase
//     .from('projects')
//     .select('owner_id')
//     .eq('id', projectId)
//     .single()

//   const allUserIds = [
//     ...new Set([
//       ...(members?.map(m => m.user_id) || []),
//       project?.owner_id,
//     ].filter(Boolean))
//   ]

//   for (const userId of allUserIds) {
//     for (const skillId of skillIds) {
//       await supabase
//         .from('user_skills')
//         .upsert(
//           {
//             user_id: userId,
//             skill_id: skillId,
//             source: 'Project',
//             proficiency_level: 2,
//           },
//           { onConflict: 'user_id,skill_id' }
//         )
//     }
//   }
// }
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-service'
import {
  getProjectParticipantIds,
  sendProjectNotifications,
} from '@/lib/project-notifications'
import { NextResponse } from 'next/server'

export async function POST(request, { params }) {
  try {
    const supabase = await createClient()
    const { id: projectId } = await params

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const {
      data: project,
      error: projectError,
    } = await supabase
      .from('projects')
      .select(`
        id,
        owner_id,
        status,
        title
      `)
      .eq('id', projectId)
      .is('deleted_at', null)
      .single()

    if (projectError || !project) {
      console.error(
        'Load project error:',
        projectError
      )

      return NextResponse.json(
        {
          error:
            projectError?.message ||
            'Project not found',
        },
        { status: 404 }
      )
    }

    if (project.owner_id !== user.id) {
      return NextResponse.json(
        {
          error:
            'Only the project owner can mark this project as complete',
        },
        { status: 403 }
      )
    }

    if (project.status === 'completed') {
      return NextResponse.json(
        {
          message:
            'Project is already completed',
          status: 'completed',
        },
        { status: 200 }
      )
    }

    /*
     * Update the actual project status.
     * The workspace page reads this field, so after reload:
     * Active -> Completed
     * Mark as complete button disappears
     */
    const {
      data: completedProject,
      error: updateError,
    } = await supabase
      .from('projects')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .select(`
        id,
        title,
        status
      `)
      .single()

    if (updateError) {
      console.error(
        'Complete project update error:',
        updateError
      )

      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    /*
     * Save a completed-project record.
     * maybeSingle prevents duplicate records.
     */
    const {
      data: existingCompletedRecord,
      error: existingRecordError,
    } = await supabase
      .from('completed_projects')
      .select('id')
      .eq('project_id', projectId)
      .maybeSingle()

    if (existingRecordError) {
      console.error(
        'Completed project lookup error:',
        existingRecordError
      )
    }

    if (!existingCompletedRecord) {
      const { error: completedRecordError } =
        await supabase
          .from('completed_projects')
          .insert({
            project_id: projectId,
            verified_by: user.id,
            completed_at:
              new Date().toISOString(),
          })

      if (completedRecordError) {
        console.error(
          'Completed project record error:',
          completedRecordError
        )

        /*
         * Do not return 500 here because the main projects
         * table was already updated successfully.
         */
      }
    }

    /*
     * Load every role and its skill. The owner earns all project-role
     * skills; members earn only the skill attached to their own role.
     */
    const {
      data: projectRoles = [],
      error: rolesError,
    } = await supabase
      .from('project_roles')
      .select('id, role_title, skill_id')
      .eq('project_id', projectId)
      .not('skill_id', 'is', null)

    if (rolesError) {
      console.error(
        'Project roles error:',
        rolesError
      )
    }

    const ownerSkillIds = [
      ...new Set(
        projectRoles
          .map(role => role.skill_id)
          .filter(Boolean)
      ),
    ]

    if (ownerSkillIds.length > 0) {
      /*
       * Load active project members.
       */
      const {
        data: members = [],
        error: membersError,
      } = await supabase
        .from('project_members')
        .select('user_id, role_in_project')
        .eq('project_id', projectId)
        .is('left_at', null)

      if (membersError) {
        console.error(
          'Project members error:',
          membersError
        )
      }

      const activeMemberIds = [
        ...new Set(
          members
            .map(member => member.user_id)
            .filter(Boolean)
        ),
      ]

      /*
       * Accepted join requests retain the exact role ID selected by each
       * member. This avoids granting skills from other project roles that
       * happen to belong to the same project.
       */
      let acceptedRequests = []

      if (activeMemberIds.length > 0) {
        const {
          data: requestRows = [],
          error: requestsError,
        } = await supabase
          .from('join_requests')
          .select('user_id, project_role_id')
          .eq('project_id', projectId)
          .eq('status', 'accepted')
          .in('user_id', activeMemberIds)

        if (requestsError) {
          console.error(
            'Accepted member roles error:',
            requestsError
          )
        } else {
          acceptedRequests = requestRows
        }
      }

      const roleById = new Map(
        projectRoles.map(role => [role.id, role])
      )
      const rolesByTitle = new Map()

      for (const role of projectRoles) {
        const normalizedTitle = role.role_title
          ?.trim()
          .toLowerCase()

        if (!normalizedTitle) continue

        const matchingRoles =
          rolesByTitle.get(normalizedTitle) || []

        matchingRoles.push(role)
        rolesByTitle.set(
          normalizedTitle,
          matchingRoles
        )
      }

      const memberSkillIds = new Map()

      for (const requestRow of acceptedRequests) {
        const role = roleById.get(
          requestRow.project_role_id
        )

        if (!role?.skill_id) continue

        const assignedSkills =
          memberSkillIds.get(requestRow.user_id) ||
          new Set()

        assignedSkills.add(role.skill_id)
        memberSkillIds.set(
          requestRow.user_id,
          assignedSkills
        )
      }

      /*
       * Older member rows may predate accepted join-request tracking.
       * Their stored role title is used only when no exact role ID was
       * found.
       */
      for (const member of members) {
        if (
          !member.user_id ||
          memberSkillIds.has(member.user_id)
        ) {
          continue
        }

        const normalizedTitle =
          member.role_in_project
            ?.trim()
            .toLowerCase()
        const matchingRoles =
          rolesByTitle.get(normalizedTitle) || []

        if (matchingRoles.length > 0) {
          memberSkillIds.set(
            member.user_id,
            new Set(
              matchingRoles
                .map(role => role.skill_id)
                .filter(Boolean)
            )
          )
        }
      }

      const userSkillRows = ownerSkillIds.map(
        skillId => ({
          user_id: project.owner_id,
          skill_id: skillId,
          source: 'Project',
          proficiency_level: 2,
        })
      )

      for (const [
        memberId,
        assignedSkillIds,
      ] of memberSkillIds) {
        for (const skillId of assignedSkillIds) {
          userSkillRows.push({
            user_id: memberId,
            skill_id: skillId,
            source: 'Project',
            proficiency_level: 2,
          })
        }
      }

      if (userSkillRows.length > 0) {
        /*
         * This write includes other team members. The authenticated
         * owner's client is correctly blocked by user_skills RLS from
         * changing another user's profile, so use the server-only service
         * client after the ownership check above has authorized the action.
         */
        const serviceSupabase =
          createServiceClient()
        const { error: skillsError } =
          await serviceSupabase
            .from('user_skills')
            .upsert(userSkillRows, {
              onConflict: 'user_id,skill_id',
            })

        if (skillsError) {
          console.error(
            'Project skill verification error:',
            skillsError
          )

          return NextResponse.json(
            {
              error:
                'The project was completed, but its skills could not be added to team profiles. Please try again.',
            },
            { status: 500 }
          )
        }
      }
    }

    const memberIds = await getProjectParticipantIds(projectId, {
      includeOwner: false,
    })

    await sendProjectNotifications({
      recipientIds: memberIds,
      type: 'workspace_project_completed',
      title: `${project.title} is complete`,
      message: `The project owner marked ${project.title} as completed.`,
      projectId,
      actionUrl: `/projects/${projectId}/workspace`,
      data: { completed_by: user.id },
    })

    return NextResponse.json(
      {
        message:
          'Project marked as complete successfully',
        status: completedProject.status,
        project: completedProject,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(
      'Complete project route error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Something went wrong',
      },
      { status: 500 }
    )
  }
}
