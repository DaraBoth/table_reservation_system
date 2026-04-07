"use client"

import * as React from "react"
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from "framer-motion"
import { BarChart } from '@mui/x-charts/BarChart'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ReportFilters } from './ReportFilters'
import {
  ChevronLeft,
  Table2,
  BarChart2,
  Star,
  Phone,
  User,
  TrendingUp,
  ShieldCheck,
  Users
} from 'lucide-react'

interface Props {
  dateLabel: string
  totalCompleted: number
  totalGuests: number
  statusTrend: any[]
  tablePerformance: any[] // { name: string, volume: number }[]
  topCustomers: any[]
  businessType?: string
  statusColors: Record<string, string>
  statusLabels: Record<string, string>
  isAdmin: boolean
  staffPerformance?: any[]
  currentSlug?: string
}

export default function ReportsDashboardClient({
  dateLabel,
  statusTrend,
  tablePerformance,
  topCustomers,
  businessType = 'restaurant',
  statusColors,
  statusLabels,
  isAdmin,
  staffPerformance = [],
  currentSlug
}: Props) {
  const { resolvedTheme } = useTheme()
  const textColor = resolvedTheme === 'dark' ? '#e2e8f0' : '#1e293b'
  const axisColor = resolvedTheme === 'dark' ? '#334155' : '#cbd5e1'
  const gridColor = resolvedTheme === 'dark' ? '#1e293b' : '#e2e8f0'

  const [isUpdating, setIsUpdating] = React.useState(false)

  // Briefly pulse a loading state when props change to provide extra feedback
  React.useEffect(() => {
    setIsUpdating(true)
    const timer = setTimeout(() => setIsUpdating(false), 800)
    return () => clearTimeout(timer)
  }, [dateLabel])

  // Dynamic Label Mapping based on Business Type
  const labelMap: Record<string, any> = {
    restaurant: {
      unit: 'Table',
      units: 'Tables',
      performance: 'Table performance',
      volume: 'Guests',
      activity: 'Visits'
    },
    hotel: {
      unit: 'Room',
      units: 'Rooms',
      performance: 'Room performance',
      volume: 'Guests',
      activity: 'Stays'
    },
    guesthouse: {
      unit: 'Room',
      units: 'Rooms',
      performance: 'Room performance',
      volume: 'Guests',
      activity: 'Stays'
    }
  }

  // Calculate dynamic height for the trend chart based on volume
  const maxVolume = statusTrend.reduce((max, day) => {
    const total = (day.completed || 0) + (day.cancelled || 0) + (day.no_show || 0) + (day.others || 0)
    return Math.max(max, total)
  }, 0)

  // Base 320px, grow up to 450px for high volume (over 20 bookings)
  const trendHeight = Math.min(450, Math.max(320, maxVolume * 12))

  // Fallback to restaurant if type unknown
  const labels = labelMap[businessType] || labelMap.restaurant

  return (
    <div className="space-y-6 max-w-4xl mx-auto container px-2 py-6 sm:px-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/${currentSlug}/units`}
            className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shadow-xl hover:shadow-violet-500/10 flex-shrink-0"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-foreground tracking-tight leading-none">Booking Analytics</h1>
              {isUpdating && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-violet-600 rounded-lg animate-pulse">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span className="text-[8px] font-black text-foreground uppercase tracking-widest">LIVE SYNC</span>
                </div>
              )}
            </div>
            <p className="text-muted-foreground text-[11px] font-black uppercase tracking-widest mt-2">{dateLabel}</p>
          </div>
        </div>
      </div>

      {/* Modern Weekly Filter Navigation */}
      <ReportFilters />

      <div className="grid grid-cols-1 gap-10 pt-2">

        {/* Chart 1: Reservation Report */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-2 bg-card/50 border border-border p-3 rounded-2xl px-4 w-fit">
              <BarChart2 className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Reservation Report</h2>
            </div>
            <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[9px] font-black py-1 px-3 w-fit rounded-full">WEEKLY STATS</Badge>
          </div>

          {/* Custom Legend for Chart 1 - Grid for Mobile */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-2">
            {[
              { label: 'Done', color: '#10b981' },
              { label: 'Cancel', color: '#ef4444' },
              { label: 'No Show', color: '#f97316' },
              { label: 'Other', color: '#445164' }
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 bg-card/40 border border-border/80 p-2.5 rounded-xl">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] font-black text-foreground/70 uppercase tracking-widest">{item.label}</span>
              </div>
            ))}
          </div>

          {/* The Chart itself - Max width on mobile */}
          <div className="bg-card/60 border border-border rounded-[32px] p-2 sm:p-8 pt-6">
            <div style={{ height: `${trendHeight}px` }} className="w-full">
              <BarChart
                dataset={statusTrend}
                margin={{ left: -10, right: 10, top: 20, bottom: 0 }}
                xAxis={[{ scaleType: 'band', dataKey: 'day', tickLabelStyle: { fill: textColor, fontSize: 11, fontWeight: '900' } }]}
                series={[
                  { dataKey: 'completed', label: 'Done', color: '#10b981', stack: 'total' },
                  { dataKey: 'cancelled', label: 'Cancel', color: '#ef4444', stack: 'total' },
                  { dataKey: 'no_show', label: 'No Show', color: '#f97316', stack: 'total' },
                  { dataKey: 'others', label: 'Other', color: '#445164', stack: 'total' },
                ]}
                grid={{ horizontal: true }}
                sx={{
                  '& .MuiChartsLegend-root': { display: 'none' },
                  '& .MuiChartsAxis-left .MuiChartsAxis-tickLabel': { fill: textColor, fontSize: 10, fontWeight: '800' },
                  '& .MuiChartsAxis-bottom .MuiChartsAxis-tickLabel': { fill: textColor, fontSize: 11, fontWeight: '800' },
                  '& .MuiChartsAxis-line': { stroke: axisColor },
                  '& .MuiChartsGrid-line': { strokeDasharray: '4 4', stroke: gridColor },
                  '& .MuiCharts-noDataOverlay text': { fill: textColor + ' !important', fontWeight: '800' }
                }}
              />
            </div>
          </div>
        </section>

        {/* Chart 2: Ranking Performance Upgrade */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-2 bg-card/50 border border-border p-3 rounded-2xl px-4 w-fit">
              <Table2 className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-black text-foreground uppercase tracking-widest">{labels.performance}</h2>
            </div>
            <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[9px] font-black py-1 px-3 w-fit rounded-full">WEEKLY VOLUME</Badge>
          </div>

          <div className="bg-card/60 border border-border rounded-[32px] p-2 sm:p-8 pt-6">
            <div className="flex items-center gap-2 px-4 text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-4">
              <TrendingUp className="w-3 h-3 text-indigo-500" />
              <span>Ranked by busiest {labels.units} this week</span>
            </div>

            {/* Dynamic Height Container: 48px per table, minimum 400px */}
            <div
              className="w-full overflow-x-hidden"
              style={{ height: `${Math.max(400, tablePerformance.length * 48)}px` }}
            >
              <BarChart
                dataset={tablePerformance}
                layout="horizontal"
                margin={{ left: 0, right: 40, top: 10, bottom: 30 }}
                yAxis={[{
                  scaleType: 'band',
                  dataKey: 'id',
                  width: 60,
                  valueFormatter: (id: string) => {
                    const item = tablePerformance.find(p => p.id === id);
                    return item ? `${item.name} (${item.capacity}p)` : id;
                  },
                  tickLabelStyle: { fill: textColor, fontSize: 10, fontWeight: '800' }
                }]}
                xAxis={[{
                  tickLabelStyle: { fill: textColor, fontSize: 10, fontWeight: '800' }
                }]}
                series={[{
                  dataKey: 'volume',
                  label: 'Total ' + labels.volume,
                  color: '#6366f1', // Professional Indigo
                  valueFormatter: (v) => `${v} ${labels.volume}`
                }]}
                grid={{ vertical: true }}
                sx={{
                  '& .MuiChartsLegend-root': { display: 'none' },
                  '& .MuiChartsAxis-left .MuiChartsAxis-tickLabel': { fill: textColor, fontSize: 11, fontWeight: '900' },
                  '& .MuiChartsAxis-bottom .MuiChartsAxis-tickLabel': { fill: textColor, fontSize: 10, fontWeight: '800' },
                  '& .MuiChartsAxis-line': { stroke: axisColor },
                  '& .MuiChartsGrid-line': { strokeDasharray: '4 4', stroke: gridColor },
                  '& .MuiCharts-noDataOverlay text': { fill: textColor + ' !important', fontWeight: '800' },
                  '& .MuiBarLabel-root': { fill: textColor, fontSize: 10, fontWeight: '800' }
                }}
                slotProps={{
                  barLabel: {
                    display: 'auto',
                  },
                }}
              />
            </div>
          </div>
        </section>

        {/* --- SECRET ADMIN SECTION: STAFF PERFORMANCE --- */}
        {isAdmin && staffPerformance.length > 0 && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
              <div className="flex items-center gap-2 bg-card border border-border p-3 rounded-2xl px-4 w-fit shadow-lg shadow-violet-500/5">
                <ShieldCheck className="w-4 h-4 text-violet-400" />
                <h2 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">Team Efficiency Hub</h2>
              </div>
              <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[9px] font-black py-1 px-3 w-fit rounded-full flex items-center gap-1.5 ring-1 ring-red-500/20 leading-none">
                <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                ADMIN ONLY
              </Badge>
            </div>

            <div className="bg-card/80 border border-border rounded-[32px] p-2 sm:p-8 pt-6 backdrop-blur-md relative overflow-hidden group/admin">
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 blur-[100px] -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none" />

              <div className="flex items-center gap-2 px-4 text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-10 relative z-10">
                <Users className="w-3.5 h-3.5 text-violet-500" />
                <span>Real-time Team Performance Analytics</span>
              </div>

              {/* Legend for Staff Stats */}
              <div className="flex flex-wrap gap-4 px-4 mb-10 relative z-10">
                {[
                  { label: 'Done', color: 'bg-emerald-500' },
                  { label: 'Confirmed', color: 'bg-emerald-500/40' },
                  { label: 'No Show', color: 'bg-orange-500' },
                  { label: 'Cancelled', color: 'bg-red-500' }
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Elite Leaderboard Container */}
              <div className="space-y-6 relative z-10 px-2 min-h-[300px]">
                <AnimatePresence>
                  {staffPerformance.map((staff, idx) => {
                    const successCount = (staff.completed || 0) + (staff.confirmed || 0)
                    const lossCount = (staff.no_show || 0) + (staff.cancelled || 0)
                    const successRate = staff.total > 0 ? Math.round((successCount / staff.total) * 100) : 0
                    
                    // Simple segment widths based on percentage of total
                    const getWidth = (count: number) => staff.total > 0 ? `${(count / staff.total) * 100}%` : '0%'

                    return (
                      <motion.div 
                        key={staff.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1, duration: 0.5, ease: "easeOut" }}
                        className="group/item"
                      >
                        {/* Name & Rate Header */}
                        <div className="flex items-end justify-between mb-2.5 px-1">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-[10px] font-black text-violet-400 group-hover/item:bg-violet-600 group-hover/item:text-foreground transition-all duration-300">
                              {idx + 1}
                            </div>
                            <div>
                               <p className="text-xs font-black text-foreground uppercase tracking-wider leading-none mb-1 group-hover/item:text-violet-400 transition-colors">{staff.name}</p>
                               <div className="flex items-center gap-1.5 text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest">
                                  <span>Total {staff.total}</span>
                                  <span className="w-1 h-1 rounded-full bg-muted" />
                                  <span className={successRate > 70 ? 'text-emerald-500' : 'text-orange-500'}>{successRate}% Success</span>
                               </div>
                            </div>
                          </div>
                          <p className="text-[10px] font-black italic text-muted-foreground group-hover/item:text-foreground transition-colors">{successCount} / {staff.total}</p>
                        </div>

                        {/* Custom Segmented Bar Chart */}
                        <div className="h-4 w-full bg-background/60 rounded-full border border-border overflow-hidden flex ring-4 ring-transparent group-hover/item:ring-violet-600/5 transition-all duration-500">
                           {/* Done */}
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: getWidth(staff.completed) }}
                             transition={{ delay: (idx * 0.1) + 0.3, duration: 1 }}
                             className="h-full bg-emerald-500 relative group/seg"
                           />
                           {/* Confirmed */}
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: getWidth(staff.confirmed) }}
                             transition={{ delay: (idx * 0.1) + 0.4, duration: 1 }}
                             className="h-full bg-emerald-500/40 relative"
                           />
                           {/* No Show */}
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: getWidth(staff.no_show) }}
                             transition={{ delay: (idx * 0.1) + 0.5, duration: 1 }}
                             className="h-full bg-orange-500 relative"
                           />
                           {/* Cancelled */}
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: getWidth(staff.cancelled) }}
                             transition={{ delay: (idx * 0.1) + 0.6, duration: 1 }}
                             className="h-full bg-red-500 relative"
                           />
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
          </section>
        )}

        {/* Loyalty Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 bg-card/50 border border-border p-3 rounded-2xl px-4 w-fit mx-2">
            <Star className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Loyalty Radar</h2>
          </div>

          <div className="px-2">
            {topCustomers.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {topCustomers.map((cust, idx) => (
                  <div key={cust.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-card/60 border border-border rounded-2xl group hover:border-emerald-500/30 transition-all gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[11px] font-black text-emerald-400 flex-shrink-0">
                        0{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-foreground tracking-tight leading-none mb-1.5 truncate">{cust.name || 'Anonymous'}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                          <Phone className="w-3 h-3" /> {cust.key.slice(-4).padStart(cust.key.length, '*')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end sm:gap-10 border-t border-border/50 sm:border-t-0 pt-3 sm:pt-0">
                      <div className="text-center">
                        <p className="text-lg font-black text-foreground leading-none italic">{cust.visits}</p>
                        <p className="text-[9px] text-muted-foreground/60 font-black uppercase tracking-tighter mt-1.5">{labels.activity}</p>
                      </div>
                      <div className="w-px h-6 bg-muted/50 sm:hidden mx-4" />
                      <div className="text-center">
                        <p className="text-lg font-black text-emerald-400 leading-none italic">{cust.guests}</p>
                        <p className="text-[9px] text-muted-foreground/60 font-black uppercase tracking-tighter mt-1.5">{labels.volume}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-border rounded-3xl bg-card/20">
                <User className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground/60 text-[11px] font-black uppercase tracking-[0.2em]">No guest data records this week</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <p className="text-center text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] py-8 italic">Automated Weekly Analytics Engine</p>
    </div>
  )
}
