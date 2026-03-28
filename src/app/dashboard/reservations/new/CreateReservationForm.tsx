'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { createReservation } from '@/app/actions/reservations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { PhysicalTable } from '@/lib/types/database'
import Link from 'next/link'

interface Props { tables: PhysicalTable[] }

export function CreateReservationForm({ tables }: Props) {
  const [state, action, pending] = useActionState(createReservation, null)

  // Default times: today at 7pm – 9pm
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const defaultStart = `${yyyy}-${mm}-${dd}T19:00`
  const defaultEnd = `${yyyy}-${mm}-${dd}T21:00`

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/dashboard/reservations" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
          ← Back to reservations
        </Link>
        <h1 className="text-2xl font-bold text-white mt-2">New Reservation</h1>
        <p className="text-slate-400 text-sm mt-1">Book a table for a guest</p>
      </div>

      <form action={action}>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Booking Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Table selection */}
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Table *</Label>
              {tables.length === 0 ? (
                <p className="text-sm text-amber-400">No tables available. Ask your admin to add tables first.</p>
              ) : (
                <select name="tableId" required
                  className="w-full h-10 rounded-md bg-slate-800/50 border border-slate-700 text-white px-3 text-sm focus:border-violet-500 focus:outline-none">
                  <option value="">Select a table...</option>
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>{t.table_name} (capacity: {t.capacity})</option>
                  ))}
                </select>
              )}
            </div>

            {/* Time range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Start Time *</Label>
                <Input name="startTime" type="datetime-local" required defaultValue={defaultStart}
                  className="bg-slate-800/50 border-slate-700 text-white focus:border-violet-500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">End Time *</Label>
                <Input name="endTime" type="datetime-local" required defaultValue={defaultEnd}
                  className="bg-slate-800/50 border-slate-700 text-white focus:border-violet-500" />
              </div>
            </div>

            {/* Guest info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Guest Name *</Label>
                <Input name="guestName" required placeholder="John Smith"
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Party Size *</Label>
                <Input name="partySize" type="number" required min={1} defaultValue={2}
                  className="bg-slate-800/50 border-slate-700 text-white focus:border-violet-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Phone</Label>
                <Input name="guestPhone" type="tel" placeholder="+1 555 0100"
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Email</Label>
                <Input name="guestEmail" type="email" placeholder="guest@email.com"
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Notes</Label>
              <Textarea name="notes" placeholder="Special requests, allergies, occasion..."
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 resize-none" rows={3} />
            </div>

            {state?.error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">{state.error}</div>
            )}
            {state?.success && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-400">{state.success}</div>
            )}

            <Button type="submit" disabled={pending || tables.length === 0}
              className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 shadow-lg shadow-violet-500/25">
              {pending ? 'Creating...' : 'Confirm Reservation'}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
