'use client'

import * as React from 'react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { EditUnitSheet } from './EditUnitSheet'
import { User, Settings2, Activity } from 'lucide-react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import type { Tables } from '@/lib/types/database'
import { getTerms } from '@/lib/business-type'

type TableWithZone = Tables<'physical_tables'> & { zones?: { name?: string | null } | null }

interface UnitCardProps {
  table: Tables<'physical_tables'>
  busyInfo?: { 
    guestName: string; 
    createdByName?: string;
    status: string; 
    partySize: number;
    reservationDate?: string;
    checkoutDate?: string;
    startTime?: string;
    endTime?: string;
  }
  isBusy: boolean
  isOffline: boolean
  isTappable: boolean
  businessType: string
  canManage: boolean
  zones?: { id: string, name: string }[]
  mode?: 'monitoring' | 'management'
  currentSlug?: string
  selectedDate?: string
}

export function UnitCard({ 
  table, 
  busyInfo, 
  isBusy, 
  isOffline, 
  isTappable, 
  businessType,
  canManage,
  zones = [],
  mode = 'monitoring',
  currentSlug,
  selectedDate
}: UnitCardProps) {
  const terms = getTerms(businessType)
  const occupiedLabel = terms.hasCheckout ? 'Occupied' : 'Booked'

  // ✨ Magic UI: Mouse position for follow-glow
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const radialGradient = useTransform(
    [mouseX, mouseY],
    ([x, y]) => `radial-gradient(400px circle at ${x}px ${y}px, ${isBusy ? 'rgba(244,63,94,0.1)' : 'rgba(124,58,237,0.1)'}, transparent 80%)`
  )

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  return (
    <div className="relative h-full w-full group overflow-hidden rounded-3xl">
      {/* 🔮 Magic UI: Border Beam / Glow for Busy Units (Monitoring only) */}
      {isBusy && mode === 'monitoring' && (
        <motion.div 
          className="absolute inset-[1px] rounded-3xl z-[5] pointer-events-none opacity-40 shadow-[0_0_20px_rgba(244,63,94,0.15)]"
          animate={{ scale: [1, 1.01, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Background card style with Interactive Glow */}
      <div 
        onMouseMove={handleMouseMove}
        className={cn(
          'absolute inset-0 border transition-all duration-500 rounded-3xl z-0 overflow-hidden',
          isOffline
            ? 'bg-background border-border/60 opacity-50'
            : isBusy && mode === 'monitoring'
              ? 'bg-gradient-to-br from-rose-500/10 via-slate-900/40 to-slate-900/60 border-rose-500/30'
              : 'bg-card border-border/80 hover:border-violet-500/40 hover:bg-card/80 shadow-lg'
        )}
      >
        {/* 🖱️ Interactive Follow-Glow (Monitoring only) */}
        {mode === 'monitoring' && (
          <motion.div
            className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
            style={{ background: radialGradient }}
          />
        )}
      </div>

      {/* Main Tappable Area (The Link) — Lower Index */}
      {mode === 'monitoring' ? (
        isTappable ? (
          <Link 
            href={`/dashboard/${currentSlug || table.restaurant_id}/reservations/new?tableId=${table.id}${selectedDate ? `&date=${selectedDate}` : ''}`} 
            className="absolute inset-0 z-10"
          />
        ) : (
          <div className="absolute inset-0 z-10" />
        )
      ) : (
        <EditUnitSheet 
          table={table} 
          businessType={businessType} 
          canManage={canManage}
          zones={zones}
          trigger={<button type="button" aria-label={`Edit ${terms.unitLower} ${table.table_name}`} className="absolute inset-0 z-10 w-full h-full cursor-pointer" />}
        />
      )}

      {/* Action Indicator - Only in management mode as a visual hint */}
      {mode === 'management' && (
        <div className="absolute top-4 right-4 z-30 flex items-center justify-center transition-all duration-300 opacity-40 group-hover:opacity-100 pointer-events-none">
          <div className="w-8 h-8 flex items-center justify-center bg-background/80 border border-border/60 rounded-xl text-muted-foreground group-hover:text-violet-400 group-hover:border-violet-500/50 backdrop-blur-sm transition-all shadow-xl">
            <Settings2 className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Content Overlay — Mid Index, ignored by mouse/touch except descendants */}
      <div className={cn("relative z-20 p-5 h-full flex flex-col gap-2.5 pointer-events-none", mode === 'management' && "items-center text-center justify-center pt-8")}>
        {mode === 'monitoring' && (
          <div className="flex items-center justify-between mb-1">
            <span className={cn(
              'w-2.5 h-2.5 rounded-full flex-shrink-0',
              isOffline ? 'bg-muted'
                : isBusy ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-pulse'
                  : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
            )} />
            {/* Spacer for Edit button area */}
            <div className="w-7 h-7" />
          </div>
        )}

        {/* Info */}
        <div className={cn("mt-1", mode === 'management' && "mb-4")}>
          <p className={cn(
            'font-black leading-tight italic tracking-tighter', 
            mode === 'management' ? 'text-3xl' : 'text-2xl',
            isOffline ? 'text-muted-foreground/60' : (isBusy && mode === 'monitoring') ? 'text-rose-100' : 'text-foreground'
          )}>
            {table.table_name}
          </p>
          <p className={cn('text-[11px] font-bold mt-1', isOffline ? 'text-muted-foreground' : 'text-muted-foreground uppercase tracking-[0.2em]')}>
            {table.capacity} {terms.capacityUnit}
          </p>
        </div>

        {/* Status Badge (Monitoring Mode) / Zone Label (Management Mode) */}
        <div className={cn("mt-auto flex flex-col gap-1.5", mode === 'management' && "mt-0 pt-0 items-center")}>
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {mode === 'monitoring' ? (
              <Badge className={cn(
                'text-[10px] font-black w-fit px-2.5 py-0.5 rounded-lg border uppercase tracking-widest transition-all duration-500',
                isOffline ? 'bg-muted text-muted-foreground/60 border-border'
                  : isBusy ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              )}>
                {isOffline ? 'Offline' : isBusy ? occupiedLabel : 'Available'}
              </Badge>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted/40 border border-border/60">
                 <div className="w-1.5 h-1.5 rounded-full bg-violet-500/40" />
                 <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">{(table as TableWithZone).zones?.name || 'Unassigned'}</span>
              </div>
            )}

            {/* Premium Range Badge for Multi-day stays */}
            {mode === 'monitoring' && isBusy && busyInfo?.reservationDate && busyInfo?.checkoutDate && busyInfo.reservationDate !== busyInfo.checkoutDate && (
              <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/30 text-[9px] font-black uppercase px-2 py-0.5 rounded-lg flex items-center gap-1 whitespace-nowrap">
                <Activity className="w-3 h-3" />
                {format(parseISO(busyInfo.reservationDate), 'MMM d')}
                <span className="opacity-50">→</span>
                {format(parseISO(busyInfo.checkoutDate), 'MMM d')}
              </Badge>
            )}
          </div>

          {mode === 'monitoring' && isBusy && busyInfo?.guestName && (
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] text-rose-300/80 font-black truncate flex items-center gap-1 uppercase tracking-tighter">
                  <User className="w-3 h-3 flex-shrink-0" /> {busyInfo.guestName} {busyInfo.partySize > 0 && `(${busyInfo.partySize}p)`}
                </p>
                {busyInfo.startTime && (
                  <span className="text-[9px] font-black text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-lg border border-rose-500/20 italic">
                    {busyInfo.startTime.replace(/^(\d{2}):(\d{2}):\d{2}$/, (_, h, m) => {
                      const hh = parseInt(h);
                      return `${hh % 12 || 12}:${m} ${hh >= 12 ? 'PM' : 'AM'}`;
                    })}
                  </span>
                )}
              </div>
              <p className="text-[8px] text-muted-foreground/40 font-bold uppercase tracking-widest leading-none ml-4">
                By {busyInfo.createdByName || 'Staff'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
