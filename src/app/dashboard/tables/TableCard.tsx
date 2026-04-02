'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { EditTableSheet } from './EditTableSheet'
import { User } from 'lucide-react'
import type { Tables } from '@/lib/types/database'

interface TableCardProps {
  table: Tables<'physical_tables'>
  busyInfo?: { guestName: string; status: string }
  isBusy: boolean
  isOffline: boolean
  isTappable: boolean
  businessType: string
  isAdmin: boolean
}

export function TableCard({ 
  table, 
  busyInfo, 
  isBusy, 
  isOffline, 
  isTappable, 
  businessType,
  isAdmin
}: TableCardProps) {
  const isHotel = businessType === 'hotel' || businessType === 'guesthouse'

  return (
    <div className="relative h-full w-full group overflow-hidden rounded-[2rem]">
      {/* Background card style */}
      <div className={cn(
        'absolute inset-0 border-2 transition-all',
        isOffline
          ? 'bg-slate-950 border-slate-800 opacity-50'
          : isBusy
            ? 'bg-gradient-to-br from-rose-500/10 to-transparent border-rose-500/30'
            : 'bg-slate-900 border-slate-800 hover:border-emerald-500/40'
      )} />

      {/* Main Tappable Area (The Link) — Lower Index */}
      {isTappable ? (
        <Link 
            href={`/dashboard/reservations/new?tableId=${table.id}`} 
            className="absolute inset-0 z-10"
        />
      ) : (
        <div className="absolute inset-0 z-10" />
      )}

      {/* Edit Trigger — Highest Index for Mobile Reliability */}
      <div className="absolute top-4 right-4 z-30 flex items-center justify-center">
        <EditTableSheet table={table} businessType={businessType} isAdmin={isAdmin} />
      </div>

      {/* Content Overlay — Mid Index, ignored by mouse/touch except descendants */}
      <div className="relative z-20 p-4 h-full flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center justify-between mb-1">
          <span className={cn(
            'w-2.5 h-2.5 rounded-full flex-shrink-0',
            isOffline ? 'bg-slate-700'
              : isBusy ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-pulse'
                : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
          )} />
          {/* Spacer for Edit button area */}
          <div className="w-7 h-7" />
        </div>

        {/* Info */}
        <div className="mt-1">
          <p className={cn('text-2xl font-black leading-tight italic tracking-tighter', isOffline ? 'text-slate-600' : isBusy ? 'text-rose-100' : 'text-white')}>
            {table.table_name}
          </p>
          <p className={cn('text-[11px] font-bold mt-0.5', isOffline ? 'text-slate-700' : 'text-slate-500')}>
            {isHotel ? `${table.capacity} Beds` : `Up to ${table.capacity} people`}
          </p>
        </div>

        {/* Status Badge */}
        <div className="mt-auto pt-3 flex flex-col gap-1.5">
          <Badge className={cn(
            'text-[10px] font-black w-fit px-2 py-0.5 rounded-lg border uppercase tracking-wider',
            isOffline ? 'bg-slate-800 text-slate-600 border-slate-700'
              : isBusy ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          )}>
            {isOffline ? 'Offline' : isBusy ? 'Busy Today' : 'Free'}
          </Badge>

          {isBusy && busyInfo?.guestName && (
            <p className="text-[10px] text-rose-300/80 font-black truncate drop-shadow-sm flex items-center gap-1">
              <User className="w-3 h-3 flex-shrink-0" /> {busyInfo.guestName}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
