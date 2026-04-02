'use client'

import * as React from 'react'
import { useActionState, useState, useTransition } from 'react'
import { createReservation, updateReservation } from '@/app/actions/reservations'
import { getCommonCustomers, getOccupiedTableIds } from '@/app/actions/booking-intelligence'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Tables } from '@/lib/types/database'
import { DateTimePickerV2 } from '@/components/restaurant/date-time-picker-v2'
import { cn } from '@/lib/utils'
import { 
  CheckCircle2, ChevronLeft, ChevronRight, ArrowRight, Calendar, User, 
  Clock, Sparkles, LogOut, Building2, Home 
} from 'lucide-react'
import { getTerms } from '@/lib/business-type'
import type { BusinessType } from '@/lib/business-type'

interface Props {
  tables: Tables<'physical_tables'>[]
  restaurantId: string
  initialData?: Omit<Tables<'reservations'>, 'start_time' | 'end_time'> & { start_time: Date; end_time?: Date }
  preSelectedTableId?: string
  businessType: BusinessType
}

type SlideDir = 'right' | 'left'
const slideInRight = 'animate-[slideInRight_0.28s_ease-out_forwards]'
const slideInLeft  = 'animate-[slideInLeft_0.28s_ease-out_forwards]'

export function HotelReservationForm({ tables, restaurantId, initialData, preSelectedTableId, businessType }: Props) {
  const isEdit = !!initialData
  const [state, action, pending] = useActionState(isEdit ? updateReservation : createReservation, null)
  const [isOccLoading, startOccupancyTransition] = useTransition()
  const terms = getTerms(businessType)
  const TermIcon = terms.Icon
  
  const [step, setStep] = useState(preSelectedTableId ? 2 : 1)
  const [slideDir, setSlideDir] = useState<SlideDir>('right')
  const [renderKey, setRenderKey] = useState(0)

  // Check-in
  const [startTime, setStartTime] = React.useState<Date>(() => {
    if (initialData) return initialData.start_time
    const d = new Date()
    const mins = d.getMinutes()
    if (mins > 0 && mins <= 30) d.setMinutes(30, 0, 0)
    else { d.setHours(d.getHours() + 1, 0, 0, 0) }
    return d
  })

  // Check-out
  const [endTime, setEndTime] = React.useState<Date>(() => {
    if (initialData?.end_time) return initialData.end_time
    const d = new Date()
    const mins = d.getMinutes()
    if (mins > 0 && mins <= 30) d.setMinutes(30, 0, 0)
    else { d.setHours(d.getHours() + 1, 0, 0, 0) }
    d.setDate(d.getDate() + 1)
    return d
  })

  const [selectedTableId, setSelectedTableId] = useState<string>(initialData?.table_id || preSelectedTableId || '')
  const [occupiedIds, setOccupiedIds] = useState<string[]>([])
  
  const [guestName, setGuestName] = useState(initialData?.guest_name || '')
  const [guestPhone, setGuestPhone] = useState(initialData?.guest_phone || '')
  const [partySize, setPartySize] = useState(String(initialData?.party_size || '2'))
  const [notes, setNotes] = useState(initialData?.notes || '')

  React.useEffect(() => {
    startOccupancyTransition(async () => {
      const ids = await getOccupiedTableIds(restaurantId, startTime)
      const filtered = ids.filter(id => id !== initialData?.table_id)
      setOccupiedIds(filtered)
      if (filtered.includes(selectedTableId)) setSelectedTableId('')
    })
  }, [startTime, restaurantId, initialData?.table_id])

  const goTo = (nextStep: number) => {
    setSlideDir(nextStep > step ? 'right' : 'left')
    setRenderKey(k => k + 1)
    setStep(nextStep)
  }

  const handleTableSelect = (table: Tables<'physical_tables'>) => {
    setSelectedTableId(table.id)
    if (!isEdit) {
      setPartySize(String(table.capacity * 2)) // 1 bed = 2 guests default
    }
  }

  const selectedTable = tables.find(t => t.id === selectedTableId)
  const slideClass = slideDir === 'right' ? slideInRight : slideInLeft

  return (
    <div className="relative">
      <form action={action} className="space-y-6">
        <input type="hidden" name="restaurantId" value={restaurantId} />
        <input type="hidden" name="tableId" value={selectedTableId} />
        <input type="hidden" name="status" value="confirmed" />
        <input type="hidden" name="partySize" value={partySize} />
        <input type="hidden" name="notes" value={notes} />
        <input type="hidden" name="guestName" value={guestName} />
        <input type="hidden" name="guestPhone" value={guestPhone} />
        <input type="hidden" name="startTime" value={startTime.toISOString()} />
        <input type="hidden" name="endTime" value={endTime.toISOString()} />
        {isEdit && initialData?.id && <input type="hidden" name="reservationId" value={initialData.id} />}

        {/* STEP 1: Duration & select room */}
        {step === 1 && (
          <div key={`step1-${renderKey}`} className={cn('space-y-6', slideClass)}>
            
            {/* 🏨 Duration Section */}
            <section className="bg-slate-900 rounded-3xl p-4 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-violet-400" /> Check-in & Check-out
                </h2>
              </div>
              
              <div className="space-y-4">
                 <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                       <Clock className="w-3 h-3 text-emerald-500" /> Check-in
                    </p>
                    <DateTimePickerV2 value={startTime} onChange={setStartTime} />
                 </div>

                 <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                       <LogOut className="w-3 h-3 text-rose-500" /> Check-out
                    </p>
                    <DateTimePickerV2 value={endTime} onChange={setEndTime} />
                 </div>
              </div>
            </section>

            {/* 🛏️ Section: Room grid */}
            <section className="bg-slate-900 rounded-3xl p-4 border border-slate-800">
               <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   <TermIcon className="w-4 h-4 text-indigo-400" /> Room Availability
                 </h2>
                 <div className="flex items-center gap-3">
                   <div className="flex items-center gap-1.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                     <span className="text-[10px] font-bold text-slate-500 uppercase">Free</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                     <span className="text-[10px] font-bold text-slate-500 uppercase">Occupied</span>
                   </div>
                 </div>
               </div>
               
               <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                 {tables.map((table) => {
                   const isOccupied = occupiedIds.includes(table.id)
                   const isSelected = selectedTableId === table.id
                   
                   return (
                     <button
                       key={table.id}
                       type="button"
                       disabled={isOccupied}
                       onClick={() => handleTableSelect(table)}
                       className={cn(
                         "h-12 rounded-xl border flex flex-col items-center justify-center transition-all active:scale-95",
                         isOccupied 
                           ? "bg-slate-950/50 border-slate-900 text-slate-700 cursor-not-allowed opacity-40" 
                           : isSelected
                             ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20 z-10"
                             : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200 shadow-xl"
                       )}
                     >
                       <span className="text-[10px] font-black uppercase tracking-widest">{table.table_name}</span>
                     </button>
                   )
                 })}
               </div>
            </section>

            <Button
              type="button"
              disabled={!selectedTableId || endTime <= startTime}
              onClick={() => goTo(2)}
              className="w-full h-16 bg-gradient-to-r from-emerald-600 to-indigo-600 text-white font-black text-lg rounded-[2rem] shadow-xl active:scale-[0.98] transition-all"
            >
              Next: Guest Info <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
          </div>
        )}

        {/* STEP 2: Guest Details */}
        {step === 2 && (
          <div key={`step2-${renderKey}`} className={cn('space-y-6', slideClass)}>
             <section className="bg-slate-900 rounded-3xl p-4 border border-slate-800 space-y-4">
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" /> Stay Details
                </h2>

                <div className="space-y-4">
                  <div>
                    <Label className="text-[10px] font-black text-slate-500 uppercase mb-2 px-1 block tracking-widest">Primary Guest Name</Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                      <Input
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="John Doe..."
                        className="h-14 bg-slate-950 border-slate-800 text-white pl-10 font-bold rounded-2xl focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[10px] font-black text-slate-500 uppercase mb-2 px-1 block tracking-widest">Phone Number</Label>
                      <Input
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="+123..."
                        className="h-14 bg-slate-950 border-slate-800 text-white font-bold rounded-2xl"
                      />
                    </div>
                    <div>
                        <Label className="text-[10px] font-black text-slate-500 uppercase mb-2 px-1 block tracking-widest">Total Guests</Label>
                        <Input
                          type="number"
                          min={1}
                          value={partySize}
                          onChange={(e) => setPartySize(e.target.value)}
                          className="h-14 bg-slate-950 border-slate-800 text-white font-bold rounded-2xl"
                        />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[10px] font-black text-slate-500 uppercase mb-2 px-1 block tracking-widest">Reservation Notes</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Extra pillows, late check-in..."
                      className="bg-slate-950 border-slate-800 text-white font-bold rounded-2xl resize-none h-32"
                    />
                  </div>
                </div>
             </section>

             <div className="flex gap-3">
               <button type="button" onClick={() => goTo(1)} className="w-16 h-16 flex items-center justify-center bg-slate-800 rounded-[2rem] text-slate-200">
                  <ChevronLeft className="w-6 h-6" />
               </button>
               <Button
                 type="button"
                 onClick={() => goTo(3)}
                 disabled={!guestName}
                 className="flex-1 h-16 bg-gradient-to-r from-emerald-600 to-indigo-600 text-white font-black text-lg rounded-[2rem] shadow-xl active:scale-[0.98] transition-all"
               >
                 Review Stay <ArrowRight className="w-6 h-6 ml-2" />
               </Button>
             </div>
          </div>
        )}

        {/* STEP 3: Confirm Stay */}
        {step === 3 && (
          <div key={`step3-${renderKey}`} className={cn('space-y-6 flex flex-col min-h-full pb-8', slideClass)}>
            
            <div className="px-1 pt-2">
               <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                 Ready for check-in? <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
               </h2>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Review your stay details before confirming</p>
            </div>

            <div className="space-y-4">
              {/* Stay Timeline Card */}
              <div className="bg-slate-900/50 rounded-3xl p-4 border border-slate-800/60 relative overflow-hidden backdrop-blur-xl">
                 <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="w-9 h-9 rounded-xl bg-violet-600/20 flex items-center justify-center">
                       <Clock className="w-4 h-4 text-violet-400" />
                    </div>
                    <p className="text-xs font-black text-white uppercase tracking-widest">Stay Duration</p>
                 </div>

                 <div className="relative pl-4 space-y-8">
                    <div className="absolute left-1 top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-500/50 via-violet-500/30 to-rose-500/50" />

                    {/* Check-in */}
                    <div className="relative group">
                       <div className="absolute -left-[18px] top-1.5 w-3 h-3 rounded-full border-2 border-slate-900 z-10 bg-emerald-500 shadow-lg shadow-emerald-500/40" />
                       <div className="flex flex-col">
                          <p className="text-xs text-slate-500 font-black uppercase tracking-widest mb-1.5 opacity-60">Check-in</p>
                          <div className="flex items-center gap-2 flex-wrap text-white">
                             <span className="font-black text-base">{startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                             <span className="text-slate-500 text-sm opacity-50">at</span>
                             <span className="font-black text-base text-violet-400">{startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                       </div>
                    </div>

                    {/* Check-out */}
                    <div className="relative group">
                       <div className="absolute -left-[18px] top-1.5 w-3 h-3 rounded-full border-2 border-slate-900 z-10 bg-rose-500 shadow-lg shadow-rose-500/40" />
                       <div className="flex flex-col">
                          <p className="text-xs text-slate-500 font-black uppercase tracking-widest mb-1.5 opacity-60">Check-out</p>
                          <div className="flex items-center gap-2 flex-wrap text-white">
                             <span className="font-black text-base">{endTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                             <span className="text-slate-500 text-sm opacity-50">at</span>
                             <span className="font-black text-base text-rose-400">{endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                 {selectedTable && (
                   <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800/60 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                         <TermIcon className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Booked {terms.unit}</p>
                         <div className="flex items-baseline gap-2">
                           <p className="text-white font-black text-lg truncate">{selectedTable.table_name}</p>
                           <p className="text-slate-500 text-xs font-bold whitespace-nowrap">up to {selectedTable.capacity} Beds</p>
                         </div>
                      </div>
                   </div>
                 )}

                 <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800/60 flex items-center gap-4 transition-all hover:bg-slate-900">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                       <User className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Guest details</p>
                       <p className="text-white font-black text-lg truncate">{guestName}</p>
                       <div className="flex items-center gap-2 mt-0.5 text-slate-400 text-sm font-bold">
                          <span>{partySize} guests</span>
                          {guestPhone && <span>·</span>}
                          {guestPhone && <span>{guestPhone}</span>}
                       </div>
                    </div>
                 </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                disabled={pending || !selectedTableId || !guestName}
                className="w-full h-16 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-lg rounded-[2rem] shadow-xl shadow-violet-500/30 active:scale-[0.98] transition-all"
              >
                {pending ? 'Processing...' : (
                  <span className="flex items-center gap-2">
                    Confirm Stay <ArrowRight className="w-6 h-6" />
                  </span>
                )}
              </Button>
              <button
                type="button"
                onClick={() => goTo(2)}
                className="w-full h-12 bg-slate-900 border border-slate-700 text-slate-300 font-semibold text-sm rounded-2xl flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Go Back
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
