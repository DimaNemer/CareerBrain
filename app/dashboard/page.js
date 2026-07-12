import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { theme } from '@/constants/colors'
// 1️⃣ استيراد مكون المصادر التعليمية المطور
import LearningResourceList from '@/components/LearningResourceList'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ⚡ تحديث الاستعلام: جلب ملف المستخدم وبنفس الوقت عمل Join لجلب مهاراته الحقيقية
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      full_name, 
      headline, 
      readiness_score,
      user_skills (
        skills (
          name
        )
      )
    `)
    .eq('id', user.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const score = profile?.readiness_score || 0

  // 🎯 استخراج اسم أول مهارة يمتلكها المستخدم ديناميكياً لتمريرها للمكوّن
  // إذا لم يكن يملك أي مهارات بعد، نمرر "React" كقيمة افتراضية (Fallback)
  const userSkills = profile?.user_skills || []
  const activeSkillName = userSkills[0]?.skills?.name || 'React'

  return (
    <main style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '48px 24px',
    }}>
      {/* Welcome section — auth owned */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 700,
          color: theme.text.primary,
          margin: '0 0 8px',
          letterSpacing: '-0.5px',
        }}>
          Hey, {firstName} 👋
        </h1>
        <p style={{
          fontSize: '16px',
          color: theme.text.secondary,
          margin: 0,
        }}>
          {profile?.headline || 'Welcome to Career Brain.'}
        </p>
      </div>

      {/* Readiness score — auth owned */}
      {score > 0 && (
        <div style={{
          background: theme.bg.card,
          border: `1px solid ${theme.border.light}`,
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <div style={{
            fontSize: '36px',
            fontWeight: 700,
            color: score >= 70
              ? theme.score.high
              : score >= 40
              ? theme.score.medium
              : theme.score.low,
            letterSpacing: '-1px',
          }}>
            {score}%
          </div>
          <div>
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: theme.text.primary,
            }}>
              Readiness score
            </div>
            <div style={{
              fontSize: '13px',
              color: theme.text.secondary,
              marginTop: '2px',
            }}>
              Based on your skills and projects
            </div>
          </div>
        </div>
      )}

      {/* 2️⃣ قسم المصادر التعليمية الديناميكي بالكامل */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 600,
          color: theme.text.primary,
          marginBottom: '16px',
          letterSpacing: '-0.3px',
        }}>
          Recommended Resources for {activeSkillName}
        </h2>
        
        {/* استدعاء المكون وتمرير اسم المهارة المستخرج ديناميكياً من حساب المستخدم */}
        <LearningResourceList skillName={activeSkillName} />
      </div>

      {/* Placeholder for other members' features */}
      <div style={{
        background: theme.bg.hover,
        border: `1px dashed ${theme.border.medium}`,
        borderRadius: '16px',
        padding: '32px',
        textAlign: 'center',
        color: theme.text.tertiary,
        fontSize: '14px',
      }}>
        More dashboard sections coming from teammates
      </div>
    </main>
  )
}