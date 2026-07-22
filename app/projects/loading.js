export default function ProjectsLoading() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-5xl animate-pulse">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="h-9 w-40 rounded bg-gray-200" />
            <div className="mt-3 h-5 w-72 max-w-full rounded bg-gray-200" />
          </div>
          <div className="h-10 w-36 rounded-lg bg-gray-200" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-xl border bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="h-7 w-40 rounded bg-gray-200" />
                <div className="h-7 w-16 rounded-full bg-gray-200" />
              </div>
              <div className="mt-5 h-4 w-full rounded bg-gray-200" />
              <div className="mt-2 h-4 w-4/5 rounded bg-gray-200" />
              <div className="mt-6 h-9 w-28 rounded-lg bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
