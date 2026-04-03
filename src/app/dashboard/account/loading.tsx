export default function AccountLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-12 min-h-screen animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8 md:gap-16">
        
        {/* Sidebar Skeleton */}
        <aside className="space-y-8 hidden md:block">
          <div className="flex flex-col gap-1 sticky top-12">
            <div className="h-2 w-16 bg-slate-900 rounded mb-6 px-2 opacity-50" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 w-full bg-slate-900/50 rounded-2xl mb-1" />
            ))}
          </div>
        </aside>

        {/* Content Skeleton */}
        <main className="space-y-10">
          <header className="mb-8">
            <div className="h-8 w-32 bg-slate-900 rounded-lg mb-2 opacity-70" />
            <div className="h-3 w-48 bg-slate-900 rounded opacity-50" />
          </header>

          <div className="space-y-12">
            {/* Profile Header Skeleton */}
            <div className="flex items-center gap-6 pb-6 border-b border-slate-900">
              <div className="w-16 h-16 rounded-2xl bg-slate-900" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-slate-900 rounded" />
                <div className="h-3 w-20 bg-slate-900 rounded opacity-50" />
              </div>
            </div>

            {/* Form Skeleton */}
            <div className="space-y-8 max-w-md">
              <div className="space-y-4">
                <div className="h-2 w-12 bg-slate-900 rounded opacity-60" />
                <div className="h-14 w-full bg-slate-900/30 rounded-2xl border border-slate-900/50" />
              </div>
              <div className="h-10 w-24 bg-slate-900 rounded-lg opacity-40" />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
