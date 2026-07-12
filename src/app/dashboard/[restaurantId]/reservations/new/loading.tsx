export default function NewReservationLoading() {
  return (
    <div className="max-w-6xl mx-auto pb-24 md:pb-6 space-y-6 pt-2 animate-in fade-in duration-500">
      {/* Step header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-card rounded-lg opacity-70" />
        <div className="h-3 w-64 bg-card rounded opacity-40" />
      </div>

      {/* Table/unit grid skeleton — matches the actual table-picker shape
          instead of the Bookings-list card grid this route used to inherit
          from the parent reservations/loading.tsx. */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-2xl border-2 border-border bg-card/40"
            style={{ opacity: 0.9 - (i % 5) * 0.1 }}
          />
        ))}
      </div>

      {/* Form fields skeleton */}
      <div className="space-y-3 pt-2">
        <div className="h-12 w-full bg-card rounded-2xl opacity-50" />
        <div className="h-12 w-full bg-card rounded-2xl opacity-50" />
        <div className="h-24 w-full bg-card rounded-2xl opacity-30" />
      </div>
    </div>
  )
}
