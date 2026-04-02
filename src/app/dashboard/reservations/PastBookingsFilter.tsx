'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format, subDays, parseISO } from 'date-fns'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { cn } from '@/lib/utils'

interface Props {
  selectedDate: string // YYYY-MM-DD
}

// Wrap Lucide icon to prevent MUI's ownerState prop from leaking to the SVG
const MuiCalendarIcon = (props: any) => {
  const { ownerState, ...others } = props
  return <Calendar {...others} />
}

export function PastBookingsFilter({ selectedDate }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const today = new Date()
  const yesterday = subDays(today, 1)
  const yesterdayIso = format(yesterday, 'yyyy-MM-dd')
  
  const handleDateChange = (newDate: Date | null) => {
    if (!newDate) return
    const iso = format(newDate, 'yyyy-MM-dd')
    const params = new URLSearchParams(searchParams.toString())
    params.set('date', iso)
    router.replace(`/dashboard/reservations?${params.toString()}`, { scroll: false })
  }

  const shiftDate = (amount: number) => {
    const current = parseISO(selectedDate)
    const next = subDays(current, -amount)
    const nextIso = format(next, 'yyyy-MM-dd')
    
    if (nextIso > yesterdayIso) return
    
    const params = new URLSearchParams(searchParams.toString())
    params.set('date', nextIso)
    router.replace(`/dashboard/reservations?${params.toString()}`, { scroll: false })
  }

  const displayDate = format(parseISO(selectedDate), 'EEEE, MMM dd')

  return (
    <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2 pl-4 rounded-2xl shadow-xl shadow-black/20">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-violet-400" />
        </div>
        <div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Archive Date</p>
          <p className="text-sm font-black text-white italic tracking-tight uppercase leading-none">{displayDate}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 pr-1">
        <button
          onClick={() => shiftDate(-1)}
          className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all border border-slate-700 active:scale-95"
          title="Previous Day"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="relative group">
          <DatePicker
            value={parseISO(selectedDate)}
            maxDate={yesterday}
            onChange={handleDateChange}
            slots={{
              openPickerIcon: MuiCalendarIcon,
            }}
            slotProps={{
              textField: {
                size: 'small',
                sx: { 
                  width: '40px',
                  '& .MuiInputBase-root': {
                    padding: 0,
                    height: '40px',
                    borderRadius: '0.75rem',
                    backgroundColor: '#7c3aed',
                    border: 'none',
                    '& fieldset': { border: 'none' },
                    '&:hover': { backgroundColor: '#6d28d9' },
                  },
                  '& .MuiInputBase-input': { display: 'none' },
                  '& .MuiInputAdornment-root': { margin: 0, width: '100%', justifyContent: 'center' },
                  '& .MuiSvgIcon-root': { color: 'white', width: '20px', height: '20px' }
                }
              },
              popper: {
                sx: {
                  '& .MuiPaper-root': {
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                  }
                }
              }
            }}
          />
        </div>

        <button
          onClick={() => shiftDate(1)}
          disabled={selectedDate >= yesterdayIso}
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all border border-slate-700 active:scale-95",
            selectedDate >= yesterdayIso
              ? "bg-slate-900/50 text-slate-700 cursor-not-allowed"
              : "bg-slate-800/80 hover:bg-slate-700 text-slate-300"
          )}
          title="Next Day"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
