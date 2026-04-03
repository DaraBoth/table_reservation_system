export default function ReportsLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 pt-4 animate-in fade-in duration-500">
      
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-slate-900 rounded opacity-60" />
          <div className="h-8 w-64 bg-slate-900 rounded-lg" />
        </div>
        <div className="h-10 w-48 bg-slate-900 rounded-xl opacity-40" />
      </div>

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-900/50 rounded-2xl border border-slate-900/50" />
        ))}
      </div>

      {/* Large Charts/Tables Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[400px] bg-slate-900/30 rounded-3xl border border-slate-900/40" />
        <div className="h-[400px] bg-slate-900/30 rounded-3xl border border-slate-900/40" />
      </div>

      {/* Bottom Table Skeleton */}
      <div className="h-64 bg-slate-900/20 rounded-3xl border border-slate-900/30" />
    </div>
  )
}
