

import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

import AvatarUpload from '@/components/profile/AvatarUpload'
import CopyButton from '@/components/profile/CopyButton'
import ProjectPostForm from '@/components/profile/ProjectPostForm'

export default async function PrivateProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      *,
      user_skills (
        id,
        proficiency_level,
        proficiency_score,
        evidence,
        source,
        skills (
          id,
          name,
          category
        )
      )
    `)
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Private profile error:', profileError)

  }

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
    .eq('user_id', user.id)
    .order('issue_date', {
      ascending: false,
      nullsFirst: false,
    })

  const { data: ownedProjects = [] } = await supabase
    .from('projects')
    .select(`
      id,
      title,
      description,
      status,
      created_at
    `)
    .eq('owner_id', user.id)
    .is('deleted_at', null)
    .order('created_at', {
      ascending: false,
    })

  const { data: joinedProjects = [] } = await supabase
    .from('project_members')
    .select(`
      role_in_project,
      joined_at,
      projects (
        id,
        title,
        description,
        status,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .is('left_at', null)
    .order('joined_at', {
      ascending: false,
    })

  const { data: posts = [] } = await supabase
    .from('project_posts')
    .select(`
      id,
      title,
      content,
      skills_highlighted,
      image_url,
      image_path,
      created_at,
      projects (
        id,
        title
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', {
      ascending: false,
    })

  const score = profile?.readiness_score || 0
  const categoryScores = profile?.category_scores || {}
  const skills = profile?.user_skills || []

  const verifiedSkills = skills.filter(
    skill => skill.source === 'Project'
  )

  const completedProjects = [
    ...ownedProjects.filter(
      project => project.status === 'completed'
    ),
    ...joinedProjects
      .filter(
        row => row.projects?.status === 'completed'
      )
      .map(row => row.projects),
  ]

  const initials =
    profile?.full_name
      ?.split(' ')
      .filter(Boolean)
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'

  const skillsByCategory = skills.reduce((acc, us) => {
    const cat = us.skills?.category || 'Other relevant professional skills'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(us)
    return acc
  }, {})

  function getProficiencyLabel(level) {
    const labels = { 1: 'Beginner', 2: 'Elementary', 3: 'Intermediate', 4: 'Advanced', 5: 'Expert' }
    return labels[level] || 'Beginner'
  }

  const categoryLabels = {
    technical: 'Technical Skills',
    communication: 'Communication Skills',
    softSkills: 'Soft Skills',
    language: 'Language Skills',
    leadership: 'Leadership & Management',
    tools: 'Tools & Software',
    domainKnowledge: 'Domain Knowledge'
  }

  const recommendations = []
  if (skills.length > 0) {
    if ((categoryScores.technical || 0) < 60) {
      recommendations.push({
        category: 'Technical Skills',
        text: 'Include technical projects demonstrating practical experience or add more technical programming languages/frameworks.'
      })
    }
    if ((categoryScores.communication || 0) < 60) {
      recommendations.push({
        category: 'Communication Skills',
        text: 'Add more evidence of communication skills, such as presentation experience, public speaking, or technical writing.'
      })
    }
    if ((categoryScores.softSkills || 0) < 60) {
      recommendations.push({
        category: 'Soft Skills',
        text: 'Highlight key professional soft skills like teamwork, problem-solving, or time management.'
      })
    }
    if ((categoryScores.language || 0) < 60) {
      recommendations.push({
        category: 'Language Skills',
        text: 'Add your language proficiencies (e.g. English, French) to complete your communication profile.'
      })
    }
    if ((categoryScores.leadership || 0) < 60) {
      recommendations.push({
        category: 'Leadership & Management',
        text: 'Include leadership or project management experience, such as mentoring, project lead roles, or scrum management.'
      })
    }
    if ((categoryScores.tools || 0) < 60) {
      recommendations.push({
        category: 'Tools & Software',
        text: 'Mention modern developer tools and software you use day-to-day (e.g. Git, Docker, Figma, Supabase).'
      })
    }
    if ((categoryScores.domainKnowledge || 0) < 60) {
      recommendations.push({
        category: 'Domain Knowledge',
        text: 'Include industry-specific domain knowledge relevant to your target positions (e.g. finance, healthcare, AI).'
      })
    }

  }



  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F1F3F7',
        paddingBottom: '60px',
      }}
    >
      <div
        style={{
        background:
  'linear-gradient(135deg, #211D59 0%, #37319A 55%, #111936 100%)',
          padding: '40px 24px',
        }}
      >
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginBottom: '28px',
            }}
          >
            <Link
              href={`/profile/${user.id}`}
              style={{
                padding: '8px 15px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '9px',
                color: '#FFFFFF',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              View public profile
            </Link>

            <Link
              href="/profile/edit"
              style={{
                padding: '8px 15px',
                background: '#5B4FE8',
                borderRadius: '9px',
                color: '#FFFFFF',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              Edit profile
            </Link>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '24px',
              flexWrap: 'wrap',
            }}
          >
            <AvatarUpload
              currentAvatarUrl={profile?.avatar_url}
              fullName={profile?.full_name}
            />

            <div
              style={{
                flex: 1,
                minWidth: '220px',
              }}
            >
              <h1
                style={{
                  margin: '0 0 6px',
                  color: '#FFFFFF',
                  fontSize: '28px',
                  fontWeight: 800,
                }}
              >
                {profile?.full_name || 'Your name'}
              </h1>

              {profile?.headline && (
                <p
                  style={{
                    margin: '0 0 7px',
                    color: 'rgba(255,255,255,0.65)',
                    fontSize: '15px',
                  }}
                >
                  {profile.headline}
                </p>
              )}

              <p
                style={{
                  margin: 0,
                  color: 'rgba(255,255,255,0.35)',
                  fontSize: '13px',
                }}
              >
                @{profile?.username || 'username'}
              </p>
            </div>

            <div
              style={{
                minWidth: '160px',
                textAlign: 'center',
                padding: '18px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
              }}
            >
              <div
                style={{
                  color: '#10B981',
                  fontSize: '42px',
                  fontWeight: 800,
                }}
              >
                {profile?.readiness_score || 0}%
              </div>

              <div
                style={{
                  color: 'rgba(255,255,255,0.45)',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Readiness score
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              marginTop: '28px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              overflow: 'hidden',
            }}
          >
            <Stat
              label="Skills"
              value={skills.length}
            />

            <Stat
              label="Verified"
              value={verifiedSkills.length}
            />

            <Stat
              label="Owned projects"
              value={ownedProjects.length}
            />

            <Stat
              label="Joined projects"
              value={joinedProjects.length}
              last
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '16px',
            }}
          >
            <span
              style={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: '12px',
              }}
            >
              Public profile:
            </span>

            <code
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.65)',
                fontSize: '11px',
              }}
            >
              /profile/{user.id}
            </code>

            <CopyButton
              text={`${process.env.NEXT_PUBLIC_SITE_URL || ''}/profile/${user.id}`}
            />
          </div>
        </div>
      </div>

      <main
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '28px 24px 0',
        }}
      >
        {profile?.bio && (
          <Section title="About">
            <p
              style={{
                margin: 0,
                color: '#4B5563',
                fontSize: '14px',
                lineHeight: 1.8,
              }}
            >
              {profile.bio}
            </p>
          </Section>
        )}

        {skills.length > 0 && Object.keys(categoryScores).length > 0 && (
          <Section title="Readiness Score Breakdown">
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px',
            }}>
              {Object.entries(categoryLabels).map(([key, label]) => {
                const catScore = categoryScores[key] || 0
                return (
                  <div key={key} style={{
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '11px',
                    padding: '12px 14px',
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px',
                    }}>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#4B5563',
                      }}>
                        {label}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: catScore >= 70 ? '#059669' : catScore >= 40 ? '#D97706' : '#DC2626',
                      }}>
                        {catScore}%
                      </span>
                    </div>
                    <div style={{
                      height: '5px',
                      background: '#E5E7EB',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${catScore}%`,
                        background: catScore >= 70 ? '#10B981' : catScore >= 40 ? '#F59E0B' : '#EF4444',
                        borderRadius: '3px',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>
        )}

        {recommendations.length > 0 && (
          <Section title="Recommended Actions for Improvement" count={recommendations.length}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recommendations.map((rec, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px 14px',
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: '11px',
                }}>
                  <span style={{ fontSize: '16px', marginTop: '2px' }}>💡</span>
                  <div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#B45309',
                      display: 'block',
                      marginBottom: '2px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                    }}>
                      {rec.category}
                    </span>
                    <span style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.5 }}>
                      {rec.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section
          title="Create post"
          description="Share an achievement or completed project."
        >
          <ProjectPostForm
            completedProjects={completedProjects}
          />
        </Section>

        <Section
          title="Your posts"
          count={posts.length}
        >
          {posts.length === 0 ? (
            <EmptyState
              icon="✍️"
              message="You have not created any posts yet."
            />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                />
              ))}
            </div>
          )}
        </Section>
{certificates.length > 0 && (
 <Section
  title="Licenses & certifications"
  count={certificates.length}
  action={
    <Link
      href="/profile/edit"
      style={{
        color: '#37319A',
        textDecoration: 'none',
        fontSize: '12px',
        fontWeight: 700,
      }}
    >
      Manage →
    </Link>
  }
>
  {certificates.length === 0 ? (
    <EmptyState
      icon="🏅"
      message="No certificates added yet. Add one from Edit Profile."
    />
  ) : (
    <CertificateList
      certificates={certificates}
    />
  )}
</Section>
)}
        <Section
          title="Owned projects"
          count={ownedProjects.length}
          action={
            <Link
              href="/projects/create"
              style={{
                color: '#5B4FE8',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              + New project
            </Link>
          }
        >
          {ownedProjects.length === 0 ? (
            <EmptyState
              icon="🚀"
              message="You have not created any projects yet."
            />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {ownedProjects.map(project => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  role="Owner"
                />
              ))}
            </div>
          )}
        </Section>

        <Section
          title="Joined projects"
          count={joinedProjects.length}
        >
          {joinedProjects.length === 0 ? (
            <EmptyState
              icon="👥"
              message="You have not joined any projects yet."
            />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {joinedProjects.map((row, index) => (
                <ProjectRow
                  key={row.projects?.id || index}
                  project={row.projects}
                  role={row.role_in_project || 'Member'}
                />
              ))}
            </div>
          )}
        </Section>

        <Section
          title="Skills"
          count={skills.length}
          action={
            <div style={{ display: 'flex', gap: '14px' }}>
              <Link
                href="/upload-cv"
                style={{
                  color: '#5B4FE8',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                {skills.length > 0 ? '↻ Re-upload CV' : '📄 Upload CV'}
              </Link>
              <Link
                href="/profile/edit"
                style={{
                  color: '#5B4FE8',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                + Add skill
              </Link>
            </div>
          }
        >
          {skills.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <EmptyState
                icon="⚡"
                message="No skills have been added yet. Upload your CV to extract them automatically."
              />
              <Link
                href="/upload-cv"
                style={{
                  display: 'inline-block',
                  marginTop: '12px',
                  padding: '8px 18px',
                  background: '#5B4FE8',
                  color: '#FFFFFF',
                  borderRadius: '9px',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                Upload CV
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {Object.entries(skillsByCategory).map(([category, catSkills]) => (
                <div key={category}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#9CA3AF',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    marginBottom: '10px',
                  }}>
                    {category}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {catSkills.map((us, i) => {
                      const isVerified = us.source === 'Project'
                      return (
                        <div key={i} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          background: isVerified ? '#ECFDF5' : '#EEF2FF',
                          border: `1.5px solid ${isVerified ? '#6EE7B7' : '#C7D2FE'}`,
                          borderRadius: '10px',
                        }}>
                          {isVerified && (
                            <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>✓</span>
                          )}
                          <span style={{
                            fontSize: '13px',
                            fontWeight: 600,
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
                              : getProficiencyLabel(us.proficiency_level)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </main>
    </div>
  )
}

function Stat({
  label,
  value,
  last = false,
}) {
  return (
    <div
      style={{
        padding: '15px 10px',
        textAlign: 'center',
        borderRight: last
          ? 'none'
          : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        style={{
          color: '#FFFFFF',
          fontSize: '22px',
          fontWeight: 800,
        }}
      >
        {value}
      </div>

      <div
        style={{
          color: 'rgba(255,255,255,0.4)',
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginTop: '2px',
        }}
      >
        {label}
      </div>
    </div>
  )
}

function Section({
  title,
  count,
  description,
  action,
  children,
}) {
  return (
    <section
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '18px',
        padding: '22px',
        marginBottom: '17px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
          marginBottom: '17px',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <h2
              style={{
                margin: 0,
                color: '#111827',
                fontSize: '15px',
              }}
            >
              {title}
            </h2>

            {count !== undefined && (
              <span
                style={{
                  padding: '2px 7px',
                  borderRadius: '20px',
                  background: '#EEF2FF',
                  color: '#4338CA',
                  fontSize: '10px',
                  fontWeight: 700,
                }}
              >
                {count}
              </span>
            )}
          </div>

          {description && (
            <p
              style={{
                margin: '4px 0 0',
                color: '#9CA3AF',
                fontSize: '11px',
              }}
            >
              {description}
            </p>
          )}
        </div>

        {action}
      </div>

      {children}
    </section>
  )
}

function ProjectRow({
  project,
  role,
}) {
  if (!project) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '13px 14px',
        background: '#F9FAFB',
        border: '1px solid #E5E7EB',
        borderRadius: '11px',
      }}
    >
      <div
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '9px',
          background:
            project.status === 'completed'
              ? '#ECFDF5'
              : '#EEF2FF',
          color:
            project.status === 'completed'
              ? '#059669'
              : '#4F46E5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {project.status === 'completed' ? '✓' : '●'}
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            color: '#111827',
            fontSize: '13px',
            fontWeight: 700,
            marginBottom: '3px',
          }}
        >
          {project.title}
        </div>

        <div
          style={{
            color: '#9CA3AF',
            fontSize: '11px',
          }}
        >
          {role} · {project.status}
        </div>
      </div>

      <Link
        href={`/projects/${project.id}`}
        style={{
          padding: '6px 10px',
          border: '1px solid #E5E7EB',
          background: '#FFFFFF',
          color: '#374151',
          borderRadius: '7px',
          textDecoration: 'none',
          fontSize: '11px',
          fontWeight: 600,
        }}
      >
        Open
      </Link>
    </div>
  )
}

function PostCard({ post }) {
  return (
    <div
      style={{
        padding: '16px',
        background: '#F9FAFB',
        border: '1px solid #EEF0F3',
        borderRadius: '13px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '8px',
        }}
      >
        <h3
          style={{
            margin: 0,
            color: '#111827',
            fontSize: '14px',
          }}
        >
          {post.title}
        </h3>

        <span
          style={{
            color: '#9CA3AF',
            fontSize: '10px',
            whiteSpace: 'nowrap',
          }}
        >
          {new Date(post.created_at).toLocaleDateString()}
        </span>
      </div>

      <p
        style={{
          margin: '0 0 10px',
          color: '#4B5563',
          fontSize: '13px',
          lineHeight: 1.7,
        }}
      >
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
        maxHeight: '420px',
        objectFit: 'cover',
      }}
    />
  </div>
)}
      {post.projects && (
        <span
          style={{
            color: '#5B4FE8',
            fontSize: '11px',
            fontWeight: 600,
          }}
        >
          📁 {post.projects.title}
        </span>
      )}

      {post.skills_highlighted?.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '5px',
            marginTop: '9px',
          }}
        >
          {post.skills_highlighted.map((skill, index) => (
            <span
              key={`${skill}-${index}`}
              style={{
                padding: '3px 8px',
                borderRadius: '20px',
                background: '#EEF2FF',
                color: '#4338CA',
                fontSize: '10px',
                fontWeight: 600,
              }}
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
function CertificateList({ certificates }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '12px',
      }}
    >
      {certificates.map(certificate => (
        <div
          key={certificate.id}
          style={{
            padding: '16px',
            border: '1px solid #DBEAFE',
            background:
              'linear-gradient(135deg, #F8FAFF, #EFF6FF)',
            borderRadius: '14px',
            display: 'flex',
            gap: '13px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#DBEAFE',
              color: '#1D4ED8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: '19px',
            }}
          >
            ◈
          </div>

          <div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#0F172A',
              }}
            >
              {certificate.name}
            </div>

            {certificate.issuing_organization && (
              <div
                style={{
                  marginTop: '4px',
                  color: '#475569',
                  fontSize: '12px',
                }}
              >
                {certificate.issuing_organization}
              </div>
            )}

            {certificate.issue_date && (
              <div
                style={{
                  marginTop: '6px',
                  color: '#94A3B8',
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
                  marginTop: '8px',
                  color: '#2563EB',
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
  )
}
function EmptyState({
  icon,
  message,
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '24px',
        color: '#9CA3AF',
      }}
    >
      <div
        style={{
          fontSize: '26px',
          marginBottom: '7px',
        }}
      >
        {icon}
      </div>

      <p
        style={{
          margin: 0,
          fontSize: '12px',
        }}
      >
        {message}
      </p>
    </div>
  )
}