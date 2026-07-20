function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} />
}

export default function ProjectDetailsLoading() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12" aria-label="Loading project details">
      <div className="mx-auto max-w-6xl">
        <Skeleton className="mb-5 h-5 w-32" />

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 px-6 py-8 shadow-xl sm:px-10 sm:py-10">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative">
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-full bg-white/15" />
              <Skeleton className="h-8 w-36 rounded-full bg-white/10" />
            </div>
            <Skeleton className="mt-6 h-10 w-full max-w-xl bg-white/15" />
            <Skeleton className="mt-5 h-5 w-full max-w-2xl bg-white/10" />
            <Skeleton className="mt-2 h-5 w-4/5 max-w-xl bg-white/10" />
            <div className="mt-7 flex flex-wrap gap-5">
              <Skeleton className="h-5 w-32 bg-white/10" />
              <Skeleton className="h-5 w-28 bg-white/10" />
              <Skeleton className="h-5 w-24 bg-white/10" />
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className="space-y-6 lg:col-span-2">
            {[0, 1].map((section) => (
              <div key={section} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-7 w-40" />
                  <Skeleton className="h-7 w-16 rounded-full" />
                </div>
                {[0, 1].map((row) => (
                  <div key={row} className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <Skeleton className="h-5 w-2/5" />
                    <Skeleton className="mt-3 h-4 w-3/4" />
                    <div className="mt-4 flex gap-2">
                      <Skeleton className="h-7 w-20" />
                      <Skeleton className="h-7 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </section>

          <aside className="space-y-6">
            {[0, 1].map((card) => (
              <div key={card} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="mt-5 h-11 w-full rounded-xl" />
                <Skeleton className="mt-3 h-11 w-full rounded-xl" />
              </div>
            ))}
          </aside>
        </div>
      </div>
    </main>
  )
}
