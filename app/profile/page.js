// import { createClient } from '@/lib/supabase-server'
// import { redirect } from 'next/navigation'
// import Link from 'next/link'
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
//         id,
//         proficiency_level,
//         source,
//         skills ( name, category )
//       )
//     `)
//     .eq('id', user.id)
//     .single()

//   const skills = profile?.user_skills || []

//   function getScoreColor(s) {
//     if (s >= 70) return theme.score.high
//     if (s >= 40) return theme.score.medium
//     return theme.score.low
//   }

//   function getProficiencyLabel(level) {
//     const labels = { 1: 'Beginner', 2: 'Elementary', 3: 'Intermediate', 4: 'Advanced', 5: 'Expert' }
//     return labels[level] || 'Beginner'
//   }

//   function getSourceBadge(source) {
//     const badges = {
//       CV: { label: 'From CV', color: theme.text.indigo, bg: theme.bg.indigoSoft },
//       manual: { label: 'Manual', color: theme.text.secondary, bg: theme.bg.hover },
//       Project: { label: 'Project', color: theme.text.emerald, bg: theme.bg.emeraldSoft },
//     }
//     return badges[source] || badges.manual
//   }

//   const score = profile?.readiness_score || 0
//   const skillsByCategory = skills.reduce((acc, us) => {
//     const cat = us.skills?.category || 'Other'
//     if (!acc[cat]) acc[cat] = []
//     acc[cat].push(us)
//     return acc
//   }, {})

//   return (
//     <main style={{
//       maxWidth: '760px',
//       margin: '0 auto',
//       padding: '48px 24px',
//     }}>
//       {/* Header */}
//       <div style={{
//         display: 'flex',
//         alignItems: 'flex-start',
//         justifyContent: 'space-between',
//         marginBottom: '32px',
//         gap: '16px',
//       }}>
//         <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
//           {/* Avatar */}
//           <div style={{
//             width: '64px',
//             height: '64px',
//             background: `linear-gradient(135deg, ${theme.action.primary}, #818CF8)`,
//             borderRadius: '16px',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             fontSize: '24px',
//             color: theme.text.inverse,
//             fontWeight: 700,
//             flexShrink: 0,
//           }}>
//             {profile?.full_name?.[0]?.toUpperCase() || '?'}
//           </div>
//           <div>
//             <h1 style={{
//               fontSize: '22px',
//               fontWeight: 700,
//               color: theme.text.primary,
//               margin: '0 0 4px',
//               letterSpacing: '-0.3px',
//             }}>
//               {profile?.full_name || 'Your Name'}
//             </h1>
//             <p style={{
//               fontSize: '14px',
//               color: theme.text.secondary,
//               margin: '0 0 4px',
//             }}>
//               {profile?.headline || 'Add a headline'}
//             </p>
//             {profile?.username && (
//               <p style={{
//                 fontSize: '13px',
//                 color: theme.text.tertiary,
//                 margin: 0,
//               }}>
//                 @{profile.username}
//               </p>
//             )}
//           </div>
//         </div>

//         <Link href="/profile/edit" style={{
//           padding: '8px 16px',
//           background: theme.bg.hover,
//           color: theme.text.primary,
//           border: `1px solid ${theme.border.light}`,
//           borderRadius: '10px',
//           fontSize: '14px',
//           fontWeight: 500,
//           textDecoration: 'none',
//           whiteSpace: 'nowrap',
//           flexShrink: 0,
//         }}>
//           Edit profile
//         </Link>
//       </div>

//       {/* Readiness score */}
//       <div style={{
//         background: theme.bg.card,
//         border: `1px solid ${theme.border.light}`,
//         borderRadius: '16px',
//         padding: '24px',
//         marginBottom: '20px',
//       }}>
//         <div style={{
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           marginBottom: '16px',
//         }}>
//           <h2 style={{
//             fontSize: '15px',
//             fontWeight: 600,
//             color: theme.text.primary,
//             margin: 0,
//           }}>
//             Readiness score
//           </h2>
//           <span style={{
//             fontSize: '28px',
//             fontWeight: 700,
//             color: getScoreColor(score),
//             letterSpacing: '-0.5px',
//           }}>
//             {score}%
//           </span>
//         </div>

//         {/* Progress bar */}
//         <div style={{
//           height: '8px',
//           background: theme.border.light,
//           borderRadius: '4px',
//           overflow: 'hidden',
//         }}>
//           <div style={{
//             height: '100%',
//             width: `${score}%`,
//             background: getScoreColor(score),
//             borderRadius: '4px',
//             transition: 'width 0.6s ease',
//           }} />
//         </div>

//         <p style={{
//           fontSize: '13px',
//           color: theme.text.secondary,
//           margin: '12px 0 0',
//         }}>
//           {score === 0
//             ? 'Upload your CV to calculate your readiness score.'
//             : score >= 70
//             ? 'Strong profile — you are a great match for many opportunities.'
//             : 'Keep building skills and completing projects to improve your score.'}
//         </p>
//       </div>

//       {/* Skills */}
//       <div style={{
//         background: theme.bg.card,
//         border: `1px solid ${theme.border.light}`,
//         borderRadius: '16px',
//         padding: '24px',
//         marginBottom: '20px',
//       }}>
//         <div style={{
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           marginBottom: '20px',
//         }}>
//           <h2 style={{
//             fontSize: '15px',
//             fontWeight: 600,
//             color: theme.text.primary,
//             margin: 0,
//           }}>
//             Skills ({skills.length})
//           </h2>
//           <Link href="/profile/edit" style={{
//             fontSize: '13px',
//             color: theme.text.indigo,
//             textDecoration: 'none',
//             fontWeight: 500,
//           }}>
//             + Add skill
//           </Link>
//         </div>

//         {skills.length === 0 ? (
//           <div style={{
//             textAlign: 'center',
//             padding: '32px 0',
//           }}>
//             <div style={{ fontSize: '32px', marginBottom: '12px' }}>📄</div>
//             <p style={{
//               fontSize: '14px',
//               color: theme.text.secondary,
//               margin: '0 0 16px',
//             }}>
//               No skills yet. Upload your CV to extract them automatically.
//             </p>
//             <Link href="/profile/edit" style={{
//               background: theme.action.primary,
//               color: theme.action.primaryText,
//               padding: '8px 16px',
//               borderRadius: '8px',
//               fontSize: '14px',
//               fontWeight: 500,
//               textDecoration: 'none',
//             }}>
//               Upload CV
//             </Link>
//           </div>
//         ) : (
//           <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
//             {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
//               <div key={category}>
//                 <div style={{
//                   fontSize: '12px',
//                   fontWeight: 600,
//                   color: theme.text.secondary,
//                   textTransform: 'uppercase',
//                   letterSpacing: '0.6px',
//                   marginBottom: '10px',
//                 }}>
//                   {category}
//                 </div>
//                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
//                   {categorySkills.map((us, i) => {
//                     const badge = getSourceBadge(us.source)
//                     return (
//                       <div key={i} style={{
//                         display: 'flex',
//                         alignItems: 'center',
//                         gap: '6px',
//                         padding: '6px 12px',
//                         background: theme.bg.hover,
//                         border: `1px solid ${theme.border.light}`,
//                         borderRadius: '8px',
//                         fontSize: '13px',
//                       }}>
//                         <span style={{ color: theme.text.primary, fontWeight: 500 }}>
//                           {us.skills?.name}
//                         </span>
//                         <span style={{
//                           fontSize: '11px',
//                           color: badge.color,
//                           background: badge.bg,
//                           padding: '2px 6px',
//                           borderRadius: '4px',
//                           fontWeight: 500,
//                         }}>
//                           {getProficiencyLabel(us.proficiency_level)}
//                         </span>
//                       </div>
//                     )
//                   })}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* About */}
//       <div style={{
//         background: theme.bg.card,
//         border: `1px solid ${theme.border.light}`,
//         borderRadius: '16px',
//         padding: '24px',
//       }}>
//         <h2 style={{
//           fontSize: '15px',
//           fontWeight: 600,
//           color: theme.text.primary,
//           margin: '0 0 16px',
//         }}>
//           About
//         </h2>
//         <p style={{
//           fontSize: '14px',
//           color: theme.text.secondary,
//           margin: '0 0 20px',
//           lineHeight: 1.7,
//         }}>
//           {profile?.bio || 'No bio yet.'}
//         </p>

//         <div style={{
//           display: 'grid',
//           gridTemplateColumns: '1fr 1fr',
//           gap: '12px',
//         }}>
//           {profile?.university && (
//             <InfoItem icon="🎓" label="University" value={profile.university} />
//           )}
//           {profile?.education_level && (
//             <InfoItem icon="📚" label="Education" value={profile.education_level} />
//           )}
//           {profile?.graduation_year && (
//             <InfoItem icon="📅" label="Graduation" value={profile.graduation_year} />
//           )}
//           {profile?.github_url && (
//             <InfoItem icon="💻" label="GitHub" value="View profile" href={profile.github_url} />
//           )}
//           {profile?.linkedin_url && (
//             <InfoItem icon="🔗" label="LinkedIn" value="View profile" href={profile.linkedin_url} />
//           )}
//           {profile?.portfolio_url && (
//             <InfoItem icon="🌐" label="Portfolio" value="View site" href={profile.portfolio_url} />
//           )}
//         </div>
//       </div>
//     </main>
//   )
// }

// function InfoItem({ icon, label, value, href }) {
//   return (
//     <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
//       <span style={{ fontSize: '16px' }}>{icon}</span>
//       <div>
//         <div style={{
//           fontSize: '11px',
//           color: theme.text.tertiary,
//           fontWeight: 500,
//           textTransform: 'uppercase',
//           letterSpacing: '0.4px',
//         }}>
//           {label}
//         </div>
//         {href ? (
//           <a href={href} target="_blank" rel="noopener noreferrer" style={{
//             fontSize: '13px',
//             color: theme.text.indigo,
//             textDecoration: 'none',
//             fontWeight: 500,
//           }}>
//             {value}
//           </a>
//         ) : (
//           <div style={{ fontSize: '13px', color: theme.text.primary, fontWeight: 500 }}>
//             {value}
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { theme } from '@/constants/colors'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      full_name,
      username,
      headline,
      bio,
      education_level,
      university,
      graduation_year,
      github_url,
      linkedin_url,
      portfolio_url,
      readiness_score,
      user_skills (
        proficiency_level,
        source,
        skills ( name, category )
      )
    `)
    .eq('id', user.id)
    .single()

  const { data: myProjects } = await supabase
    .from('projects')
    .select('id, title, status, created_at')
    .eq('owner_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const { data: joinedProjects } = await supabase
    .from('project_members')
    .select(`
      id,
      role_in_project,
      joined_at,
      projects (
        id,
        title,
        status,
        deleted_at
      )
    `)
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  const skills = profile?.user_skills || []
  const score = profile?.readiness_score || 0

  const activeJoinedProjects =
    joinedProjects?.filter((member) => member.projects && !member.projects.deleted_at) || []

  function scoreColor(s) {
    if (s >= 70) return theme.score.high
    if (s >= 40) return theme.score.medium
    return theme.score.low
  }

  function ProjectCard({ project, role, joinedAt }) {
    return (
      <div style={{
        border: `1px solid ${theme.border.light}`,
        borderRadius: '12px',
        padding: '14px',
        background: theme.bg.hover,
      }}>
        <h3 style={{
          fontSize: '15px',
          fontWeight: 600,
          color: theme.text.primary,
          margin: '0 0 6px',
        }}>
          {project.title}
        </h3>

        <p style={{
          fontSize: '13px',
          color: theme.text.secondary,
          margin: '0 0 6px',
        }}>
          Status: {project.status}
        </p>

        {role && (
          <p style={{
            fontSize: '13px',
            color: theme.text.secondary,
            margin: '0 0 6px',
          }}>
            Role: {role}
          </p>
        )}

        {joinedAt && (
          <p style={{
            fontSize: '13px',
            color: theme.text.secondary,
            margin: '0 0 12px',
          }}>
            Joined: {new Date(joinedAt).toLocaleDateString()}
          </p>
        )}

        <Link href={`/projects/${project.id}`} style={{
          display: 'inline-block',
          padding: '7px 12px',
          background: theme.action.primary,
          color: theme.action.primaryText,
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 500,
          textDecoration: 'none',
        }}>
          View Project
        </Link>
      </div>
    )
  }

  return (
    <main style={{
      maxWidth: '720px',
      margin: '0 auto',
      padding: '48px 24px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '32px',
        gap: '16px',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '14px',
            background: `linear-gradient(135deg, ${theme.action.primary}, #818CF8)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}>
            {profile?.full_name?.[0]?.toUpperCase() || '?'}
          </div>

          <div>
            <h1 style={{
              fontSize: '20px',
              fontWeight: 700,
              color: theme.text.primary,
              margin: '0 0 4px',
              letterSpacing: '-0.3px',
            }}>
              {profile?.full_name || 'Your Name'}
            </h1>

            {profile?.headline && (
              <p style={{
                fontSize: '14px',
                color: theme.text.secondary,
                margin: '0 0 2px',
              }}>
                {profile.headline}
              </p>
            )}

            {profile?.username && (
              <p style={{
                fontSize: '13px',
                color: theme.text.tertiary,
                margin: 0,
              }}>
                @{profile.username}
              </p>
            )}
          </div>
        </div>

        <Link href="/profile/edit" style={{
          padding: '8px 16px',
          background: theme.bg.hover,
          border: `1px solid ${theme.border.light}`,
          borderRadius: '10px',
          fontSize: '14px',
          fontWeight: 500,
          color: theme.text.primary,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}>
          Edit profile
        </Link>
      </div>

      {/* Readiness score */}
      <div style={{
        background: theme.bg.card,
        border: `1px solid ${theme.border.light}`,
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '16px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}>
          <span style={{
            fontSize: '14px',
            fontWeight: 600,
            color: theme.text.primary,
          }}>
            Readiness score
          </span>

          <span style={{
            fontSize: '26px',
            fontWeight: 700,
            color: scoreColor(score),
            letterSpacing: '-0.5px',
          }}>
            {score}%
          </span>
        </div>

        <div style={{
          height: '6px',
          background: theme.border.light,
          borderRadius: '3px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${score}%`,
            background: scoreColor(score),
            borderRadius: '3px',
          }} />
        </div>

        {score === 0 && (
          <p style={{
            fontSize: '13px',
            color: theme.text.secondary,
            margin: '12px 0 0',
          }}>
            Upload your CV to calculate your score.{' '}
            <Link href="/profile/edit" style={{
              color: theme.text.indigo,
              textDecoration: 'none',
              fontWeight: 500,
            }}>
              Go to profile edit →
            </Link>
          </p>
        )}
      </div>

      {/* Skills */}
      <div style={{
        background: theme.bg.card,
        border: `1px solid ${theme.border.light}`,
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '16px',
      }}>
        <h2 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: theme.text.primary,
          margin: '0 0 16px',
        }}>
          Skills ({skills.length})
        </h2>

        {skills.length === 0 ? (
          <p style={{
            fontSize: '14px',
            color: theme.text.secondary,
            margin: 0,
          }}>
            No skills yet. They will appear here after your CV is analyzed.
          </p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {skills.map((us, i) => (
              <span key={i} style={{
                padding: '5px 12px',
                background: theme.bg.indigoSoft,
                color: theme.text.indigo,
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
              }}>
                {us.skills?.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* About */}
      <div style={{
        background: theme.bg.card,
        border: `1px solid ${theme.border.light}`,
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '16px',
      }}>
        <h2 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: theme.text.primary,
          margin: '0 0 12px',
        }}>
          About
        </h2>

        <p style={{
          fontSize: '14px',
          color: theme.text.secondary,
          margin: '0 0 16px',
          lineHeight: 1.7,
        }}>
          {profile?.bio || 'No bio yet.'}
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          {profile?.university && (
            <span style={{ fontSize: '13px', color: theme.text.secondary }}>
              🎓 {profile.university}{profile?.graduation_year ? ` · ${profile.graduation_year}` : ''}
            </span>
          )}

          {profile?.github_url && (
            <a href={profile.github_url} target="_blank" rel="noopener noreferrer" style={{
              fontSize: '13px',
              color: theme.text.indigo,
              textDecoration: 'none',
            }}>
              💻 GitHub →
            </a>
          )}

          {profile?.linkedin_url && (
            <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" style={{
              fontSize: '13px',
              color: theme.text.indigo,
              textDecoration: 'none',
            }}>
              🔗 LinkedIn →
            </a>
          )}

          {profile?.portfolio_url && (
            <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" style={{
              fontSize: '13px',
              color: theme.text.indigo,
              textDecoration: 'none',
            }}>
              🌐 Portfolio →
            </a>
          )}
        </div>
      </div>

      {/* My Projects */}
      <section style={{
        background: theme.bg.card,
        border: `1px solid ${theme.border.light}`,
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '16px',
      }}>
        <h2 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: theme.text.primary,
          margin: '0 0 16px',
        }}>
          My Projects
        </h2>

        {!myProjects || myProjects.length === 0 ? (
          <p style={{ fontSize: '14px', color: theme.text.secondary, margin: 0 }}>
            You have not created any projects yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {myProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

      {/* Joined Projects */}
      <section style={{
        background: theme.bg.card,
        border: `1px solid ${theme.border.light}`,
        borderRadius: '16px',
        padding: '20px 24px',
      }}>
        <h2 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: theme.text.primary,
          margin: '0 0 16px',
        }}>
          Joined Projects
        </h2>

        {activeJoinedProjects.length === 0 ? (
          <p style={{ fontSize: '14px', color: theme.text.secondary, margin: 0 }}>
            You have not joined any projects yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeJoinedProjects.map((member) => (
              <ProjectCard
                key={member.id}
                project={member.projects}
                role={member.role_in_project}
                joinedAt={member.joined_at}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}