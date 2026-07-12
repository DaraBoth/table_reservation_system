export default function CustomersLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-4 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 bg-card rounded-lg opacity-70" />
        <div className="h-10 w-32 bg-card rounded-xl opacity-40 shadow-sm" />
      </div>

      {/* Customer List Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 bg-card/30 rounded-2xl border border-border/40 p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-card/80" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-card rounded" />
              <div className="h-3 w-24 bg-card rounded opacity-60" />
            </div>
            <div className="h-8 w-8 bg-card rounded-lg opacity-30" />
          </div>
        ))}
      </div>
    </div>
  )
}
