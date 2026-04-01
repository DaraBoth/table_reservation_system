'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { EditTableSheet } from './EditTableSheet'
import type { Tables } from '@/lib/types/database'
import type { BusinessTerms } from '@/lib/business-type'

interface TableCardProps {
  table: Tables<'physical_tables'>
  busyInfo?: { guestName: string; status: string }
  isBusy: boolean
  isOffline: boolean
  isTappable: boolean
  terms: BusinessTerms
  businessType: string
}

export function TableCard({ table, busyInfo, isBusy, isOffline, isTappable, terms, businessType }: TableCardProps) {
  const isHotel = businessType === 'hotel' || businessType === 'guesthouse'

  const cardContent = (
    <div className={cn(
      'relative p-4 rounded-[2rem] border-2 h-full flex flex-col gap-2 transition-all group text-left w-full',
      isOffline
        ? 'bg-slate-950 border-slate-800 opacity-50'
        : isBusy
          ? 'bg-gradient-to-br from-rose-500/10 to-transparent border-rose-500/30'
          : 'bg-slate-900 border-slate-800 hover:border-emerald-500/40 active:scale-[0.98]'
    )}>
      {/* Top: Status & Edit */}
      <div className="flex items-center justify-between mb-1">
        <span className={cn(
          'w-2.5 h-2.5 rounded-full flex-shrink-0',
          isOffline ? 'bg-slate-700'
            : isBusy ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-pulse'
              : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
        )} />
        
        {/* Inline Edit Button - Styled for standalone placement */}
        <div onClick={(e) => e.stopPropagation()} className="pointer-events-auto">
          <EditTableSheet table={table} businessType={businessType} />
        </div>
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
          <p className="text-[10px] text-rose-300/80 font-black truncate drop-shadow-sm">
            👤 {busyInfo.guestName}
          </p>
        )}
      </div>
    </div>
  )

  if (isTappable) {
    return (
      <Link href={`/dashboard/reservations/new?tableId=${table.id}`} className="block h-full no-underline">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}
