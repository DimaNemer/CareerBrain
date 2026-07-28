function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} />
}

export default function ProjectsLoading() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12" aria-label="Loading projects">
      <div className="mx-auto max-w-6xl">
        <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 px-6 py-8 shadow-xl sm:px-10 sm:py-10">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative space-y-5">
            <Skeleton className="h-7 w-32 bg-white/15" />
            <Skeleton className="h-10 w-full max-w-xl bg-white/15" />
            <Skeleton className="h-5 w-full max-w-lg bg-white/10" />
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-8 w-32 rounded-full bg-white/10" />
              <Skeleton className="h-8 w-28 rounded-full bg-white/10" />
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Skeleton className="mb-5 h-8 w-48" />
          <div className="grid gap-4 lg:grid-cols-12">
            <Skeleton className="h-11 lg:col-span-6" />
            <Skeleton className="h-11 lg:col-span-3" />
            <Skeleton className="h-11 lg:col-span-3" />
          </div>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <Skeleton className="h-5 w-28" />
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <article key={item} className="min-h-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="h-1 bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-300" />
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-1 items-center gap-3">
                    <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
                    <Skeleton className="h-6 w-2/3" />
                  </div>
                  <Skeleton className="h-7 w-16 rounded-full" />
                </div>
                <Skeleton className="mt-5 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-4/5" />
                <Skeleton className="mt-7 h-4 w-20" />
                <div className="mt-3 flex gap-2">
                  <Skeleton className="h-7 w-24" />
                  <Skeleton className="h-7 w-20" />
                </div>
                <div className="mt-7 flex items-center justify-between border-t border-slate-100 pt-5">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-9 w-28 rounded-xl" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
