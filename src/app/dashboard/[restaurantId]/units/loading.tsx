export default function UnitsLoading() {
  return (
    <div className="max-w-6xl mx-auto pb-10 md:pb-6 space-y-6 pt-4 animate-in fade-in duration-500">
      {/* Header Skeleton: date navigator */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="h-8 w-40 bg-card rounded-lg opacity-70" />
        <div className="h-10 w-36 bg-card rounded-xl opacity-40" />
      </div>

      {/* Unit Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="aspect-square bg-card/30 rounded-3xl border border-border/40 p-4 flex flex-col justify-between">
            <div className="h-4 w-12 bg-card rounded opacity-60" />
            <div className="h-3 w-16 bg-card rounded opacity-30" />
          </div>
        ))}
      </div>
    </div>
  )
}
