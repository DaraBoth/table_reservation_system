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
import { CheckCircle2, ChevronLeft, ChevronRight, Star, ArrowRight } from 'lucide-react'
import { getTerms } from '@/lib/business-type'
import type { BusinessType } from '@/lib/business-type'

interface Props {
  tables: Tables<'physical_tables'>[]
  restaurantId: string
  initialData?: Omit<Tables<'reservations'>, 'start_time' | 'end_time'> & { start_time: Date; end_time?: Date }
  preSelectedTableId?: string
  businessType?: BusinessType
}

// Slide direction determines which way content enters from
type SlideDir = 'right' | 'left'

const slideInRight = 'animate-[slideInRight_0.28s_ease-out_forwards]'
const slideInLeft  = 'animate-[slideInLeft_0.28s_ease-out_forwards]'

export function ReservationForm({ tables, restaurantId, initialData, preSelectedTableId, businessType = 'restaurant' }: Props) {
  const isEdit = !!initialData
  const [state, action, pending] = useActionState(isEdit ? updateReservation : createReservation, null)
  const [isOccLoading, startOccupancyTransition] = useTransition()
  const terms = getTerms(businessType)
  const isHotel = businessType === 'hotel' || businessType === 'guesthouse'

  // If a table was pre-selected (tapped from Tables page), jump straight to step 2
  const [step, setStep] = useState(preSelectedTableId ? 2 : 1)
  const [slideDir, setSlideDir] = useState<SlideDir>('right')
  const [renderKey, setRenderKey] = useState(0)

  const [startTime, setStartTime] = React.useState<Date>(() => {
    if (initialData) return initialData.start_time
    // Default: today, rounded up to next 30-minute slot
    const d = new Date()
    const mins = d.getMinutes()
    if (mins > 0 && mins <= 30) d.setMinutes(30, 0, 0)
    else { d.setHours(d.getHours() + 1, 0, 0, 0) }
    return d
  })

  // Hotel checkout time — defaults to next day same time
  const [endTime, setEndTime] = React.useState<Date>(() => {
    if (initialData?.end_time) return initialData.end_time
    const d = new Date()
    const mins = d.getMinutes()
    if (mins > 0 && mins <= 30) d.setMinutes(30, 0, 0)
    else { d.setHours(d.getHours() + 1, 0, 0, 0) }
    d.setDate(d.getDate() + 1) // next day
    return d
  })

  const [selectedTableId, setSelectedTableId] = useState<string>(initialData?.table_id || preSelectedTableId || '')
  const [occupiedIds, setOccupiedIds] = useState<string[]>([])
  const [commonCustomers, setCommonCustomers] = useState<any[]>([])

  const [guestName, setGuestName] = useState(initialData?.guest_name || '')
  const [guestPhone, setGuestPhone] = useState(initialData?.guest_phone || '')
  const [partySize, setPartySize] = useState(String(initialData?.party_size || '2'))
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [saveToCommon, setSaveToCommon] = useState(false)

  React.useEffect(() => {
    getCommonCustomers(restaurantId).then(setCommonCustomers).catch(console.error)
  }, [restaurantId])

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

  const selectedTable = tables.find(t => t.id === selectedTableId)
  const slideClass = slideDir === 'right' ? slideInRight : slideInLeft

  return (
    <div className="max-w-2xl mx-auto overflow-hidden">
      {/* Global keyframe styles injected once */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(40px); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-40px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      <form action={action}>
        {/* Hidden fields */}
        {isEdit && <input type="hidden" name="id" value={initialData.id} />}
        <input type="hidden" name="startTime" value={startTime.toISOString()} />
        {/* Hotel: use endTime; Restaurant: action computes +2h */}
        {terms.hasCheckout && <input type="hidden" name="endTime" value={endTime.toISOString()} />}
        <input type="hidden" name="tableId" value={selectedTableId} />
        <input type="hidden" name="saveToCommon" value="false" />
        <input type="hidden" name="guestName" value={guestName} />
        <input type="hidden" name="guestPhone" value={guestPhone} />
        <input type="hidden" name="partySize" value={partySize} />
        <input type="hidden" name="notes" value={notes} />

        {/* ── STEP 1: Date & Table ── */}
        {step === 1 && (
          <div key={`step1-${renderKey}`} className={cn('space-y-6', slideClass)}>
            
            {/* Section: Date & Time */}
            <section className="bg-slate-900 rounded-3xl p-5 border border-slate-800 space-y-4">
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                📅 {terms.hasCheckout ? 'Check-in & Check-out' : 'When is the booking?'}
              </h2>
              <div className={terms.hasCheckout ? 'space-y-4' : ''}>
                <div>
                  {terms.hasCheckout && <p className="text-xs font-bold text-emerald-400 mb-2">✅ {terms.startLabel}</p>}
                  <DateTimePickerV2 value={startTime} onChange={setStartTime} />
                </div>
                {terms.hasCheckout && (
                  <div>
                    <p className="text-xs font-bold text-rose-400 mb-2">🚪 {terms.endLabel}</p>
                    <DateTimePickerV2 value={endTime} onChange={setEndTime} />
                  </div>
                )}
              </div>
            </section>

            {/* Section: Pick Table / Room */}
            <section className="bg-slate-900 rounded-3xl p-5 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  {terms.emoji} Pick a {terms.unit}
                </h2>
                {isOccLoading && (
                  <span className="text-xs text-blue-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />
                    Checking...
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 mb-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Free
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Already booked
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
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
                        'relative flex flex-col items-center justify-center gap-1 p-3 rounded-2xl border-2 transition-all duration-200 min-h-[84px] active:scale-95',
                        isOccupied
                          ? 'bg-slate-950 border-slate-800 opacity-35 cursor-not-allowed'
                          : isSelected
                            ? 'bg-violet-500/15 border-violet-500 shadow-[0_0_16px_rgba(139,92,246,0.25)]'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-600'
                      )}
                    >
                      {isSelected && (
                        <CheckCircle2 className="absolute top-1.5 right-1.5 w-3.5 h-3.5 text-violet-400" />
                      )}
                      <span className={cn('text-sm font-black', isSelected ? 'text-white' : 'text-slate-300')}>
                        {table.table_name}
                      </span>
                      <span className={cn('text-[10px] font-semibold', isSelected ? 'text-violet-300' : 'text-slate-600')}>
                        {table.capacity} seats
                      </span>
                      {isOccupied && (
                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-wide">Booked</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Next Button */}
            <button
              type="button"
              disabled={!selectedTableId}
              onClick={() => goTo(2)}
              className={cn(
                'w-full h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98]',
                selectedTableId
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              )}
            >
              {selectedTableId ? (
                <>Next: Customer Info <ChevronRight className="w-5 h-5" /></>
              ) : 'Select a table to continue'}
            </button>
          </div>
        )}

        {/* ── STEP 2: Customer Info ── */}
        {step === 2 && (
          <div key={`step2-${renderKey}`} className={cn('space-y-5', slideClass)}>

            {/* ── When coming FROM the Tables page: show table + date/time inline ── */}
            {preSelectedTableId && !isEdit && renderKey === 0 && selectedTable && (
              <section className="bg-slate-900 rounded-3xl p-5 border border-slate-800 space-y-4">
                {/* Table banner */}
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🪑</span>
                  <div className="flex-1">
                    <p className="text-xs text-emerald-400 font-black uppercase tracking-widest">{terms.unit} selected</p>
                    <p className="text-sm font-bold text-white">{selectedTable.table_name} · {isHotel ? `${selectedTable.capacity} ${selectedTable.capacity === 1 ? 'Bed' : 'Beds'}` : `Up to ${selectedTable.capacity} people`}</p>
                  </div>
                  <button type="button" onClick={() => goTo(1)} className="text-xs text-slate-400 font-semibold hover:text-white transition-colors">
                    Change table
                  </button>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-800" />

                {/* Date & Time — pick for this booking */}
                <div>
                  <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                    📅 When is the booking?
                  </h2>
                  <DateTimePickerV2 value={startTime} onChange={setStartTime} />
                </div>
              </section>
            )}

            {/* Summary chip — shown when navigating back from step 1 (not initial pre-select) */}
            {selectedTable && (!preSelectedTableId || renderKey > 0) && (
              <button
                type="button"
                onClick={() => goTo(1)}
                className="flex items-center gap-3 w-full p-3.5 bg-violet-500/10 border border-violet-500/25 rounded-2xl text-left active:scale-[0.98] transition-all"
              >
                <ChevronLeft className="w-4 h-4 text-violet-400" />
                <div className="flex-1">
                  <span className="text-xs text-slate-400 block">
                    {isEdit ? 'Tap to change date, time or table' : 'Table selected'}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {selectedTable.table_name} · {isHotel ? `${selectedTable.capacity} Beds` : `${selectedTable.capacity} seats`}
                    <span className="text-violet-400 ml-2">·</span>
                    <span className="text-violet-300 text-xs ml-1">
                      {startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {' '}{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </span>
                </div>
                <span className="text-xs text-violet-400 font-semibold whitespace-nowrap">Change</span>
              </button>
            )}



            {/* Saved Customers Quick Fill */}
            {!isEdit && commonCustomers.length > 0 && (
              <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-bold text-white">Saved Customers</span>
                  <span className="text-xs text-slate-500">tap to fill</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {commonCustomers.slice(0, 5).map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setGuestName(c.name)
                        setGuestPhone(c.phone || '')
                        if (!isHotel) setPartySize(String(c.default_party_size || '2'))
                        setNotes(c.notes || '')
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-semibold text-slate-300 hover:border-violet-500/50 hover:text-white transition-all active:scale-95"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form fields */}
            <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 space-y-4">
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">👤 Customer Info</h2>

              <div>
                <Label className="text-sm font-bold text-slate-300 mb-2 block">Customer Name *</Label>
                <Input
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  required
                  placeholder="Full name"
                  className="bg-slate-950 border-slate-700 text-white h-14 text-base font-semibold rounded-2xl focus:border-violet-500 px-4"
                />
              </div>

              <div className={cn("grid gap-3", isHotel ? "grid-cols-1" : "grid-cols-2")}>
                <div>
                  <Label className="text-sm font-bold text-slate-300 mb-2 block">Phone</Label>
                  <Input
                    value={guestPhone}
                    onChange={e => setGuestPhone(e.target.value)}
                    placeholder="012 345 678"
                    className="bg-slate-950 border-slate-700 text-white h-14 text-base font-semibold rounded-2xl focus:border-violet-500 px-4"
                  />
                </div>
                {!isHotel && (
                  <div>
                    <Label className="text-sm font-bold text-slate-300 mb-2 block">How Many People *</Label>
                    <Input
                      value={partySize}
                      onChange={e => setPartySize(e.target.value)}
                      type="number"
                      required
                      min={1}
                      className="bg-slate-950 border-slate-700 text-white h-14 text-2xl font-black rounded-2xl focus:border-violet-500 px-4 text-center"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-bold text-slate-300 mb-2 block">Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Allergies, special requests..."
                  className="bg-slate-950 border-slate-700 text-white min-h-[100px] text-sm rounded-2xl focus:border-violet-500 p-4 resize-none"
                />
              </div>


            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              {!isEdit ? (
                <button
                  type="button"
                  disabled={!guestName.trim()}
                  onClick={() => goTo(3)}
                  className={cn(
                    'w-full h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98]',
                    guestName.trim()
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  )}
                >
                  {guestName.trim() ? (
                    <>Review & Confirm <ChevronRight className="w-5 h-5" /></>
                  ) : 'Enter customer name to continue'}
                </button>
              ) : (
                <>
                  <Button
                    type="submit"
                    disabled={pending || !guestName}
                    className="w-full h-14 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-base rounded-2xl"
                  >
                    {pending ? 'Saving...' : 'Save Changes'}
                  </Button>
                  {state?.error && <p className="text-center text-sm text-red-400">{state.error}</p>}
                </>
              )}

              {!isEdit && (
                <button
                  type="button"
                  onClick={() => goTo(1)}
                  className="w-full h-12 bg-slate-900 border border-slate-700 text-slate-300 font-semibold text-sm rounded-2xl flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 3: Confirm ── */}
        {step === 3 && !isEdit && (
          <div key={`step3-${renderKey}`} className={cn('space-y-5', slideClass)}>

            {/* Confirmation cards */}
            <div className="space-y-3">
              <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 space-y-3">
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">
                  ✅ Confirm Booking
                </h2>

                {/* Date */}
                <div className="flex items-center gap-4 p-4 bg-slate-950 rounded-2xl">
                  <span className="text-2xl">📅</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date & Time</p>
                    <p className="text-white font-bold">
                      {startTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-violet-300 text-sm font-semibold">
                      {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Table */}
                {selectedTable && (
                  <div className="flex items-center gap-4 p-4 bg-slate-950 rounded-2xl">
                    <span className="text-2xl">🪑</span>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Table</p>
                      <p className="text-white font-bold">{selectedTable.table_name}</p>
                      <p className="text-slate-400 text-sm">Up to {selectedTable.capacity} people</p>
                    </div>
                  </div>
                )}

                {/* Customer */}
                <div className="flex items-center gap-4 p-4 bg-slate-950 rounded-2xl">
                  <span className="text-2xl">👤</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</p>
                    <p className="text-white font-bold">{guestName}</p>
                    <p className="text-slate-400 text-sm">
                      {partySize} {Number(partySize) === 1 ? 'person' : 'people'}
                      {guestPhone ? ` · ${guestPhone}` : ''}
                    </p>
                    {notes && <p className="text-slate-500 text-xs mt-1 italic truncate">{notes}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="space-y-3">
              <Button
                type="submit"
                disabled={pending || !selectedTableId || !guestName}
                className="w-full h-16 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-violet-500/30 active:scale-[0.98] transition-all"
              >
                {pending ? 'Creating Booking...' : (
                  <span className="flex items-center gap-2">
                    Confirm Booking <ArrowRight className="w-6 h-6" />
                  </span>
                )}
              </Button>

              {state?.error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center">
                  <p className="text-sm text-red-400">{state.error}</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => goTo(2)}
                className="w-full h-12 bg-slate-900 border border-slate-700 text-slate-300 font-semibold text-sm rounded-2xl flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
