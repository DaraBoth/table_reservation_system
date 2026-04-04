'use client'

import React from 'react'
import { format, addDays, subDays, parseISO, isToday as isDateToday } from 'date-fns'
import { ChevronLeft, ChevronRight, CalendarDays, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DateNavigatorProps {
  selectedDate: string // YYYY-MM-DD
  onChange: (date: string) => void
  className?: string
}

export function DateNavigator({ selectedDate, onChange, className }: DateNavigatorProps) {
  const date = parseISO(selectedDate)
  const isSelectedToday = isDateToday(date)

  const shiftDate = (amount: number) => {
    const nextDate = addDays(date, amount)
    onChange(format(nextDate, 'yyyy-MM-dd'))
  }

  const goToToday = () => {
    onChange(format(new Date(), 'yyyy-MM-dd'))
  }

  return (
    <div className={cn(
      "w-full flex items-center justify-between bg-card/50 border border-border p-1.5 rounded-2xl backdrop-blur-md shadow-xl",
      className
    )}>
      {/* ⬅️ Previous Day */}
      <button
        type="button"
        onClick={() => shiftDate(-1)}
        className="w-10 h-10 rounded-xl bg-background border border-border hover:border-violet-500/50 text-muted-foreground hover:text-foreground transition-all active:scale-90 flex items-center justify-center p-0"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* 📅 Selected Date Label */}
      <div className="flex flex-col items-center px-4 min-w-[140px]">
        <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">
          <CalendarDays className="w-3 h-3" />
          {isSelectedToday ? 'Showing Today' : format(date, 'EEEE')}
        </div>
        <p className="text-sm font-black text-foreground italic tracking-tight uppercase leading-none">
          {format(date, 'MMM dd, yyyy')}
        </p>
      </div>

      {/* ➡️ Next Day / Today Reset */}
      <div className="flex items-center gap-1.5">
        {!isSelectedToday && (
          <button
            type="button"
            onClick={goToToday}
            className="flex items-center gap-1.5 px-3 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 text-[10px] font-black uppercase tracking-widest hover:bg-violet-600/20 transition-all active:scale-95 whitespace-nowrap"
          >
            <RotateCcw className="w-3 h-3" /> Today
          </button>
        )}
        <button
          type="button"
          onClick={() => shiftDate(1)}
          className="w-10 h-10 rounded-xl bg-background border border-border hover:border-violet-500/50 text-muted-foreground hover:text-foreground transition-all active:scale-90 flex items-center justify-center p-0"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
