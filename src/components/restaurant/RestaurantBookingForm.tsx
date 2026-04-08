'use client'

import * as React from 'react'
import { useActionState, useState, useTransition, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

import { format } from 'date-fns'
import { createReservation, updateReservation } from '@/app/actions/reservations'
import { getCommonCustomers, getOccupiedTableIds } from '@/app/actions/booking-intelligence'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Tables } from '@/lib/types/database'
import { DateTimePickerV2 } from '@/components/restaurant/date-time-picker-v2'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  CheckCircle2, ChevronLeft, ChevronRight, Star, ArrowRight, CalendarDays, User,
  Clock, Activity, PlusCircle, Sparkles, CircleX, UtensilsCrossed,
  Check, Copy, Image as ImageIcon,
  Phone
} from 'lucide-react'
import { getTerms } from '@/lib/business-type'
import type { BusinessType } from '@/lib/business-type'
import { CustomerSelector } from '@/components/dashboard/CustomerSelector'
import { groupAndSortTables } from '@/lib/sorting'
import { getOrCreateDeviceToken } from '@/lib/push-client'


interface Props {
  tables: Tables<'physical_tables'>[]
  zones: { id: string, name: string, sort_order: number }[]
  restaurantId: string
  initialData?: Omit<Tables<'reservations'>, 'start_time' | 'end_time'> & { start_time: Date; end_time?: Date }
  preSelectedTableId?: string
  businessType: BusinessType
}

type SlideDir = 'right' | 'left'
const slideInRight = 'animate-[slideInRight_0.28s_ease-out_forwards]'
const slideInLeft = 'animate-[slideInLeft_0.28s_ease-out_forwards]'

export function RestaurantBookingForm({ tables, zones, restaurantId, initialData, preSelectedTableId, businessType }: Props) {
  const isEdit = !!initialData
  const [state, action, pending] = useActionState(isEdit ? updateReservation : createReservation, null)
  const [isOccLoading, startOccupancyTransition] = useTransition()
  const terms = getTerms(businessType)

  const [step, setStep] = useState(1)
  const [slideDir, setSlideDir] = useState<SlideDir>('right')
  const [renderKey, setRenderKey] = useState(0)

  const searchParams = useSearchParams()
  const urlDate = searchParams.get('date')

  // Primary Arrival
  const [startTime, setStartTime] = React.useState<Date>(() => {
    if (initialData) return initialData.start_time
    
    const d = urlDate ? new Date(`${urlDate}T19:00:00`) : new Date()
    if (!urlDate) {
      d.setHours(19, 0, 0, 0)
    }
    return d
  })



  const [selectedTableId, setSelectedTableId] = useState<string>(initialData?.table_id || preSelectedTableId || '')
  const [occupiedDetails, setOccupiedDetails] = useState<{ table_id: string; guest_name: string; start_time: string }[]>([])
  const [commonCustomers, setCommonCustomers] = useState<any[]>([])

  const [bookingStatus, setBookingStatus] = useState<string>(initialData?.status || 'confirmed')
  const [guestName, setGuestName] = useState(initialData?.guest_name || '')
  const [guestPhone, setGuestPhone] = useState(initialData?.guest_phone || '')
  const [partySize, setPartySize] = useState(() => {
    if (initialData?.party_size) return String(initialData.party_size)
    if (preSelectedTableId) {
      const table = tables.find(t => t.id === preSelectedTableId)
      if (table) return String(table.capacity)
    }
    return '2'
  })

  const [notes, setNotes] = useState(initialData?.notes || '')
  const [extraSlots, setExtraSlots] = useState<{ id: string; date: Date; partySize: number; status: string }[]>([])

  const addExtraSlot = () => {
    const baseDate = extraSlots.length > 0 ? extraSlots[extraSlots.length - 1].date : startTime
    const nextDate = new Date(baseDate)
    nextDate.setDate(nextDate.getDate() + 1)

    setExtraSlots([...extraSlots, {
      id: Math.random().toString(36).substring(7),
      date: nextDate,
      partySize: parseInt(partySize) || 2,
      status: 'confirmed'
    }])
  }

  const removeExtraSlot = (id: string) => {
    setExtraSlots(extraSlots.filter(s => s.id !== id))
  }

  const updateExtraSlot = (id: string, date: Date, slotPartySize?: number, slotStatus?: string) => {
    setExtraSlots(extraSlots.map(s => s.id === id ? {
      ...s,
      date,
      partySize: slotPartySize !== undefined ? slotPartySize : s.partySize,
      status: slotStatus !== undefined ? slotStatus : s.status
    } : s))
  }

  React.useEffect(() => {
    getCommonCustomers(restaurantId).then(setCommonCustomers).catch(console.error)
  }, [restaurantId])

  useEffect(() => {
    startOccupancyTransition(async () => {
      const reservationDate = format(startTime, 'yyyy-MM-dd')
      const startTimeStr = format(startTime, 'HH:mm:ss')
      
      const details = await getOccupiedTableIds(restaurantId, reservationDate, startTimeStr)
      // Filter out nulls and handle edit case (don't block the current reservation's table)
      const filtered = details.filter((d): d is { table_id: string; guest_name: string; start_time: string } =>
        d.table_id !== null && d.table_id !== initialData?.table_id // If editing, allow selecting OWN table
      )
      setOccupiedDetails(filtered)
      if (filtered.some(f => f.table_id === selectedTableId)) setSelectedTableId('')
    })
  }, [startTime, restaurantId, initialData?.id])


  const goTo = (nextStep: number) => {
    setSlideDir(nextStep > step ? 'right' : 'left')
    setRenderKey(k => k + 1)
    setStep(nextStep)
  }

  const selectedTable = tables.find(t => t.id === selectedTableId)
  const slideClass = slideDir === 'right' ? slideInRight : slideInLeft

  const { sortedZones, grouped, unassigned } = useMemo(() =>
    groupAndSortTables(tables, zones),
    [tables, zones]
  )

  const renderTableGrid = (tablesList: Tables<'physical_tables'>[]) => (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
      {tablesList.map((table) => {
        const isOccupied = occupiedDetails.some(o => o.table_id === table.id)
        const isSelected = selectedTableId === table.id
        const isDisabled = isOccupied && bookingStatus === 'confirmed'

        return (
          <button
            key={table.id}
            type="button"
            disabled={isDisabled}
            onClick={() => {
              setSelectedTableId(table.id)
              if (!isEdit) setPartySize(String(table.capacity))
            }}

            className={cn(
              "relative group flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300",
              isSelected
                ? "bg-emerald-500 border-emerald-400 text-foreground ring-4 ring-emerald-500/20 z-10 scale-[1.05]"
                : isOccupied
                  ? "bg-rose-500/5 border-rose-500/20 text-rose-400/60 opacity-60"
                  : "bg-background border-border hover:border-violet-500/40 text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="text-[10px] font-black uppercase tracking-widest mb-1">{table.table_name}</span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-bold">{table.capacity} Seats</span>
            </div>
          </button>
        )
      })}
    </div>
  )


  return (
    <div className="relative">
      <form action={action} className="space-y-6">
        <input type="hidden" name="restaurantId" value={restaurantId} />
        <input type="hidden" name="tableId" value={selectedTableId} />
        <input type="hidden" name="deviceToken" value={getOrCreateDeviceToken()} />

        <input type="hidden" name="status" value={bookingStatus} />
        <input type="hidden" name="partySize" value={partySize} />
        <input type="hidden" name="notes" value={notes} />
        <input type="hidden" name="guestName" value={guestName} />
        <input type="hidden" name="guestPhone" value={guestPhone} />
        <input type="hidden" name="startTime" value={format(startTime, "yyyy-MM-dd'T'HH:mm:ss")} />
        {isEdit && initialData?.id && <input type="hidden" name="reservationId" value={initialData.id} />}
        {extraSlots.length > 0 && (
          <input type="hidden" name="extraSlots" value={JSON.stringify(extraSlots.map(s => ({
            date: format(s.date, "yyyy-MM-dd'T'HH:mm:ss"),
            partySize: s.partySize,
            status: s.status
          })))} />
        )}

        {/* STEP 1: Schedule & Select Table */}
        {step === 1 && (
          <div key={`step1-${renderKey}`} className={cn('space-y-6', slideClass)}>

            {/* 🕒 Section: Dining Schedule */}
            <section className="bg-card rounded-3xl p-4 border border-border space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-violet-400" /> When are you dining?
                </h2>
              </div>

              <div className="space-y-6">
                {/* CARD: Primary slot */}
                <div className="bg-background/40 border border-border/60 rounded-2xl p-4 shadow-2xl relative overflow-hidden group/card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <Star className={cn("w-4 h-4", bookingStatus === 'confirmed' ? "text-emerald-400 fill-emerald-400" : "text-muted-foreground/60")} />
                      </div>
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Primary Slot</p>
                    </div>

                    <div className="flex bg-card/80 p-0.5 rounded-xl border border-border">
                      <button
                        type="button"
                        onClick={() => setBookingStatus('confirmed')}
                        className={cn(
                          "px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all",
                          bookingStatus === 'confirmed' ? "bg-emerald-500 text-foreground shadow-lg shadow-emerald-500/20" : "text-muted-foreground"
                        )}
                      >
                        Conf
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingStatus('pending')}
                        className={cn(
                          "px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all",
                          bookingStatus === 'pending' ? "bg-amber-500 text-foreground shadow-lg shadow-amber-500/20" : "text-muted-foreground"
                        )}
                      >
                        Wait
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                    <div className="flex-1">
                      <DateTimePickerV2 value={startTime} onChange={setStartTime} />
                    </div>
                    <div className="w-full sm:w-24">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase mb-2 px-1 block tracking-widest">Guests</Label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 pointer-events-none" />
                        <Input
                          type="number"
                          min={1}
                          value={partySize}
                          onChange={(e) => setPartySize(e.target.value)}
                          className="h-14 bg-card border-2 border-border/50 text-foreground pl-9 font-black text-lg rounded-2xl focus:border-emerald-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {extraSlots.length > 0 && (
                  <div className="space-y-4">
                    {extraSlots.map((slot, index) => (
                      <div key={slot.id} className="relative group/card animate-in slide-in-from-bottom-2 fade-in duration-400">
                        <div className="bg-background/40 border border-border/60 rounded-2xl p-4 shadow-xl relative overflow-hidden">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                <CalendarDays className="w-4 h-4 text-violet-400" />
                              </div>
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Added Slot #{index + 1}</p>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex bg-card/80 p-0.5 rounded-xl border border-border">
                                <button
                                  type="button"
                                  onClick={() => updateExtraSlot(slot.id, slot.date, slot.partySize, 'confirmed')}
                                  className={cn(
                                    "px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all",
                                    slot.status === 'confirmed' ? "bg-emerald-500 text-foreground" : "text-muted-foreground"
                                  )}
                                >
                                  Conf
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateExtraSlot(slot.id, slot.date, slot.partySize, 'pending')}
                                  className={cn(
                                    "px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all",
                                    slot.status === 'pending' ? "bg-amber-500 text-foreground" : "text-muted-foreground"
                                  )}
                                >
                                  Wait
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeExtraSlot(slot.id)}
                                className="w-10 h-10 flex items-center justify-center bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 hover:bg-rose-500 transition-all hover:text-foreground"
                              >
                                <CircleX className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                            <div className="flex-1">
                              <DateTimePickerV2 value={slot.date} onChange={(date) => updateExtraSlot(slot.id, date)} />
                            </div>
                            <div className="w-full sm:w-24">
                              <Label className="text-[10px] font-black text-muted-foreground uppercase mb-2 px-1 block tracking-widest">Guests</Label>
                              <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400 pointer-events-none" />
                                <Input
                                  type="number"
                                  min={1}
                                  value={slot.partySize}
                                  onChange={(e) => updateExtraSlot(slot.id, slot.date, parseInt(e.target.value) || 1)}
                                  className="h-14 bg-card border-2 border-border/50 text-foreground pl-9 font-black text-lg rounded-2xl focus:border-violet-500 transition-all"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={addExtraSlot}
                  className="w-full h-16 flex items-center justify-center gap-3 bg-background/20 border-2 border-dashed border-border rounded-[2rem] text-muted-foreground hover:border-violet-500/50 hover:text-violet-400 transition-all hover:bg-violet-500/5 group"
                >
                  <PlusCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-black uppercase tracking-[0.2em]">Add Another Date</span>
                </button>
              </div>
            </section>

            {/* 🍽️ Section: Table grid (Now List View) */}
            <section className="bg-card rounded-[2rem] p-5 md:p-8 border border-border shadow-xl space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
                <div className="space-y-1">
                  <h2 className="text-sm font-black text-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                    Table Selection
                  </h2>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                    {bookingStatus === 'confirmed' ? 'Select an available table' : 'Choose any table for waitlist'}
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                {sortedZones.map((zone: { id: string; name: string }) => {
                  const zoneTables = grouped[zone.id] || []
                  if (zoneTables.length === 0) return null
                  return (
                    <div key={zone.id} className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <div className="h-4 w-1 rounded-full bg-violet-500/50" />
                        <h3 className="text-xs font-black text-foreground uppercase tracking-widest italic">{zone.name}</h3>
                      </div>
                      {renderTableGrid(zoneTables)}
                    </div>
                  )
                })}

                {unassigned.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <div className="h-4 w-1 rounded-full bg-muted" />
                      <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest italic">Unassigned</h3>
                    </div>
                    {renderTableGrid(unassigned)}
                  </div>
                )}
              </div>
            </section>

            <Button
              type="button"
              disabled={!selectedTableId}
              onClick={() => goTo(2)}
              className="w-full h-16 bg-gradient-to-r from-emerald-600 to-indigo-600 text-foreground font-black text-lg rounded-[2rem] shadow-xl active:scale-[0.98] transition-all"
            >
              Next: Customer Details <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
          </div>
        )}

        {/* STEP 2: Customer Details */}
        {step === 2 && (
          <div key={`step2-${renderKey}`} className={cn('space-y-6', slideClass)}>
            <section className="bg-card rounded-3xl p-4 border border-border space-y-4">
              <h2 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" /> Guest Details
              </h2>

              <CustomerSelector
                restaurantId={restaurantId}
                businessType={businessType}
                onSelect={({ name, phone }) => {
                  setGuestName(name)
                  setGuestPhone(phone)
                }}
                className="mb-2"
              />

              <div className="space-y-4">
                <div>
                  <Label className="text-[10px] font-black text-muted-foreground uppercase mb-2 px-1 block tracking-widest">Name</Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                    <Input
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Who is dining?"
                      className="h-14 bg-background border-border text-foreground pl-10 font-bold rounded-2xl focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[10px] font-black text-muted-foreground uppercase mb-2 px-1 block tracking-widest">Phone Number (Optional)</Label>
                  <div className='relative'>
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                    <Input
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="0123456789"
                      className="h-14 bg-background border-border text-foreground pl-10 font-bold rounded-2xl focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[10px] font-black text-muted-foreground uppercase mb-2 px-1 block tracking-widest">Special Requests / Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Birthdays, allergies, etc..."
                    className="bg-background border-border text-foreground font-bold rounded-2xl resize-none h-32"
                  />
                </div>
              </div>
            </section>

            <div className="flex gap-3">
              <button type="button" onClick={() => goTo(1)} className="w-16 h-16 flex items-center justify-center bg-muted rounded-[2rem] text-foreground/80">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <Button
                type="button"
                onClick={() => goTo(3)}
                disabled={!guestName}
                className="flex-1 h-16 bg-gradient-to-r from-emerald-600 to-indigo-600 text-foreground font-black text-lg rounded-[2rem] shadow-xl active:scale-[0.98] transition-all"
              >
                Review Schedule <ArrowRight className="w-6 h-6 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Confirm Timeline */}
        {step === 3 && (
          <div key={`step3-${renderKey}`} className={cn('space-y-6 flex flex-col min-h-full pb-8', slideClass)}>

            <div className="px-1 pt-2">
              <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                Ready to dining? <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
              </h2>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Review your dining schedule before confirming</p>
            </div>

            <div className="space-y-4">
              <div className="bg-card/50 rounded-3xl p-4 border border-border/60 relative overflow-hidden backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="w-9 h-9 rounded-xl bg-violet-600/20 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-violet-400" />
                  </div>
                  <p className="text-xs font-black text-foreground uppercase tracking-widest">Dining Schedule</p>
                </div>

                <div className="relative pl-4 space-y-8">
                  {extraSlots.length > 0 && (
                    <div className="absolute left-1 top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-500/50 via-violet-500/30 to-slate-800/20" />
                  )}

                  <div className="relative group">
                    <div className={cn(
                      "absolute -left-[18px] top-1.5 w-3 h-3 rounded-full border-2 border-border z-10",
                      bookingStatus === 'confirmed' ? "bg-emerald-500 shadow-lg shadow-emerald-500/40" : "bg-amber-500"
                    )} />
                    <div className="flex flex-col">
                      <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mb-1.5 opacity-60">Primary Slot</p>
                      <div className="flex items-center gap-2 flex-wrap text-foreground">
                        <span className="font-black text-base">{startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        <span className="text-muted-foreground text-sm opacity-50">at</span>
                        <span className="font-black text-base text-violet-400">{startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">
                          {partySize} People
                        </span>
                      </div>
                    </div>
                  </div>

                  {extraSlots.map((slot, i) => (
                    <div key={slot.id} className="relative group">
                      <div className={cn(
                        "absolute -left-[18px] top-1.5 w-3 h-3 rounded-full border-2 border-border z-10",
                        slot.status === 'confirmed' ? "bg-emerald-500 shadow-lg shadow-emerald-500/40" : "bg-amber-500"
                      )} />
                      <div className="flex flex-col">
                        <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mb-1.5 opacity-60 italic">Added Slot #{i + 1}</p>
                        <div className="flex items-center gap-2 flex-wrap text-foreground">
                          <span className="font-black text-base">{slot.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                          <span className="text-muted-foreground text-sm opacity-50">at</span>
                          <span className="font-black text-base text-violet-400">{slot.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="px-2 py-0.5 rounded-lg bg-violet-500/10 text-violet-300 text-[10px] font-black uppercase tracking-wider border border-violet-500/20">
                            {slot.partySize} People
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Card: Table */}
                {selectedTable && (
                  <div className="bg-card/50 rounded-2xl p-4 border border-border/60 flex items-center gap-4 transition-all hover:bg-card">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                      <UtensilsCrossed className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Assigned Table</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-foreground font-black text-lg truncate">{selectedTable.table_name}</p>
                        <p className="text-muted-foreground text-xs font-bold whitespace-nowrap">up to {selectedTable.capacity} Seats</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Card: Customer */}
                <div className="bg-card/50 rounded-2xl p-4 border border-border/60 flex items-center gap-4 transition-all hover:bg-card">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <User className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Guest Details</p>
                    <p className="text-foreground font-black text-lg truncate">{guestName}</p>
                    {guestPhone && <p className="text-muted-foreground text-sm font-bold mt-0.5">{guestPhone}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                disabled={pending || !selectedTableId || !guestName}
                className="w-full h-16 bg-gradient-to-r from-violet-600 to-indigo-600 text-foreground font-black text-lg rounded-[2rem] shadow-xl shadow-violet-500/30 active:scale-[0.98] transition-all"
              >
                {pending ? 'Reserving...' : (
                  <span className="flex items-center gap-2">
                    Confirm Dining <ArrowRight className="w-6 h-6" />
                  </span>
                )}
              </Button>
              <button
                type="button"
                onClick={() => goTo(2)}
                className="w-full h-12 bg-card border border-border text-foreground/70 font-semibold text-sm rounded-2xl flex items-center justify-center gap-2"
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
