export default function ProjectDetailsLoading() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-4xl animate-pulse rounded-xl bg-white p-8 shadow-sm">
        <div className="h-5 w-32 rounded bg-gray-200" />
        <div className="mt-8 h-9 w-2/3 rounded bg-gray-200" />
        <div className="mt-5 h-4 w-full rounded bg-gray-200" />
        <div className="mt-2 h-4 w-4/5 rounded bg-gray-200" />

        <div className="mt-8 space-y-3 border-t pt-6">
          <div className="h-4 w-40 rounded bg-gray-200" />
          <div className="h-4 w-52 rounded bg-gray-200" />
          <div className="h-4 w-44 rounded bg-gray-200" />
        </div>

        <div className="mt-10 border-t pt-8">
          <div className="h-8 w-36 rounded bg-gray-200" />
          {[0, 1].map((item) => (
            <div key={item} className="mt-5 rounded-xl border bg-gray-50 p-4">
              <div className="h-5 w-40 rounded bg-gray-200" />
              <div className="mt-3 h-4 w-32 rounded bg-gray-200" />
              <div className="mt-2 h-4 w-28 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
