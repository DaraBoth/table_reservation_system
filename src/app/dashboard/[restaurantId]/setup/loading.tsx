export default function SetupLoading() {
  return (
    <div className="min-h-[80vh] flex flex-col justify-start py-6 px-4 animate-in fade-in duration-500">
      <div className="w-full max-w-md mx-auto space-y-5">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4 pt-2">
          <div className="w-14 h-14 rounded-[1.5rem] bg-card" />
          <div className="space-y-2">
            <div className="h-6 w-32 bg-card rounded-lg opacity-70" />
            <div className="h-3 w-48 bg-card rounded opacity-40" />
          </div>
        </div>

        {/* Form Skeleton */}
        <div className="space-y-4 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 w-full bg-card/30 rounded-2xl border border-border/50" />
          ))}
          <div className="h-12 w-full bg-card rounded-2xl opacity-40 mt-6" />
        </div>
      </div>
    </div>
  )
}
