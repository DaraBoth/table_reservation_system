'use client'

import * as React from 'react'
import { useActionState, useState, useTransition } from 'react'
import { createReservation, updateReservation } from '@/app/actions/reservations'
import { getCommonCustomers, getOccupiedTableIds } from '@/app/actions/booking-intelligence'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Tables } from '@/lib/types/database'
import Link from 'next/link'
import { DateTimePickerV2 } from '@/components/restaurant/date-time-picker-v2'
import { User, Users, Phone, LayoutGrid, Zap, XCircle, Star, ArrowRight, MousePointer2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props { 
  tables: Tables<'physical_tables'>[]
  restaurantId: string
  initialData?: Tables<'reservations'> & { start_time: Date }
}

export function ReservationForm({ tables, restaurantId, initialData }: Props) {
  const isEdit = !!initialData
  const [state, action, pending] = useActionState(isEdit ? updateReservation : createReservation, null)
  const [isOccLoading, startOccupancyTransition] = useTransition()
  
  // State for Booking
  const [startTime, setStartTime] = React.useState<Date>(() => {
    return initialData ? initialData.start_time : (() => {
      const d = new Date()
      d.setHours(19, 0, 0, 0)
      return d
    })()
  })
  
  const [selectedTableId, setSelectedTableId] = useState<string>(initialData?.table_id || '')
  const [occupiedIds, setOccupiedIds] = useState<string[]>([])
  const [commonCustomers, setCommonCustomers] = useState<any[]>([])
  
  // Form State
  const [guestName, setGuestName] = useState(initialData?.guest_name || '')
  const [guestPhone, setGuestPhone] = useState(initialData?.guest_phone || '')
  const [partySize, setPartySize] = useState(String(initialData?.party_size || '2'))
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [saveToCommon, setSaveToCommon] = useState(false)

  // Fetch Common Customers on mount
  React.useEffect(() => {
    getCommonCustomers(restaurantId).then(setCommonCustomers).catch(console.error)
  }, [restaurantId])

  // Fetch Occupancy
  React.useEffect(() => {
    startOccupancyTransition(async () => {
      const ids = await getOccupiedTableIds(restaurantId, startTime)
      const filteredIds = ids.filter(id => id !== initialData?.table_id)
      setOccupiedIds(filteredIds)
      if (filteredIds.includes(selectedTableId)) setSelectedTableId('')
    })
  }, [startTime, restaurantId, initialData?.table_id])

  const handleSelectCommon = (c: any) => {
    setGuestName(c.name)
    setGuestPhone(c.phone || '')
    setPartySize(String(c.default_party_size || '2'))
    setNotes(c.notes || '')
  }

  return (
    <div className="w-full h-full space-y-6 max-w-[1500px] mx-auto px-4 lg:px-8 py-4">
      {/* Dynamic Command Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link href="/dashboard/reservations" className="group flex items-center justify-center w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl hover:bg-red-500/10 hover:border-red-500/20 transition-all">
            <XCircle className="w-5 h-5 text-slate-500 group-hover:text-red-500 transition-colors" />
          </Link>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black text-white tracking-widest uppercase italic flex items-center gap-2">
              <Zap className="w-6 h-6 text-violet-500 drop-shadow-[0_0_10px_rgba(139,92,246,0.3)]" /> 
              {isEdit ? 'Adjust Booking' : 'Command Centre'}
            </h1>
            <span className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] font-mono">Enterprise v3.3</span>
          </div>
        </div>

        {isOccLoading && (
          <div className="flex items-center gap-2 bg-blue-500/5 px-4 py-2 rounded-full border border-blue-500/10 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            <span className="text-[9px] font-black uppercase tracking-tighter text-blue-500">Syncing Intelligence...</span>
          </div>
        )}
      </div>

      <form action={action} className="space-y-6">
        {/* Control Logic */}
        {isEdit && <input type="hidden" name="id" value={initialData.id} />}
        <input type="hidden" name="startTime" value={startTime.toISOString()} />
        <input type="hidden" name="tableId" value={selectedTableId} />
        <input type="hidden" name="saveToCommon" value={String(saveToCommon)} />
        <input type="hidden" name="guestName" value={guestName} />
        <input type="hidden" name="guestPhone" value={guestPhone} />
        <input type="hidden" name="partySize" value={partySize} />
        <input type="hidden" name="notes" value={notes} />

        {/* --- TOP STRIP: Vertical Space Saver (When?) --- */}
        <div className="w-full">
           <DateTimePickerV2 label="Select Time" value={startTime} onChange={setStartTime} />
        </div>

        {/* --- MAIN GRID: 8 column Table Hero + 4 column Sidebar --- */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-20 items-start">
          
          {/* LEFT AREA: Live Floor Layout (Where?) */}
          <Card className="xl:col-span-8 bg-slate-900/40 border-slate-800 shadow-2xl backdrop-blur-3xl overflow-hidden rounded-3xl">
            <CardHeader className="py-4 px-6 border-b border-white/5 bg-slate-900/30 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 flex items-center gap-2">
                <MousePointer2 className="w-3.5 h-3.5" /> Floor Selection
              </CardTitle>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                  <span className="text-[9px] font-black uppercase text-slate-400">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]" />
                  <span className="text-[9px] font-black uppercase text-slate-400">Reserved</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
               <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tables.map(table => {
                  const isOccupied = occupiedIds.includes(table.id)
                  const isSelected = selectedTableId === table.id
                  
                  return (
                    <button
                      key={table.id}
                      type="button"
                      disabled={isOccupied}
                      onClick={() => setSelectedTableId(table.id)}
                      className={cn(
                        "relative group flex flex-col items-center justify-center p-4 min-h-[100px] rounded-2xl border-2 transition-all duration-300",
                        isOccupied 
                          ? "bg-slate-950/60 border-slate-900 opacity-30 grayscale cursor-not-allowed" 
                          : isSelected
                            ? "bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] scale-[1.02] z-10"
                            : "bg-slate-950/40 border-slate-800/60 hover:border-slate-500 hover:bg-slate-900/50 hover:-translate-y-1"
                      )}
                    >
                      <span className={cn(
                        "text-lg font-black uppercase transition-all",
                        isSelected ? "text-white" : "text-slate-400 group-hover:text-white"
                      )}>
                        {table.table_name}
                      </span>
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest mt-1",
                        isSelected ? "text-emerald-400" : "text-slate-600 group-hover:text-slate-400"
                      )}>
                        {table.capacity} Seater
                      </span>

                      {isOccupied && (
                         <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[8px] font-black uppercase tracking-widest bg-rose-500/10 px-2 py-1 rounded text-rose-500 border border-rose-500/20 backdrop-blur-sm">Reserved</span>
                         </div>
                      )}
                    </button>
                  )
                })}
               </div>
            </CardContent>
          </Card>

          {/* RIGHT AREA: Guest Identity (Who?) */}
          <div className="xl:col-span-4 flex flex-col gap-6 sticky top-6">
            <Card className="bg-slate-900/40 border-slate-800 shadow-2xl backdrop-blur-3xl overflow-hidden rounded-3xl">
              <CardHeader className="py-4 px-6 border-b border-white/5 bg-slate-900/30">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" /> Identity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                {/* Compact Common Suggestions */}
                {!isEdit && commonCustomers.length > 0 && (
                  <div className="space-y-3 p-4 rounded-2xl bg-violet-600/5 border border-violet-500/10">
                     <div className="flex items-center gap-2 px-1">
                       <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                       <span className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">Suggested Guests</span>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {commonCustomers.slice(0, 5).map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectCommon(c)}
                            className="px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[10px] font-bold text-slate-400 hover:border-violet-500/50 hover:text-white transition-all whitespace-nowrap uppercase"
                          >
                            {c.name}
                          </button>
                        ))}
                     </div>
                  </div>
                )}

                <div className="space-y-5">
                  <div className="space-y-2.5">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name *</Label>
                    <Input 
                      value={guestName} 
                      onChange={e => setGuestName(e.target.value)}
                      required placeholder="Guest identity..."
                      className="bg-slate-950/60 border-slate-800 text-white h-14 text-base font-black rounded-xl focus:border-violet-500 transition-all px-4 shadow-inner" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2.5">
                      <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone</Label>
                      <Input 
                        value={guestPhone} 
                        onChange={e => setGuestPhone(e.target.value)}
                        placeholder="Primary..."
                        className="bg-slate-950/60 border-slate-800 text-white h-14 text-base font-black rounded-xl focus:border-violet-500 px-4 shadow-inner" />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Size *</Label>
                      <Input 
                        value={partySize} 
                        onChange={e => setPartySize(e.target.value)}
                        type="number" required min={1}
                        className="bg-slate-950/60 border-slate-800 text-white h-14 text-base font-black rounded-xl focus:border-violet-500 px-4 shadow-inner text-center" />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Operational Notes</Label>
                    <Textarea 
                      value={notes} 
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Special requests, allergies..."
                      className="min-h-[140px] bg-slate-950/60 border-slate-800 text-white rounded-xl p-4 text-sm font-bold resize-none focus:border-violet-500 transition-all shadow-inner" />
                  </div>

                  {!isEdit && (
                    <label className="flex items-center gap-3 p-4 rounded-xl bg-violet-600/5 border border-violet-500/10 cursor-pointer hover:bg-violet-600/10 transition-all">
                      <input 
                        type="checkbox" 
                        checked={saveToCommon} 
                        onChange={e => setSaveToCommon(e.target.checked)}
                        className="w-5 h-5 rounded-md accent-violet-500 bg-slate-950 border-slate-800" />
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-slate-200 uppercase tracking-tighter">Fast-Booking Intelligence</p>
                      </div>
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ACTION SECTION */}
            <div className="space-y-4">
              {!selectedTableId && !pending && (
                <div className="p-4 bg-amber-400/5 border border-amber-400/20 rounded-2xl flex items-center gap-3">
                   <MousePointer2 className="w-4 h-4 text-amber-500 animate-pulse" />
                   <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Target a table for selection</p>
                </div>
              )}
              
              <Button type="submit" disabled={pending || !selectedTableId || !guestName}
                className="w-full h-16 bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 text-white font-black text-lg rounded-2xl shadow-xl transition-all active:scale-[0.98]">
                {pending ? (
                   <span className="flex items-center gap-2 tracking-widest uppercase italic">Processing...</span>
                ) : (
                  <span className="flex items-center gap-2 tracking-widest uppercase italic font-black">
                    {isEdit ? 'Save Changes' : 'Confirm Order'} <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
              
              {state?.error && (
                <p className="text-center text-[9px] font-black text-red-500 uppercase tracking-widest">{state.error}</p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
