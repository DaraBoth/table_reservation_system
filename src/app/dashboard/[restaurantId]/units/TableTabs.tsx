'use client'

import * as React from 'react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { LayoutGrid, Settings2, Plus, Users, ShieldCheck, CircleCheck, CircleX, User } from 'lucide-react'
import { CreateTableDialog } from './CreateTableDialog'
import { EditTableSheet } from './EditTableSheet'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { Tables } from '@/lib/types/database'

interface TableTabsProps {
  tables: Tables<'physical_tables'>[]
  busyMap: Map<string, { guestName: string; status: string }>
  unitsLabel: string
  isAdmin: boolean
  businessType: string
  restaurantId: string
}

export function TableTabs({ tables, busyMap, unitsLabel, isAdmin, businessType, restaurantId }: TableTabsProps) {
  const [activeTab, setActiveTab] = useState<'status' | 'settings'>('status')

  const freeTables = tables.filter(t => !busyMap.has(t.id) && t.is_active).length
  const busyTables = tables.filter(t => busyMap.has(t.id)).length

  return (
    <div className="space-y-6">
      {/* Premium Tab Toggle */}
      <div className="flex p-1 bg-card border border-border rounded-2xl w-full">
        <button
          onClick={() => setActiveTab('status')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-sm transition-all",
            activeTab === 'status' 
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-foreground shadow-lg shadow-violet-500/20" 
              : "text-muted-foreground hover:text-foreground/70"
          )}
        >
          <LayoutGrid className="w-4 h-4" />
          Status
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-sm transition-all relative",
            activeTab === 'settings' 
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-foreground shadow-lg shadow-violet-500/20" 
              : "text-muted-foreground hover:text-foreground/70"
          )}
        >
          <Settings2 className="w-4 h-4" />
          Settings
          {!isAdmin && <span title="Staff Edit Access"><ShieldCheck className="w-3 h-3 absolute top-2 right-2 text-violet-400" /></span>}
        </button>
      </div>

      {activeTab === 'status' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Summary strip */}
          <div className="flex gap-3">
            <div className="flex-1 bg-card border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <CircleCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-foreground">{freeTables}</p>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Available Today</p>
              </div>
            </div>
            <div className="flex-1 bg-card border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center">
                <CircleX className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-foreground">{busyTables}</p>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Busy Today</p>
              </div>
            </div>
          </div>

          {/* Table Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {tables.map(t => {
              const busyInfo = busyMap.get(t.id)
              const isBusy = !!busyInfo
              const isOffline = !t.is_active
              const isTappable = !isBusy && !isOffline

              const card = (
                <div className={cn(
                  'relative p-4 rounded-2xl border-2 h-full flex flex-col gap-2 transition-all',
                  isOffline
                    ? 'bg-background border-border opacity-50'
                    : isBusy
                      ? 'bg-rose-500/5 border-rose-500/30'
                      : 'bg-card border-emerald-500/20 hover:border-emerald-400/60 hover:bg-muted/80 active:scale-[0.97]'
                )}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      'w-2.5 h-2.5 rounded-full flex-shrink-0',
                      isOffline ? 'bg-muted/60'
                        : isBusy ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse'
                        : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                    )} />
                    {isOffline && <span className="text-[10px] text-muted-foreground font-black uppercase">Offline</span>}
                  </div>

                  <p className={cn('text-2xl font-black leading-none mb-1', isOffline ? 'text-muted-foreground/60' : isBusy ? 'text-rose-100' : 'text-foreground')}>
                    {t.table_name}
                  </p>

                  <p className={cn('text-[11px] font-bold', isOffline ? 'text-muted-foreground/60' : 'text-muted-foreground')}>
                    {businessType === 'restaurant' ? `Up to ${t.capacity} people` : `${t.capacity} ${t.capacity === 1 ? 'Bed' : 'Beds'}`}
                  </p>

                  <div className="mt-auto pt-2">
                    <Badge className={cn(
                      'text-[10px] font-black w-fit px-2 py-0.5 rounded-lg border uppercase tracking-wider',
                      isOffline ? 'bg-muted text-muted-foreground border-border'
                        : isBusy ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    )}>
                      {isOffline ? 'Offline' : isBusy ? 'Busy' : 'Available'}
                    </Badge>
                  </div>

                  {isBusy && busyInfo?.guestName && (
                    <p className="text-[10px] text-rose-400/80 font-bold truncate mt-2 flex items-center gap-1">
                      <User className="w-3 h-3 flex-shrink-0" /> {busyInfo.guestName}
                    </p>
                  )}
                </div>
              )

              return isTappable ? (
                <Link key={t.id} href={`/dashboard/${restaurantId}/reservations/new?tableId=${t.id}`} className="h-full">
                  {card}
                </Link>
              ) : (
                <div key={t.id} className="h-full">{card}</div>
              )
            })}
          </div>
        </div>
      ) : (
        /* Management View */
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-black text-foreground italic tracking-tight">{unitsLabel} Management</h3>
            <CreateTableDialog businessType={businessType} restaurantId={restaurantId} />
          </div>

          <div className="space-y-3">
            {tables.map(t => (
              <div key={t.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black",
                    t.is_active ? "bg-violet-500/15 text-violet-400" : "bg-muted text-muted-foreground/60"
                  )}>
                    {t.table_name.charAt(0)}
                  </div>
                  <div>
                    <p className={cn("text-base font-black italic tracking-tight pr-2", t.is_active ? "text-foreground" : "text-muted-foreground")}>
                      {t.table_name}
                    </p>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                       {businessType === 'restaurant' ? `${t.capacity} Seats` : `${t.capacity} ${t.capacity === 1 ? 'Bed' : 'Beds'}`}
                       {!t.is_active && " · Offline"}
                    </p>
                  </div>
                </div>
                
                <EditTableSheet table={t} businessType={businessType} isAdmin={isAdmin} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
