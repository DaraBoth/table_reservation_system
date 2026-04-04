export default function StaffLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-4 animate-in fade-in duration-500">
      
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 bg-card rounded opacity-60" />
        <div className="h-10 w-24 bg-card rounded-xl opacity-40 shadow-sm" />
      </div>

      {/* Summary Cards Skeleton */}
      <div className="flex gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex-1 h-20 bg-card/50 rounded-2xl border border-border/50" />
        ))}
      </div>

      {/* List Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-card/30 rounded-3xl border border-border/40 p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-card/80" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-card rounded" />
              <div className="h-3 w-40 bg-card rounded opacity-60" />
            </div>
            <div className="h-10 w-10 bg-card rounded-xl opacity-30" />
          </div>
        ))}
      </div>
    </div>
  )
}
