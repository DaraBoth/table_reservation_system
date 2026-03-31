"use client"

import * as React from "react"
import { format, setHours, setMinutes } from "date-fns"
import { Clock, Calendar as CalendarIcon, ChevronDown } from "lucide-react"
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'
import { MultiSectionDigitalClock } from '@mui/x-date-pickers/MultiSectionDigitalClock'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#8b5cf6', // Tailwind violet-500
    },
    background: {
      paper: 'transparent',
      default: 'transparent'
    }
  },
  typography: {
    fontFamily: 'inherit',
  },
  components: {
    MuiPickersCalendarHeader: {
      styleOverrides: {
        root: {
          color: '#f8fafc',
        }
      }
    },
    MuiPickersDay: {
      styleOverrides: {
        root: {
          color: '#f8fafc',
          fontWeight: 600,
        }
      }
    },
    MuiDayCalendar: {
      styleOverrides: {
        weekDayLabel: {
          color: '#94a3b8',
          fontWeight: 800,
        }
      }
    }
  }
})

interface DateTimePickerProps {
  value?: Date
  onChange?: (date: Date) => void
  label?: string
}

export function DateTimePickerV2({ value, onChange, label }: DateTimePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(value || new Date())

  // Generate hours for the matrix
  const hours = React.useMemo(() => {
    const hoursArr = []
    for (let h = 8; h <= 23; h++) {
      hoursArr.push(h)
    }
    return hoursArr
  }, [])

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) return
    const updated = setMinutes(setHours(newDate, date?.getHours() || 19), date?.getMinutes() || 0)
    setDate(updated)
    onChange?.(updated)
  }

  const handleTimeSelect = (newTime: Date | null) => {
    if (!date || !newTime) return
    const updated = setMinutes(setHours(date, newTime.getHours()), newTime.getMinutes())
    setDate(updated)
    onChange?.(updated)
  }

  const currentTimeStr = date ? format(date, "HH:mm") : ""

  return (
    <ThemeProvider theme={darkTheme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Popover>
          <PopoverTrigger 
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full h-16 justify-between px-6 font-black bg-slate-900/60 border border-slate-800/50 hover:bg-slate-920 hover:border-violet-500/50 rounded-2xl transition-all group backdrop-blur-3xl shadow-xl ring-1 ring-white/5"
            )}
          >
            <div className="flex items-center gap-4">
              <CalendarIcon className="h-6 w-6 text-violet-500 group-hover:scale-110 transition-transform" />
              <div className="flex flex-col items-start gap-1">
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 leading-none">Command Hub</span>
                {date ? (
                  <span className="text-base uppercase tracking-widest text-white leading-none">
                    {format(date, "EEE, MMM d")} <span className="text-slate-500 mx-2">|</span> <span className="text-emerald-400">{format(date, "h:mm a")}</span>
                  </span>
                ) : (
                  <span className="text-base uppercase tracking-widest text-slate-500 leading-none">Set Master Schedule</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
               <Clock className="h-5 w-5 text-emerald-500 group-hover:rotate-12 transition-transform opacity-50" />
               <ChevronDown className="h-5 w-5 text-slate-600 group-hover:text-violet-400 transition-colors" />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-slate-950 border-slate-800 shadow-2xl rounded-2xl overflow-hidden" align="start">
            <div className="flex bg-slate-950">
              
              {/* Left Side: Calendar */}
              <div className="p-4 border-r border-white/5 bg-slate-900/20">
                <div className="mb-2 flex items-center gap-2">
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-500">Select Date</span>
                </div>
                <DateCalendar
                  value={date}
                  onChange={(newDate) => handleDateSelect(newDate || undefined)}
                  sx={{
                    width: '320px',
                    bgcolor: 'transparent'
                  }}
                />
              </div>

              {/* Right Side: Digital Spinners */}
              <div className="p-4 bg-slate-900/40">
                <div className="mb-4 flex items-center gap-2">
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Select Time</span>
                </div>
                <MultiSectionDigitalClock
                  value={date}
                  onChange={handleTimeSelect}
                  timeSteps={{ minutes: 15 }}
                  ampm={true}
                  sx={{
                    bgcolor: 'transparent',
                    maxHeight: '300px',
                    '& .MuiList-root': {
                      padding: 0,
                      margin: '0 4px',
                      '&::-webkit-scrollbar': { width: '4px' },
                      '&::-webkit-scrollbar-thumb': { backgroundColor: '#10b981', borderRadius: '4px' },
                    },
                    '& .MuiMenuItem-root.Mui-selected': {
                      backgroundColor: '#10b981',
                      color: '#020617',
                      fontWeight: 900,
                    },
                    '& .MuiMenuItem-root': {
                      color: '#f8fafc',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      px: 2,
                      py: 1,
                      borderRadius: '8px',
                      marginBottom: '4px'
                    }
                  }}
                />
              </div>

            </div>
          </PopoverContent>
        </Popover>
      </LocalizationProvider>
    </ThemeProvider>
  )
}
