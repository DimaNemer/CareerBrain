// import { createClient } from '@/lib/supabase-server'
// import { redirect } from 'next/navigation'
// import Link from 'next/link'
// import AvatarUpload from '@/components/profile/AvatarUpload'
// import ProjectPostForm from '@/components/profile/ProjectPostForm'
// import { theme } from '@/constants/colors'

// export default async function ProfilePage() {
//   const supabase = await createClient()
//   const { data: { user } } = await supabase.auth.getUser()
//   if (!user) redirect('/login')

//   const { data: profile } = await supabase
//     .from('profiles')
//     .select(`
//       *,
//       user_skills (
//         proficiency_level, source,
//         skills ( name, category )
//       )
//     `)
//     .eq('id', user.id)
//     .single()

//   // My owned projects
//   const { data: myProjects } = await supabase
//     .from('projects')
//     .select('id, title, status, created_at')
//     .eq('owner_id', user.id)
//     .is('deleted_at', null)
//     .order('created_at', { ascending: false })

//   // Projects I joined
//   const { data: joinedProjects } = await supabase
//     .from('project_members')
//     .select(`
//       role_in_project, joined_at,
//       projects ( id, title, status )
//     `)
//     .eq('user_id', user.id)
//     .is('left_at', null)

//   // My posts
//   const { data: posts } = await supabase
//     .from('project_posts')
//     .select(`
//       id, title, content, skills_highlighted, created_at,
//       projects ( id, title )
//     `)
//     .eq('user_id', user.id)
//     .order('created_at', { ascending: false })

//   const skills = profile?.user_skills || []
//   const score = profile?.readiness_score || 0

//   function scoreColor(s) {
//     if (s >= 70) return theme.score.high
//     if (s >= 40) return theme.score.medium
//     return theme.score.low
//   }

//   const skillsByCategory = skills.reduce((acc, us) => {
//     const cat = us.skills?.category || 'Other'
//     if (!acc[cat]) acc[cat] = []
//     acc[cat].push(us)
//     return acc
//   }, {})

//   const proficiencyLabel = (level) => {
//     return ['', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'][level] || 'Beginner'
//   }

//   return (
//     <main style={{ maxWidth: '780px', margin: '0 auto', padding: '40px 24px' }}>

//       {/* Profile header card */}
//       <div style={{
//         background: theme.bg.card,
//         border: `1px solid ${theme.border.light}`,
//         borderRadius: '20px',
//         overflow: 'hidden',
//         marginBottom: '16px',
//       }}>
//         {/* Cover banner */}
//         <div style={{
//           height: '100px',
//           background: `linear-gradient(135deg, ${theme.action.primary}, #818CF8, ${theme.score.high})`,
//         }} />

//         {/* Avatar + info */}
//         <div style={{ padding: '0 28px 24px' }}>
//           <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '16px' }}>
//             <div style={{ marginTop: '-40px' }}>
//               <AvatarUpload
//                 currentAvatarUrl={profile?.avatar_url}
//                 fullName={profile?.full_name}
//               />
//             </div>
//             <div style={{ display: 'flex', gap: '8px', paddingBottom: '4px' }}>
//               <Link href={`/profile/${user.id}`} style={{
//                 padding: '7px 14px',
//                 background: 'none',
//                 border: `1px solid ${theme.border.light}`,
//                 borderRadius: '8px',
//                 fontSize: '13px',
//                 color: theme.text.secondary,
//                 textDecoration: 'none',
//                 fontWeight: 500,
//               }}>
//                 View public profile
//               </Link>
//               <Link href="/profile/edit" style={{
//                 padding: '7px 16px',
//                 background: theme.action.primary,
//                 color: '#fff',
//                 borderRadius: '8px',
//                 fontSize: '13px',
//                 fontWeight: 500,
//                 textDecoration: 'none',
//               }}>
//                 Edit profile
//               </Link>
//             </div>
//           </div>

//           <h1 style={{ fontSize: '22px', fontWeight: 700, color: theme.text.primary, margin: '0 0 4px', letterSpacing: '-0.3px' }}>
//             {profile?.full_name || 'Your Name'}
//           </h1>
//           {profile?.headline && (
//             <p style={{ fontSize: '15px', color: theme.text.secondary, margin: '0 0 8px' }}>
//               {profile.headline}
//             </p>
//           )}
//           <p style={{ fontSize: '13px', color: theme.text.tertiary, margin: '0 0 12px' }}>
//             @{profile?.username}
//           </p>

//           {/* Links row */}
//           <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
//             {profile?.university && (
//               <span style={{ fontSize: '13px', color: theme.text.secondary }}>🎓 {profile.university} {profile?.graduation_year ? `· ${profile.graduation_year}` : ''}</span>
//             )}
//             {profile?.github_url && (
//               <a href={profile.github_url} target="_blank" rel="noopener noreferrer"
//                 style={{ fontSize: '13px', color: theme.text.indigo, textDecoration: 'none' }}>
//                 💻 GitHub
//               </a>
//             )}
//             {profile?.linkedin_url && (
//               <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
//                 style={{ fontSize: '13px', color: theme.text.indigo, textDecoration: 'none' }}>
//                 🔗 LinkedIn
//               </a>
//             )}
//             {profile?.portfolio_url && (
//               <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer"
//                 style={{ fontSize: '13px', color: theme.text.indigo, textDecoration: 'none' }}>
//                 🌐 Portfolio
//               </a>
//             )}
//           </div>

//           {/* Shareable link */}
//           <div style={{
//             marginTop: '14px',
//             padding: '8px 14px',
//             background: theme.bg.indigoSoft,
//             borderRadius: '8px',
//             display: 'flex',
//             alignItems: 'center',
//             gap: '8px',
//             width: 'fit-content',
//           }}>
//             <span style={{ fontSize: '12px', color: theme.text.secondary }}>🔗 Public profile:</span>
//             <code style={{ fontSize: '12px', color: theme.text.indigo }}>
//               {`/profile/${user.id}`}
//             </code>
//             <CopyButton text={`${process.env.NEXT_PUBLIC_SITE_URL}/profile/${user.id}`} />
//           </div>
//         </div>
//       </div>

//       {/* Readiness score */}
//       <div style={{
//         background: theme.bg.card,
//         border: `1px solid ${theme.border.light}`,
//         borderRadius: '16px',
//         padding: '20px 24px',
//         marginBottom: '16px',
//       }}>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
//           <div>
//             <h2 style={{ fontSize: '15px', fontWeight: 600, color: theme.text.primary, margin: '0 0 3px' }}>Career readiness</h2>
//             <p style={{ fontSize: '13px', color: theme.text.secondary, margin: 0 }}>Based on your skills and completed projects</p>
//           </div>
//           <span style={{ fontSize: '32px', fontWeight: 700, color: scoreColor(score), letterSpacing: '-1px' }}>
//             {score}%
//           </span>
//         </div>
//         <div style={{ height: '8px', background: theme.border.light, borderRadius: '4px', overflow: 'hidden' }}>
//           <div style={{ height: '100%', width: `${score}%`, background: scoreColor(score), borderRadius: '4px', transition: 'width 0.6s ease' }} />
//         </div>
//         {score === 0 && (
//           <p style={{ fontSize: '13px', color: theme.text.secondary, margin: '12px 0 0' }}>
//             Upload your CV to calculate your score.{' '}
//             <Link href="/profile/edit" style={{ color: theme.text.indigo, textDecoration: 'none', fontWeight: 500 }}>
//               Go to profile edit →
//             </Link>
//           </p>
//         )}
//       </div>

//       {/* About */}
//       {profile?.bio && (
//         <div style={{
//           background: theme.bg.card,
//           border: `1px solid ${theme.border.light}`,
//           borderRadius: '16px',
//           padding: '20px 24px',
//           marginBottom: '16px',
//         }}>
//           <h2 style={{ fontSize: '15px', fontWeight: 600, color: theme.text.primary, margin: '0 0 10px' }}>About</h2>
//           <p style={{ fontSize: '14px', color: theme.text.secondary, margin: 0, lineHeight: 1.8 }}>
//             {profile.bio}
//           </p>
//         </div>
//       )}

//       {/* Skills */}
//       <div style={{
//         background: theme.bg.card,
//         border: `1px solid ${theme.border.light}`,
//         borderRadius: '16px',
//         padding: '20px 24px',
//         marginBottom: '16px',
//       }}>
//         <h2 style={{ fontSize: '15px', fontWeight: 600, color: theme.text.primary, margin: '0 0 16px' }}>
//           Skills ({skills.length})
//         </h2>
//         {skills.length === 0 ? (
//           <p style={{ fontSize: '14px', color: theme.text.tertiary, margin: 0 }}>
//             No skills yet — upload your CV to extract them automatically.
//           </p>
//         ) : (
//           <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
//             {Object.entries(skillsByCategory).map(([category, catSkills]) => (
//               <div key={category}>
//                 <div style={{ fontSize: '11px', fontWeight: 600, color: theme.text.tertiary, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
//                   {category}
//                 </div>
//                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
//                   {catSkills.map((us, i) => (
//                     <div key={i} style={{
//                       display: 'flex', alignItems: 'center', gap: '6px',
//                       padding: '5px 12px',
//                       background: us.source === 'Project' ? theme.bg.emeraldSoft : theme.bg.indigoSoft,
//                       border: `1px solid ${us.source === 'Project' ? '#D1FAE5' : theme.border.indigo}`,
//                       borderRadius: '8px',
//                     }}>
//                       <span style={{ fontSize: '13px', fontWeight: 500, color: us.source === 'Project' ? theme.text.emerald : theme.text.indigo }}>
//                         {us.skills?.name}
//                       </span>
//                       <span style={{ fontSize: '11px', color: theme.text.tertiary }}>
//                         {proficiencyLabel(us.proficiency_level)}
//                       </span>
//                       {us.source === 'Project' && (
//                         <span style={{ fontSize: '10px', color: theme.text.emerald }}>✓ Verified</span>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Project posts */}
//       <div style={{
//         background: theme.bg.card,
//         border: `1px solid ${theme.border.light}`,
//         borderRadius: '16px',
//         padding: '20px 24px',
//         marginBottom: '16px',
//       }}>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
//           <h2 style={{ fontSize: '15px', fontWeight: 600, color: theme.text.primary, margin: 0 }}>Posts</h2>
//         </div>
//         <ProjectPostForm userId={user.id} completedProjects={[
//           ...(myProjects?.filter(p => p.status === 'completed') || []),
//           ...(joinedProjects?.filter(jp => jp.projects?.status === 'completed').map(jp => jp.projects) || []),
//         ]} />
//         {posts && posts.length > 0 && (
//           <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
//             {posts.map(post => (
//               <PostCard key={post.id} post={post} isOwn={true} />
//             ))}
//           </div>
//         )}
//       </div>

//       {/* My projects */}
//       <div style={{
//         background: theme.bg.card,
//         border: `1px solid ${theme.border.light}`,
//         borderRadius: '16px',
//         padding: '20px 24px',
//         marginBottom: '16px',
//       }}>
//         <h2 style={{ fontSize: '15px', fontWeight: 600, color: theme.text.primary, margin: '0 0 16px' }}>My projects</h2>
//         {!myProjects || myProjects.length === 0 ? (
//           <p style={{ fontSize: '14px', color: theme.text.tertiary, margin: 0 }}>
//             No projects yet.{' '}
//             <Link href="/projects/create" style={{ color: theme.text.indigo, textDecoration: 'none', fontWeight: 500 }}>
//               Create one →
//             </Link>
//           </p>
//         ) : (
//           <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
//             {myProjects.map(project => (
//               <ProjectRow key={project.id} project={project} role="Owner" />
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Joined projects */}
//       {joinedProjects && joinedProjects.length > 0 && (
//         <div style={{
//           background: theme.bg.card,
//           border: `1px solid ${theme.border.light}`,
//           borderRadius: '16px',
//           padding: '20px 24px',
//         }}>
//           <h2 style={{ fontSize: '15px', fontWeight: 600, color: theme.text.primary, margin: '0 0 16px' }}>Joined projects</h2>
//           <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
//             {joinedProjects.map((jp, i) => (
//               <ProjectRow
//                 key={i}
//                 project={jp.projects}
//                 role={jp.role_in_project}
//                 joinedAt={jp.joined_at}
//               />
//             ))}
//           </div>
//         </div>
//       )}
//     </main>
//   )
// }

// function CopyButton({ text }) {
//   return (
//     <button
//       onClick={() => {
//         if (typeof window !== 'undefined') navigator.clipboard.writeText(text)
//       }}
//       style={{
//         fontSize: '11px',
//         padding: '2px 8px',
//         background: theme.action.primary,
//         color: '#fff',
//         border: 'none',
//         borderRadius: '4px',
//         cursor: 'pointer',
//       }}
//     >
//       Copy
//     </button>
//   )
// }

// function ProjectRow({ project, role, joinedAt }) {
//   if (!project) return null
//   const statusColors = {
//     open: { bg: theme.bg.indigoSoft, color: theme.text.indigo },
//     active: { bg: theme.bg.emeraldSoft, color: theme.text.emerald },
//     completed: { bg: theme.bg.emeraldSoft, color: theme.text.emerald },
//   }
//   const sc = statusColors[project.status] || statusColors.open

//   return (
//     <div style={{
//       display: 'flex',
//       alignItems: 'center',
//       gap: '12px',
//       padding: '12px 14px',
//       background: theme.bg.secondary,
//       border: `1px solid ${theme.border.light}`,
//       borderRadius: '10px',
//     }}>
//       <div style={{ flex: 1, minWidth: 0 }}>
//         <div style={{ fontSize: '14px', fontWeight: 500, color: theme.text.primary, marginBottom: '3px' }}>
//           {project.title}
//         </div>
//         <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
//           <span style={{ fontSize: '11px', padding: '1px 8px', borderRadius: '20px', background: sc.bg, color: sc.color, fontWeight: 500 }}>
//             {project.status}
//           </span>
//           {role && <span style={{ fontSize: '12px', color: theme.text.secondary }}>· {role}</span>}
//           {joinedAt && <span style={{ fontSize: '12px', color: theme.text.tertiary }}>· Joined {new Date(joinedAt).toLocaleDateString()}</span>}
//         </div>
//       </div>
//       <Link href={`/projects/${project.id}`} style={{
//         padding: '5px 12px',
//         background: theme.bg.card,
//         border: `1px solid ${theme.border.light}`,
//         borderRadius: '8px',
//         fontSize: '12px',
//         color: theme.text.primary,
//         textDecoration: 'none',
//         fontWeight: 500,
//         whiteSpace: 'nowrap',
//       }}>
//         View →
//       </Link>
//     </div>
//   )
// }

// function PostCard({ post, isOwn }) {
//   return (
//     <div style={{
//       padding: '16px',
//       background: theme.bg.secondary,
//       border: `1px solid ${theme.border.light}`,
//       borderRadius: '12px',
//     }}>
//       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
//         <h3 style={{ fontSize: '14px', fontWeight: 600, color: theme.text.primary, margin: 0 }}>
//           {post.title}
//         </h3>
//         <span style={{ fontSize: '12px', color: theme.text.tertiary }}>
//           {new Date(post.created_at).toLocaleDateString()}
//         </span>
//       </div>
//       <p style={{ fontSize: '14px', color: theme.text.secondary, margin: '0 0 10px', lineHeight: 1.7 }}>
//         {post.content}
//       </p>
//       {post.projects && (
//         <span style={{ fontSize: '12px', color: theme.text.indigo }}>
//           📁 {post.projects.title}
//         </span>
//       )}
//       {post.skills_highlighted?.length > 0 && (
//         <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
//           {post.skills_highlighted.map((skill, i) => (
//             <span key={i} style={{
//               fontSize: '11px', padding: '2px 8px',
//               background: theme.bg.indigoSoft, color: theme.text.indigo,
//               borderRadius: '20px', fontWeight: 500,
//             }}>
//               {skill}
//             </span>
//           ))}
//         </div>
//       )}
//     </div>
//   )
// }

import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Profile id is required' },
        { status: 400 }
      )
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        full_name,
        headline,
        avatar_url,
        cover_url,
        bio,
        location,
        availability_status,
        preferred_role,
        education_level,
        university,
        graduation_year,
        linkedin_url,
        github_url,
        portfolio_url,
        user_skills (
          id,
          proficiency_level,
          source,
          skills (
            id,
            name,
            category
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { profile },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}