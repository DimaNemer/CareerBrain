import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import {
  CheckCircle2,
  ArrowRight,
  Circle,
  Upload,
  Briefcase,
  Sparkles,
  Target,
  FileText,
  User,
} from "lucide-react"

// ---- Supabase config ----
// The publishable (anon) key is safe to expose in client-reachable code.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fyxppahiuwxwrbjtqmam.supabase.co"
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_HTqXN9K174N8dI-Ms1vf_A_nFlnCUeN"

// ---- Supabase server client ----
async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Called from a Server Component — safe to ignore when middleware refreshes sessions.
        }
      },
    },
  })
}

// ---- Page ----
export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Profile is queried defensively: if the table/columns don't exist, we degrade
  // gracefully to sensible defaults instead of crashing the page.
  let profile = null
  try {
    const { data } = await supabase
      .from("profiles")
      .select(
        `
        full_name,
        headline,
        readiness_score,
        preferred_role,
        user_skills (
          id,
          source,
          skills ( id, name, category )
        )
      `,
      )
      .eq("id", user.id)
      .single()
    profile = data
  } catch {
    profile = null
  }

  const firstName = profile?.full_name?.trim().split(" ")[0] || user.email?.split("@")[0] || "there"
  const userSkills = profile?.user_skills || []
  const verifiedSkills = userSkills.filter((s) => s.source === "Project").length

  const profileActions = [
    {
      completed: Boolean(profile?.full_name && profile?.headline),
      title: "Complete your professional profile",
      description: "Add a clear headline and profile information.",
      href: "/profile/edit",
      button: "Edit profile",
      icon: User,
    },
    {
      completed: userSkills.length > 0,
      title: "Upload and analyse your CV",
      description: "Extract skills and build your career intelligence profile.",
      href: "/upload-cv",
      button: userSkills.length > 0 ? "Re-upload CV" : "Upload CV",
      icon: FileText,
    },
    {
      completed: verifiedSkills > 0,
      title: "Build verified project experience",
      description: "Join CollabSpace projects and turn work into evidence.",
      href: "/projects",
      button: "Browse projects",
      icon: Briefcase,
    },
  ]

  const completedActions = profileActions.filter((a) => a.completed).length
  const progressPct = Math.round((completedActions / profileActions.length) * 100)

  const stats = [
    {
      label: "Skills identified",
      value: userSkills.length,
      description: "From your CV and profile",
      icon: Sparkles,
      tone: "text-primary",
    },
    {
      label: "Verified skills",
      value: verifiedSkills,
      description: "Supported by project evidence",
      icon: CheckCircle2,
      tone: "text-primary",
    },
    {
      label: "Profile progress",
      value: `${completedActions}/${profileActions.length}`,
      description: "Recommended setup actions completed",
      icon: Target,
      tone: "text-primary",
    },
  ]

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 font-sans md:px-6 md:py-14">
      {/* Welcome */}
      <section className="mb-6 flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-primary p-8 text-primary-foreground">
        <div className="max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary-foreground/60">
            Career dashboard
          </p>
          <h1 className="mb-3 font-heading text-3xl font-extrabold tracking-tight text-balance md:text-4xl">
            Welcome back, {firstName}
          </h1>
          <p className="text-pretty leading-relaxed text-primary-foreground/75">
            {profile?.headline
              ? `${profile.headline}. Continue building your profile to improve your opportunity matches.`
              : "Build your career profile to discover stronger job matches and personalised next steps."}
          </p>
        </div>
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 rounded-xl bg-background px-4 py-3 text-sm font-bold text-primary transition-transform hover:scale-[1.02]"
        >
          Improve my profile
          <ArrowRight className="size-4" />
        </Link>
      </section>

      {/* Statistics */}
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-secondary">
                <Icon className={`size-5 ${stat.tone}`} />
              </div>
              <div className={`font-heading text-3xl font-extrabold tracking-tight ${stat.tone}`}>{stat.value}</div>
              <div className="mt-1 text-sm font-semibold text-card-foreground">{stat.label}</div>
              <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{stat.description}</div>
            </div>
          )
        })}
      </section>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* Main column */}
        <div className="flex flex-col gap-5">
          {/* Recommended actions */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-heading text-lg font-bold text-card-foreground">Your next best actions</h2>
            <p className="mb-5 mt-1 text-sm text-muted-foreground">
              Complete these steps to strengthen your profile and improve your matches.
            </p>
            <div className="flex flex-col gap-3">
              {profileActions.map((action) => {
                const Icon = action.icon
                return (
                  <div
                    key={action.title}
                    className={`flex flex-wrap items-center gap-4 rounded-xl border p-4 transition-colors ${
                      action.completed ? "border-primary/30 bg-primary/5" : "border-border bg-muted/40"
                    }`}
                  >
                    <div
                      className={`flex size-10 flex-shrink-0 items-center justify-center rounded-lg ${
                        action.completed ? "bg-primary/15 text-primary" : "bg-secondary text-primary"
                      }`}
                    >
                      {action.completed ? <CheckCircle2 className="size-5" /> : <Icon className="size-5" />}
                    </div>
                    <div className="min-w-[200px] flex-1">
                      <div className="text-sm font-semibold text-card-foreground">{action.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{action.description}</div>
                    </div>
                    <Link
                      href={action.href}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      {action.button}
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Current focus */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-heading text-lg font-bold text-card-foreground">Current career focus</h2>
            <p className="mb-5 mt-1 text-sm text-muted-foreground">Based on your profile information.</p>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Preferred role
              </div>
              <div className="text-sm font-semibold text-card-foreground">
                {profile?.preferred_role || profile?.headline || "Not selected yet"}
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-5">
          {/* Profile progress */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-heading text-lg font-bold text-card-foreground">Career profile progress</h2>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">
              {completedActions} of {profileActions.length} recommended steps completed
            </p>
            <div className="mb-5 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="flex flex-col gap-3">
              {profileActions.map((action) => (
                <div key={action.title} className="flex items-start gap-2">
                  {action.completed ? (
                    <CheckCircle2 className="mt-0.5 size-4 flex-shrink-0 text-primary" />
                  ) : (
                    <Circle className="mt-0.5 size-4 flex-shrink-0 text-muted-foreground" />
                  )}
                  <span
                    className={`text-xs leading-relaxed ${
                      action.completed ? "text-card-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {action.title}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  )
}
