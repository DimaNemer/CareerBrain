import Link from "next/link"
import {
  FileText,
  Target,
  BarChart3,
  Users,
  CheckCircle2,
  Briefcase,
  ArrowRight,
  Brain,
} from "lucide-react"

const features = [
  {
    icon: FileText,
    title: "AI-powered CV analysis",
    description:
      "Upload your CV and transform it into a structured profile of technical, professional, and soft skills.",
  },
  {
    icon: Target,
    title: "Personalised job matching",
    description: "Discover opportunities ranked by how closely they match your current skills and experience.",
  },
  {
    icon: BarChart3,
    title: "Clear skill-gap insights",
    description: "Understand exactly which skills are missing instead of guessing whether you are ready to apply.",
  },
  {
    icon: Users,
    title: "Build through CollabSpace",
    description: "Create projects, join teams, and gain practical experience with other developers and designers.",
  },
  {
    icon: CheckCircle2,
    title: "Verified skill growth",
    description: "Completed project work strengthens your profile with real evidence, not only claims on a CV.",
  },
  {
    icon: Briefcase,
    title: "Direct employer opportunities",
    description: "Explore jobs from external platforms and opportunities posted directly by employers.",
  },
]

const steps = [
  {
    number: "01",
    title: "Upload your CV",
    description: "Career Brain analyses your CV and identifies your current skills.",
  },
  {
    number: "02",
    title: "Discover your best matches",
    description: "Jobs are ranked using your skill profile and readiness score.",
  },
  {
    number: "03",
    title: "Understand what is missing",
    description: "See the exact skills that could improve your strongest opportunities.",
  },
  {
    number: "04",
    title: "Build verified experience",
    description: "Join collaborative projects and strengthen your profile through real work.",
  },
]

const collabPoints = [
  "Create or join collaborative projects",
  "Gain practical experience with real teammates",
  "Add verified evidence to your skill profile",
  "Improve future readiness and job-match scores",
]

export default function Home() {
  return (
    <main className="min-h-screen bg-background font-sans text-foreground">
      {/* Nav */}
      

      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:px-6 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground">
              Career intelligence for emerging talent
            </span>
            <h1 className="mt-6 font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-balance md:text-6xl">
              Turn your CV into a clear career plan.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Career Brain analyses your skills, matches you with real opportunities, identifies what you are missing,
              and helps you build verified experience through collaborative projects.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.03]"
              >
                Build my career profile
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-border bg-card px-5 py-3 text-sm font-bold text-foreground transition-colors hover:bg-secondary"
              >
                Log in
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-primary" /> AI skill extraction
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-primary" /> Job-match scoring
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-primary" /> Real project experience
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-primary">How it works</p>
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-balance md:text-4xl">
            One connected path from CV to career growth
          </h2>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
            Career Brain does more than list jobs. It helps you understand where you stand and what to do next.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className="font-heading text-sm font-extrabold text-primary">{step.number}</div>
              <h3 className="mt-4 font-heading text-base font-bold text-card-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-primary">Platform features</p>
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-balance md:text-4xl">
              Everything you need to become a stronger candidate
            </h2>
            <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
              Career analysis, opportunity discovery, and practical collaboration in one connected experience.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <article
                  key={feature.title}
                  className="group rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-4 font-heading text-base font-bold text-card-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* CollabSpace differentiator */}
      <section id="collab" className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <div className="grid items-center gap-10 rounded-3xl bg-primary p-8 text-primary-foreground md:grid-cols-2 md:p-14">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-primary-foreground/60">
              Why Career Brain is different
            </p>
            <h2 className="font-heading text-3xl font-extrabold leading-tight tracking-tight text-balance md:text-4xl">
              Do not just learn skills. Build evidence of them.
            </h2>
            <p className="mt-4 text-pretty leading-relaxed text-primary-foreground/75">
              CollabSpace connects developers and designers who want to build together. Every completed project can
              strengthen your skill profile and improve future job-match results.
            </p>
          </div>
          <div className="grid gap-3">
            {collabPoints.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 px-4 py-3.5 text-sm font-semibold"
              >
                <CheckCircle2 className="size-5 flex-shrink-0 text-primary-foreground" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 md:px-6">
        <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-card p-10 text-center md:p-16">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-balance md:text-4xl">
            Understand where your career stands.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            Build your skill profile, discover matching opportunities, and get a clear plan for improving your
            readiness.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            Get started with Career Brain
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-6">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Brain className="size-4" />
            </span>
            <span className="font-heading text-sm font-bold">Career Brain</span>
          </div>
          <p className="text-xs text-muted-foreground">Career intelligence for emerging talent.</p>
        </div>
      </footer>
    </main>
  )
}
