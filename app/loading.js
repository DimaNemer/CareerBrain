function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`}
      aria-hidden="true"
    />
  )
}

export default function Loading() {
  return (
    <main
      className="min-h-[calc(100vh-60px)] bg-slate-50 px-4 py-8 sm:px-6 sm:py-12"
      aria-label="Loading page"
      aria-busy="true"
    >
      <div className="mx-auto max-w-6xl">
        <Skeleton className="mb-6 h-9 w-2/3 max-w-md" />
        <Skeleton className="mb-8 h-5 w-full max-w-xl" />
        <div className="grid gap-5 md:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <section
              key={item}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="mt-5 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-4/5" />
              <Skeleton className="mt-7 h-10 w-32 rounded-xl" />
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
