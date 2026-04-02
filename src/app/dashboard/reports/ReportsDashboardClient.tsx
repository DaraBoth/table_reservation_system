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

  // Fallback to restaurant if type unknown
  const labels = labelMap[businessType] || labelMap.restaurant

  return (
    <div className="space-y-8 max-w-3xl mx-auto container px-4 py-8 sm:px-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/tables"
            className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-xl hover:shadow-violet-500/10 flex-shrink-0"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">Booking Analytics</h1>
            <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest mt-2">{dateLabel}</p>
          </div>
        </div>
      </div>

      {/* Modern Weekly Filter Navigation */}
      <ReportFilters />

      <div className="grid grid-cols-1 gap-8 pt-4">
        {/* Chart 1: Reservation Report */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-[32px] p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-widest">Reservation Report</h2>
            </div>
            <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[9px] font-black py-0.5">WEEKLY STATS</Badge>
          </div>

          {/* Custom Legend for Chart 1 */}
          <div className="flex flex-wrap items-center justify-center gap-6 px-2">
            {[
              { label: 'Done', color: '#10b981' },
              { label: 'Cancel', color: '#ef4444' },
              { label: 'No Show', color: '#f97316' },
              { label: 'Other', color: '#445164' }
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                <span className="text-[11px] font-bold text-slate-100 uppercase tracking-widest">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="h-[300px] w-full">
            <BarChart
              dataset={statusTrend}
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
        </section>

        {/* Chart 2: Ranking Performance Upgrade */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-[32px] p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Table2 className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-widest">{labels.performance}</h2>
            </div>
            <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[9px] font-black py-0.5">WEEKLY VOLUME</Badge>
          </div>

          <div className="flex items-center gap-2 px-2 text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2">
            <TrendingUp className="w-3 h-3 text-indigo-500" />
            <span>Ranked by busiest {labels.units} this week</span>
          </div>

          {/* Dynamic Height Container: 35px per table, minimum 400px */}
          <div 
            className="w-full overflow-x-hidden" 
            style={{ height: `${Math.max(400, tablePerformance.length * 35)}px` }}
          >
            <BarChart
              dataset={tablePerformance}
              layout="horizontal"
              margin={{ left: 0, right: 10, top: 20, bottom: 15 }} // Minimal margins to maximize width
              yAxis={[{
                scaleType: 'band',
                dataKey: 'id',
                width: 80,
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
                color: '#6366f1' // Professional Indigo
              }]}
              grid={{ vertical: true }}
              sx={{
                '& .MuiChartsLegend-root': { display: 'none' },
                '& .MuiChartsAxis-left .MuiChartsAxis-tickLabel': { fill: '#ffffff', fontSize: 10, fontWeight: '800' },
                '& .MuiChartsAxis-bottom .MuiChartsAxis-tickLabel': { fill: '#ffffff', fontSize: 10, fontWeight: '800' },
                '& .MuiChartsAxis-line': { stroke: '#334155' },
                '& .MuiChartsGrid-line': { strokeDasharray: '4 4', stroke: '#1e293b' },
                '& .MuiCharts-noDataOverlay text': { fill: '#ffffff !important', fontWeight: '800' }
              }}
            />
          </div>
        </section>

        {/* Loyalty Section */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-[32px] p-8 space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-widest">Loyalty Radar</h2>
            </div>
          </div>

          {topCustomers.length > 0 ? (
            <div className="space-y-4">
              {topCustomers.map((cust, idx) => (
                <div key={cust.key} className="flex items-center justify-between p-5 bg-slate-950/40 border border-slate-800/60 rounded-2xl group hover:border-emerald-500/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[11px] font-black text-emerald-400">
                      0{idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white tracking-tight leading-none mb-1.5">{cust.name || 'Anonymous'}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                        <Phone className="w-3 h-3" /> {cust.key.slice(-4).padStart(cust.key.length, '*')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-10">
                    <div className="text-center">
                      <p className="text-lg font-black text-white leading-none">{cust.visits}</p>
                      <p className="text-[9px] text-slate-600 font-black uppercase tracking-tighter mt-1.5">{labels.activity}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-black text-emerald-400 leading-none">{cust.guests}</p>
                      <p className="text-[9px] text-slate-600 font-black uppercase tracking-tighter mt-1.5">{labels.volume}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center border border-dashed border-slate-800 rounded-3xl">
              <User className="w-10 h-10 text-slate-800 mx-auto mb-4" />
              <p className="text-slate-600 text-[11px] font-black uppercase tracking-[0.2em]">No guest data records this week</p>
            </div>
          )}
        </section>
      </div>

      <p className="text-center text-[10px] text-slate-700 font-black uppercase tracking-[0.3em] pb-8 italic">Automated Weekly Analytics Engine</p>
    </div>
  )
}
