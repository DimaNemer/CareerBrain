import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { theme } from '@/constants/colors'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function PublicProfilePage({ params }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      id, username, full_name, headline, avatar_url, bio,
      education_level, university, graduation_year,major,
      linkedin_url, github_url, portfolio_url,
      user_skills (
        proficiency_level, source,
        skills ( name, category )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !profile) notFound()

  // Completed projects as member
  const { data: memberCompleted } = await supabase
    .from('project_members')
    .select(`
      role_in_project, joined_at,
      projects (
        id, title, description, status,
        project_roles ( role_title, skills ( name ) )
      )
    `)
    .eq('user_id', id)
    .is('left_at', null)

  // Completed projects as owner
  const { data: ownedCompleted } = await supabase
    .from('projects')
    .select(`
      id, title, description, status,
      project_roles ( role_title, skills ( name ) )
    `)
    .eq('owner_id', id)
    .eq('status', 'completed')
    .is('deleted_at', null)

    //certificate
    const { data: certificates = [] } = await supabase
  .from('user_certificates')
  .select(`
    id,
    name,
    issuing_organization,
    issue_date,
    expiration_date,
    credential_id,
    credential_url
  `)
  .eq('user_id', id)
  .order('issue_date', {
    ascending: false,
    nullsFirst: false,
  })

  // Posts
const { data: posts } = await supabase
  .from('project_posts')
  .select(`
    id,
    title,
    content,
    skills_highlighted,
    image_url,
    created_at,
    projects (
      id,
      title
    )
  `)
  .eq('user_id', id)
  .order('created_at', {
    ascending: false,
  })

  const skills = profile.user_skills || []
  const verifiedSkills = skills.filter(s => s.source === 'Project')

  const allCompleted = [
    ...(ownedCompleted?.map(p => ({ ...p, role: 'Owner' })) || []),
    ...(memberCompleted
      ?.filter(mp => mp.projects?.status === 'completed')
      .map(mp => ({ ...mp.projects, role: mp.role_in_project })) || []),
  ]

  const skillsByCategory = skills.reduce((acc, us) => {
    const cat = us.skills?.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(us)
    return acc
  }, {})

  const initials = profile.full_name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  return (
    <div style={{ background: '#F1F3F7', minHeight: '100vh', paddingBottom: '60px' }}>

<div
  style={{
    maxWidth: '860px',
    margin: '0 auto',
    padding: '24px 24px 0',
  }}
>
  <Link
    href="/projects"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      color: '#64748B',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: 500,
      transition: 'color 0.15s',
    }}
  >
    <ArrowLeft size={18} />
    Back to Projects
  </Link>
</div>

      {/* Hero */}
      <div style={{
  background: `
    radial-gradient(circle at 18% 35%, rgba(129,140,248,0.22), transparent 38%),
    radial-gradient(circle at 85% 10%, rgba(99,102,241,0.18), transparent 35%),
    linear-gradient(135deg, #211D59 0%, #37319A 55%, #111936 100%)
  `,
  position: 'relative',
  overflow: 'hidden',
}}>
        {/* Dot grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px 52px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '28px', flexWrap: 'wrap' }}>

            {/* Avatar */}
            <div style={{ flexShrink: 0 }}>
              <div style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                border: '3px solid rgba(91,79,232,0.5)',
                overflow: 'hidden',
                background: profile.avatar_url
                  ? 'transparent'
                  : 'linear-gradient(135deg, #5B4FE8, #818CF8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 4px rgba(91,79,232,0.15), 0 8px 24px rgba(0,0,0,0.3)',
              }}>
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: '32px', fontWeight: 800, color: '#fff' }}>
                    {initials}
                  </span>
                )}
              </div>
            </div>

            {/* Identity */}
            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <h1 style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: '#fff',
                  margin: 0,
                  letterSpacing: '-0.5px',
                  lineHeight: 1.1,
                }}>
                  {profile.full_name}
                </h1>
                {allCompleted.length > 0 && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '20px',
                    background: 'rgba(11,173,114,0.15)',
                    color: '#34D399',
                    border: '1px solid rgba(11,173,114,0.3)',
                    letterSpacing: '0.3px',
                  }}>
                    {allCompleted.length} project{allCompleted.length > 1 ? 's' : ''} shipped
                  </span>
                )}
              </div>

              {profile.headline && (
                <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)', margin: '0 0 6px' }}>
                  {profile.headline}
                </p>
              )}
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', margin: '0 0 18px' }}>
                @{profile.username}
              </p>

              {/* Links */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
               
                {profile.github_url && (
                  <a href={profile.github_url} target="_blank" rel="noopener noreferrer" style={{
                    fontSize: '13px', color: '#818CF8',
                    textDecoration: 'none', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}>
                    GitHub ↗
                  </a>
                )}
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" style={{
                    fontSize: '13px', color: '#818CF8',
                    textDecoration: 'none', fontWeight: 600,
                  }}>
                    LinkedIn ↗
                  </a>
                )}
                {profile.portfolio_url && (
                  <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" style={{
                    fontSize: '13px', color: '#818CF8',
                    textDecoration: 'none', fontWeight: 600,
                  }}>
                    Portfolio ↗
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div style={{
            display: 'flex',
            gap: '0',
            marginTop: '32px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            overflow: 'hidden',
          }}>
            {[
              { label: 'Skills', value: skills.length },
              { label: 'Verified', value: verifiedSkills.length },
              { label: 'Shipped', value: allCompleted.length },
              { label: 'Posts', value: posts?.length || 0 },
            ].map((stat, i) => (
              <div key={i} style={{
                flex: 1,
                padding: '16px 12px',
                textAlign: 'center',
                borderRight: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              }}>
                <div style={{
                  fontSize: '24px', fontWeight: 700, color: '#fff',
                  letterSpacing: '-0.5px',
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: '11px', color: 'rgba(255,255,255,0.4)',
                  fontWeight: 500, textTransform: 'uppercase',
                  letterSpacing: '0.5px', marginTop: '2px',
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '28px 24px 0' }}>

        {/* About */}
        {profile.bio && (
          <div style={{
            background: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '20px',
            padding: '24px 28px',
            marginBottom: '16px',
          }}>
            <SectionTitle>About</SectionTitle>
            <p style={{ fontSize: '15px', color: '#374151', margin: 0, lineHeight: 1.8 }}>
              {profile.bio}
            </p>
          </div>
        )}
{(
  profile.education_level ||
  profile.major ||
  profile.university ||
  profile.graduation_year
) && (
  <div
    style={{
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '20px',
      padding: '24px 28px',
      marginBottom: '16px',
    }}
  >
    <SectionTitle>Education</SectionTitle>

    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        padding: '18px',
        background:
          'linear-gradient(135deg, #F8FAFC, #EEF2FF)',
        border: '1px solid #E0E7FF',
        borderRadius: '15px',
      }}
    >
      <div
        style={{
          width: '46px',
          height: '46px',
          borderRadius: '13px',
          background: '#FFFFFF',
          border: '1px solid #DDE3FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '21px',
          flexShrink: 0,
        }}
      >
        🎓
      </div>

      <div>
        <h3
          style={{
            margin: '0 0 5px',
            fontSize: '15px',
            color: '#111827',
            fontWeight: 700,
          }}
        >
          {[
            profile.education_level,
            profile.major,
          ]
            .filter(Boolean)
            .join(' in ')}
        </h3>

        {profile.university && (
          <p
            style={{
              margin: '0 0 5px',
              color: '#4B5563',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            {profile.university}
          </p>
        )}

        {profile.graduation_year && (
          <span
            style={{
              color: '#7C3AED',
              background: '#F3E8FF',
              padding: '3px 9px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            Graduation {profile.graduation_year}
          </span>
        )}
      </div>
    </div>
  </div>
)}
        {/* Completed projects */}
        {allCompleted.length > 0 && (
          <div style={{
            background: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '20px',
            padding: '24px 28px',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <SectionTitle>Projects shipped</SectionTitle>
              <span style={{
                fontSize: '12px', fontWeight: 600,
                color: '#059669', background: '#ECFDF5',
                padding: '2px 8px', borderRadius: '20px',
              }}>
                {allCompleted.length} completed
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {allCompleted.map((project, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '16px 18px',
                  background: '#F9FAFB',
                  border: '1px solid #ECFDF5',
                  borderRadius: '14px',
                  borderLeft: '3px solid #10B981',
                }}>
                  <div style={{
                    width: '40px', height: '40px',
                    borderRadius: '12px',
                    background: '#ECFDF5',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px', flexShrink: 0,
                  }}>
                    ✅
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '15px', fontWeight: 700,
                      color: '#111827', marginBottom: '4px',
                    }}>
                      {project.title}
                    </div>
                    {project.description && (
                      <p style={{
                        fontSize: '13px', color: '#6B7280',
                        margin: '0 0 10px', lineHeight: 1.6,
                      }}>
                        {project.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 700,
                        padding: '3px 10px', borderRadius: '20px',
                        background: '#ECFDF5', color: '#065F46',
                        border: '1px solid #A7F3D0',
                      }}>
                        ✓ {project.role || 'Member'}
                      </span>
                      {project.project_roles?.slice(0, 4).map((pr, j) => pr.skills?.name && (
                        <span key={j} style={{
                          fontSize: '11px', padding: '3px 8px',
                          background: '#EEF2FF', color: '#4338CA',
                          borderRadius: '20px', fontWeight: 500,
                        }}>
                          {pr.skills.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Posts */}
        {posts && posts.length > 0 && (
          <div style={{
            background: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '20px',
            padding: '24px 28px',
            marginBottom: '16px',
          }}>
 
            <SectionTitle count={posts.length}>Posts</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {posts.map(post => (
                <div key={post.id} style={{
                  padding: '18px 20px',
                  background: '#F9FAFB',
                  border: '1px solid #F3F4F6',
                  borderRadius: '14px',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '12px',
                    marginBottom: '10px',
                  }}>
                    <h3 style={{
                      fontSize: '14px', fontWeight: 700,
                      color: '#111827', margin: 0, lineHeight: 1.4,
                    }}>
                      {post.title}
                    </h3>
                    <span style={{
                      fontSize: '11px', color: '#9CA3AF',
                      whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                      {new Date(post.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                  </div>
                  <p style={{
                    fontSize: '14px', color: '#4B5563',
                    margin: '0 0 12px', lineHeight: 1.75,
                  }}>
                    {post.content}
                  </p>
                  {post.image_url && (
  <div
    style={{
      marginBottom: '12px',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid #E5E7EB',
      background: '#FFFFFF',
    }}
  >
    <img
      src={post.image_url}
      alt={post.title}
      style={{
        display: 'block',
        width: '100%',
        maxHeight: '460px',
        objectFit: 'cover',
      }}
    />
  </div>
)}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {post.projects && (
                      <span style={{
                        fontSize: '12px', color: '#5B4FE8', fontWeight: 500,
                      }}>
                        📁 {post.projects.title}
                      </span>
                    )}
                    {post.skills_highlighted?.map((s, i) => (
                      <span key={i} style={{
                        fontSize: '11px', padding: '2px 8px',
                        background: '#EEF2FF', color: '#4338CA',
                        borderRadius: '20px', fontWeight: 500,
                      }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div style={{
            background: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '20px',
            padding: '24px 28px',
            marginBottom: '16px',
          }}>
            <SectionTitle count={skills.length}>Skills</SectionTitle>

            {verifiedSkills.length > 0 && (
              <div style={{
                padding: '12px 16px',
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: '12px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <span style={{ fontSize: '16px' }}>✓</span>
                <p style={{ fontSize: '13px', color: '#065F46', margin: 0, fontWeight: 500 }}>
                  {verifiedSkills.length} skill{verifiedSkills.length > 1 ? 's' : ''} verified through real team projects
                </p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {Object.entries(skillsByCategory).map(([category, catSkills]) => (
                <div key={category}>
                  <div style={{
                    fontSize: '11px', fontWeight: 700,
                    color: '#9CA3AF', textTransform: 'uppercase',
                    letterSpacing: '0.8px', marginBottom: '10px',
                  }}>
                    {category}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {catSkills.map((us, i) => {
                      const isVerified = us.source === 'Project'
                      return (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '6px 14px',
                          background: isVerified ? '#ECFDF5' : '#EEF2FF',
                          border: `1.5px solid ${isVerified ? '#6EE7B7' : '#C7D2FE'}`,
                          borderRadius: '10px',
                        }}>
                          {isVerified && (
                            <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>✓</span>
                          )}
                          <span style={{
                            fontSize: '13px', fontWeight: 600,
                            color: isVerified ? '#065F46' : '#3730A3',
                          }}>
                            {us.skills?.name}
                          </span>
                          <span style={{
                            fontSize: '10px',
                            color: isVerified ? '#10B981' : '#818CF8',
                            fontWeight: 500,
                          }}>
                            {isVerified
                              ? 'Verified'
                              : ['', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'][us.proficiency_level] || ''}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
{certificates.length > 0 && (
  <div
    style={{
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '20px',
      padding: '24px 28px',
      marginBottom: '16px',
    }}
  >
    <SectionTitle count={certificates.length}>
      Licenses & certifications
    </SectionTitle>

    <div
      style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '12px',
      }}
    >
      {certificates.map(certificate => (
        <div
          key={certificate.id}
          style={{
            padding: '17px',
            border: '1px solid #E5E7EB',
            borderRadius: '14px',
            background: '#FCFCFD',
            display: 'flex',
            gap: '13px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '11px',
              background: '#FFF7ED',
              color: '#EA580C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: '18px',
            }}
          >
            ◈
          </div>

          <div style={{ minWidth: 0 }}>
            <h3
              style={{
                margin: '0 0 4px',
                color: '#111827',
                fontSize: '14px',
              }}
            >
              {certificate.name}
            </h3>

            {certificate.issuing_organization && (
              <p
                style={{
                  margin: '0 0 6px',
                  color: '#6B7280',
                  fontSize: '12px',
                }}
              >
                {certificate.issuing_organization}
              </p>
            )}

            {certificate.issue_date && (
              <div
                style={{
                  color: '#9CA3AF',
                  fontSize: '11px',
                }}
              >
                Issued{' '}
                {new Date(
                  certificate.issue_date
                ).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
            )}

            {certificate.credential_url && (
              <a
                href={certificate.credential_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  marginTop: '9px',
                  color: '#5B4FE8',
                  fontSize: '11px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                View credential ↗
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
)}
        {/* Empty state — if profile has nothing yet */}
        {skills.length === 0 && allCompleted.length === 0 && (!posts || posts.length === 0) && !profile.bio && (
          <div style={{
            textAlign: 'center',
            padding: '60px 24px',
            background: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '20px',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🌱</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
              Just getting started
            </h3>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
              This profile is still being built. Check back soon.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function SectionTitle({ children, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
      <h2 style={{
        fontSize: '16px', fontWeight: 700,
        color: '#111827', margin: 0, letterSpacing: '-0.2px',
      }}>
        {children}
      </h2>
      {count !== undefined && count > 0 && (
        <span style={{
          fontSize: '12px', fontWeight: 600,
          color: '#5B4FE8', background: '#EEF2FF',
          padding: '2px 8px', borderRadius: '20px',
        }}>
          {count}
        </span>
      )}
    </div>
  )
}