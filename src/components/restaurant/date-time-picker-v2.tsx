"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarDays, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface DateTimePickerProps {
  value?: Date
  onChange?: (date: Date) => void
}

export function DateTimePickerV2({ value, onChange }: DateTimePickerProps) {
  // ── Fully controlled — NO internal state ───────────────────────────────────
  // All display values are derived from the `value` prop every render.
  // Any user change calls `onChange`, which updates the parent, which
  // passes the new value back down. This prevents any stale-state resets.
  const date = value ?? (() => {
    const d = new Date()
    const mins = d.getMinutes()
    if (mins > 0 && mins <= 30) d.setMinutes(30, 0, 0)
    else d.setHours(d.getHours() + 1, 0, 0, 0)
    return d
  })()

  const dateValue = format(date, 'yyyy-MM-dd')
  const timeValue = format(date, 'HH:mm')

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return
    const [year, month, day] = e.target.value.split('-').map(Number)
    const updated = new Date(date)   // clone current prop value
    updated.setFullYear(year, month - 1, day)
    onChange?.(updated)
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return
    const [hours, minutes] = e.target.value.split(':').map(Number)
    const updated = new Date(date)   // clone current prop value
    updated.setHours(hours, minutes, 0, 0)
    onChange?.(updated)
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Date Input */}
      <div>
        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">
          Date
        </label>
        <div className="relative flex items-center">
          <CalendarDays className="absolute left-3.5 w-5 h-5 text-violet-400 pointer-events-none z-10" />
          <input
            type="date"
            value={dateValue}
            onChange={handleDateChange}
            min={format(new Date(), 'yyyy-MM-dd')}
            className={cn(
              "w-full h-14 pl-11 pr-3 rounded-2xl border-2 border-slate-700 bg-slate-900",
              "text-white text-sm font-semibold",
              "focus:border-violet-500 focus:outline-none transition-colors",
              "[color-scheme:dark]"
            )}
          />
        </div>
      </div>

      {/* Time Input */}
      <div>
        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">
          Time
        </label>
        <div className="relative flex items-center">
          <Clock className="absolute left-3.5 w-5 h-5 text-emerald-400 pointer-events-none z-10" />
          <input
            type="time"
            value={timeValue}
            onChange={handleTimeChange}
            step={900}
            className={cn(
              "w-full h-14 pl-11 pr-3 rounded-2xl border-2 border-slate-700 bg-slate-900",
              "text-white text-sm font-semibold",
              "focus:border-emerald-500 focus:outline-none transition-colors",
              "[color-scheme:dark]"
            )}
          />
        </div>
      </div>
    </div>
  )
}
