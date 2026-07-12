export default function DashboardHomeLoading() {
  return (
    <div className="max-w-6xl mx-auto pb-10 md:pb-6 space-y-8 pt-4 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-32 bg-card rounded opacity-60" />
        <div className="h-8 w-64 bg-card rounded-lg" />
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-card/50 rounded-2xl border border-border/50" />
        ))}
      </div>

      {/* Upcoming List Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-card/30 rounded-2xl border border-border/40 p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-card/80" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-card rounded" />
              <div className="h-3 w-24 bg-card rounded opacity-60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
