"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format, subDays, addDays, parseISO, startOfWeek } from "date-fns"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { TopLoadingBar } from "@/components/dashboard/top-loading-bar"

import { Button } from "@/components/ui/button"

export function ReportFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = React.useTransition()

  const weekParam = searchParams.get("week")
  
  // Normalize to Monday of the week
  const now = new Date()
  const monday = startOfWeek(weekParam ? parseISO(weekParam) : now, { weekStartsOn: 1 })

  const navigateWeek = (direction: 'prev' | 'next' | 'current') => {
    let target = monday
    if (direction === 'prev') target = subDays(monday, 7)
    if (direction === 'next') target = addDays(monday, 7)
    if (direction === 'current') target = startOfWeek(now, { weekStartsOn: 1 })
    
    const params = new URLSearchParams(searchParams.toString())
    params.set("week", format(target, "yyyy-MM-dd"))
    
    startTransition(() => {
      router.push(`/dashboard/reports?${params.toString()}`)
    })
  }

  return (
    <>
      <TopLoadingBar isPending={isPending} />
      <div className="flex items-center justify-between bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 p-2 rounded-2xl shadow-xl relative overflow-hidden">
        {/* Weekly Navigation */}
        <div className="flex items-center gap-1 w-full">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateWeek('prev')}
            className="h-10 w-10 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 flex flex-col items-center">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">Business Week</span>
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 text-violet-400" />
              <span className="text-xs font-black text-white tracking-tight">
                {format(monday, "MMM dd")} — {format(addDays(monday, 6), "MMM dd")}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateWeek('next')}
            className="h-10 w-10 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          <div className="w-px h-6 bg-slate-800 mx-1" />

          <Button
             variant="ghost"
             size="sm"
             onClick={() => navigateWeek('current')}
             className="h-10 px-3 text-[10px] font-black text-violet-400 uppercase tracking-widest hover:text-violet-300 hover:bg-violet-500/5 rounded-xl transition-all"
          >
            Today
          </Button>

          {isPending && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-10 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 px-3 py-1 bg-violet-600 rounded-full shadow-lg shadow-violet-500/20">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Syncing</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
