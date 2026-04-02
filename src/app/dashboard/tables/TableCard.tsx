'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { EditTableSheet } from './EditTableSheet'
import { User, Settings2 } from 'lucide-react'
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import type { Tables } from '@/lib/types/database'

interface TableCardProps {
  table: Tables<'physical_tables'>
  busyInfo?: { guestName: string; status: string; partySize: number }
  isBusy: boolean
  isOffline: boolean
  isTappable: boolean
  businessType: string
  isAdmin: boolean
  event?: 'free' | 'booked' | null
}

export function TableCard({ 
  table, 
  busyInfo, 
  isBusy, 
  isOffline, 
  isTappable, 
  businessType,
  isAdmin,
  event
}: TableCardProps) {
  const isHotel = businessType === 'hotel' || businessType === 'guesthouse'

  // ✨ Magic UI: Mouse position for follow-glow
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  return (
    <div className="relative h-full w-full group overflow-hidden rounded-3xl">
      {/* 🔮 Magic UI: Border Beam / Glow for Busy Units */}
      {isBusy && (
        <motion.div 
          className="absolute inset-[1px] rounded-3xl z-[5] pointer-events-none opacity-40 shadow-[0_0_20px_rgba(244,63,94,0.15)]"
          animate={{ scale: [1, 1.01, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* 📡 Detection Pulses for Real-time Events */}
      <AnimatePresence>
        {event === 'free' && (
          <motion.div 
            key="free-event"
            initial={{ scale: 0.8, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute inset-0 z-40 bg-emerald-400/40 rounded-3xl pointer-events-none"
          />
        )}
        {event === 'booked' && (
          <motion.div 
            key="booked-event"
            initial={{ scale: 0.8, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute inset-0 z-40 bg-violet-400/40 rounded-3xl pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Background card style with Interactive Glow */}
      <div 
        onMouseMove={handleMouseMove}
        className={cn(
          'absolute inset-0 border transition-all duration-500 rounded-3xl z-0 overflow-hidden',
          isOffline
            ? 'bg-slate-950 border-slate-800/60 opacity-50'
            : isBusy
              ? 'bg-gradient-to-br from-rose-500/10 via-slate-900/40 to-slate-900/60 border-rose-500/30'
              : 'bg-slate-900 border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900/80 shadow-lg'
        )}
      >
        {/* 🖱️ Interactive Follow-Glow */}
        <motion.div
           className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
           style={{
             background: useTransform(
               [mouseX, mouseY],
               ([x, y]) => `radial-gradient(400px circle at ${x}px ${y}px, ${isBusy ? 'rgba(244,63,94,0.1)' : 'rgba(124,58,237,0.1)'}, transparent 80%)`
             ),
           }}
        />
      </div>

      {/* Main Tappable Area (The Link) — Lower Index */}
      {isTappable ? (
        <Link 
            href={`/dashboard/reservations/new?tableId=${table.id}`} 
            className="absolute inset-0 z-10"
        />
      ) : (
        <div className="absolute inset-0 z-10" />
      )}

      {/* Action Indicator - Changed to Settings2 to avoid confusion with booking-edit */}
      <div className="absolute top-4 right-4 z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <EditTableSheet 
          table={table} 
          businessType={businessType} 
          isAdmin={isAdmin}
          trigger={
            <button className="w-8 h-8 flex items-center justify-center bg-slate-950/80 border border-slate-700/50 rounded-xl text-slate-400 hover:border-violet-500/50 hover:text-violet-400 backdrop-blur-sm transition-all shadow-xl active:scale-90">
              <Settings2 className="w-4 h-4" />
            </button>
          }
        />
      </div>

      {/* Content Overlay — Mid Index, ignored by mouse/touch except descendants */}
      <div className="relative z-20 p-5 h-full flex flex-col gap-2.5 pointer-events-none">
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
          <p className={cn('text-[11px] font-bold mt-0.5', isOffline ? 'text-slate-700' : 'text-slate-500 uppercase tracking-tighter')}>
            {isHotel ? `${table.capacity} Beds` : `Seats ${table.capacity}`}
          </p>
        </div>

        {/* Status Badge */}
        <div className="mt-auto pt-3 flex flex-col gap-1.5">
          <Badge className={cn(
            'text-[10px] font-black w-fit px-2.5 py-0.5 rounded-lg border uppercase tracking-widest transition-all duration-500',
            isOffline ? 'bg-slate-800 text-slate-600 border-slate-700'
              : isBusy ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          )}>
            {isOffline ? 'Offline' : isBusy ? 'Booked' : 'Available'}
          </Badge>

          {isBusy && busyInfo?.guestName && (
            <p className="text-[10px] text-rose-300/80 font-black truncate drop-shadow-sm flex items-center gap-1 uppercase tracking-tighter">
              <User className="w-3 h-3 flex-shrink-0" /> {busyInfo.guestName} {busyInfo.partySize > 0 && `(${busyInfo.partySize}p)`}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
