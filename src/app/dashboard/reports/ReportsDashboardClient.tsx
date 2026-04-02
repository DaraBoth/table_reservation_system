"use client"

import * as React from "react"
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
  TrendingUp
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
}

export default function ReportsDashboardClient({
  dateLabel,
  statusTrend,
  tablePerformance,
  topCustomers,
  businessType = 'restaurant'
}: Props) {
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
            href="/dashboard/tables"
            className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-xl hover:shadow-violet-500/10 flex-shrink-0"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight leading-none">Booking Analytics</h1>
              {isUpdating && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-violet-600 rounded-lg animate-pulse">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span className="text-[8px] font-black text-white uppercase tracking-widest">LIVE SYNC</span>
                </div>
              )}
            </div>
            <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest mt-2">{dateLabel}</p>
          </div>
        </div>
      </div>

      {/* Modern Weekly Filter Navigation */}
      <ReportFilters />

      <div className="grid grid-cols-1 gap-10 pt-2">

        {/* Chart 1: Reservation Report */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-800 p-3 rounded-2xl px-4 w-fit">
              <BarChart2 className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-widest">Reservation Report</h2>
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
              <div key={item.label} className="flex items-center gap-3 bg-slate-900/40 border border-slate-800/80 p-2.5 rounded-xl">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{item.label}</span>
              </div>
            ))}
          </div>

          {/* The Chart itself - Max width on mobile */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-[32px] p-2 sm:p-8 pt-6">
            <div style={{ height: `${trendHeight}px` }} className="w-full">
              <BarChart
                dataset={statusTrend}
                margin={{ left: -10, right: 10, top: 20, bottom: 0 }}
                xAxis={[{ scaleType: 'band', dataKey: 'day', tickLabelStyle: { fill: '#ffffff', fontSize: 11, fontWeight: '900' } }]}
                series={[
                  { dataKey: 'completed', label: 'Done', color: '#10b981', stack: 'total' },
                  { dataKey: 'cancelled', label: 'Cancel', color: '#ef4444', stack: 'total' },
                  { dataKey: 'no_show', label: 'No Show', color: '#f97316', stack: 'total' },
                  { dataKey: 'others', label: 'Other', color: '#445164', stack: 'total' },
                ]}
                grid={{ horizontal: true }}
                sx={{
                  '& .MuiChartsLegend-root': { display: 'none' },
                  '& .MuiChartsAxis-left .MuiChartsAxis-tickLabel': { fill: '#ffffff', fontSize: 10, fontWeight: '800' },
                  '& .MuiChartsAxis-bottom .MuiChartsAxis-tickLabel': { fill: '#ffffff', fontSize: 11, fontWeight: '800' },
                  '& .MuiChartsAxis-line': { stroke: '#334155' },
                  '& .MuiChartsGrid-line': { strokeDasharray: '4 4', stroke: '#1e293b' },
                  '& .MuiCharts-noDataOverlay text': { fill: '#ffffff !important', fontWeight: '800' }
                }}
              />
            </div>
          </div>
        </section>

        {/* Chart 2: Ranking Performance Upgrade */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-800 p-3 rounded-2xl px-4 w-fit">
              <Table2 className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-widest">{labels.performance}</h2>
            </div>
            <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[9px] font-black py-1 px-3 w-fit rounded-full">WEEKLY VOLUME</Badge>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-[32px] p-2 sm:p-8 pt-6">
            <div className="flex items-center gap-2 px-4 text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4">
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
                  tickLabelStyle: { fill: '#ffffff', fontSize: 10, fontWeight: '800' }
                }]}
                xAxis={[{
                  tickLabelStyle: { fill: '#ffffff', fontSize: 10, fontWeight: '800' }
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
                  '& .MuiChartsAxis-left .MuiChartsAxis-tickLabel': { fill: '#ffffff', fontSize: 11, fontWeight: '900' },
                  '& .MuiChartsAxis-bottom .MuiChartsAxis-tickLabel': { fill: '#ffffff', fontSize: 10, fontWeight: '800' },
                  '& .MuiChartsAxis-line': { stroke: '#334155' },
                  '& .MuiChartsGrid-line': { strokeDasharray: '4 4', stroke: '#1e293b' },
                  '& .MuiCharts-noDataOverlay text': { fill: '#ffffff !important', fontWeight: '800' },
                  '& .MuiBarLabel-root': { fill: '#ffffff', fontSize: 10, fontWeight: '800' }
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

        {/* Loyalty Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-800 p-3 rounded-2xl px-4 w-fit mx-2">
            <Star className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Loyalty Radar</h2>
          </div>

          <div className="px-2">
            {topCustomers.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {topCustomers.map((cust, idx) => (
                  <div key={cust.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-slate-900/60 border border-slate-800 rounded-2xl group hover:border-emerald-500/30 transition-all gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[11px] font-black text-emerald-400 flex-shrink-0">
                        0{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-white tracking-tight leading-none mb-1.5 truncate">{cust.name || 'Anonymous'}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                          <Phone className="w-3 h-3" /> {cust.key.slice(-4).padStart(cust.key.length, '*')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end sm:gap-10 border-t border-slate-800/50 sm:border-t-0 pt-3 sm:pt-0">
                      <div className="text-center">
                        <p className="text-lg font-black text-white leading-none italic">{cust.visits}</p>
                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-tighter mt-1.5">{labels.activity}</p>
                      </div>
                      <div className="w-px h-6 bg-slate-800/50 sm:hidden mx-4" />
                      <div className="text-center">
                        <p className="text-lg font-black text-emerald-400 leading-none italic">{cust.guests}</p>
                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-tighter mt-1.5">{labels.volume}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                <User className="w-10 h-10 text-slate-800 mx-auto mb-4" />
                <p className="text-slate-600 text-[11px] font-black uppercase tracking-[0.2em]">No guest data records this week</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <p className="text-center text-[10px] text-slate-700 font-black uppercase tracking-[0.3em] py-8 italic">Automated Weekly Analytics Engine</p>
    </div>
  )
}
