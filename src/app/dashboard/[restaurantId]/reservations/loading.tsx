export default function ReservationsLoading() {
  return (
    <div className="max-w-6xl mx-auto pb-24 md:pb-6 space-y-6 lg:space-y-7 pt-2 animate-in fade-in duration-500">
      {/* Header Skeleton: date navigator + view switcher */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-card rounded-lg opacity-70" />
          <div className="h-3 w-56 bg-card rounded opacity-40" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-36 bg-card rounded-xl opacity-40" />
          <div className="h-10 w-24 bg-card rounded-xl opacity-30" />
        </div>
      </div>

      {/* Booking Card Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-36 bg-card/30 rounded-3xl border border-border/40 p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-card/80" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-card rounded" />
                <div className="h-3 w-16 bg-card rounded opacity-60" />
              </div>
            </div>
            <div className="h-3 w-32 bg-card rounded opacity-40" />
            <div className="h-6 w-20 bg-card rounded-full opacity-30" />
          </div>
        ))}
      </div>
    </div>
  )
}
