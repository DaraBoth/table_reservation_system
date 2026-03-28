import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CancelReservationButton, UpdateStatusButton } from './ReservationActions'
import type { AccountMembership, Reservation, PhysicalTable } from '@/lib/types/database'

export const metadata = { title: 'Reservations — TableBook' }

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  confirmed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  completed: 'bg-slate-600 text-slate-300',
  no_show: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

export default async function ReservationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membershipRaw } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id')
    .eq('user_id', user.id)
    .single()

  const membership = membershipRaw as AccountMembership | null
  if (!membership?.restaurant_id) return null

  const { data: raw } = await supabase
    .from('reservations')
    .select('*, physical_tables(table_name, capacity)')
    .eq('restaurant_id', membership.restaurant_id)
    .order('created_at', { ascending: false })
    .limit(50)

  const reservations = (raw ?? []) as unknown as Array<Reservation & { physical_tables: Pick<PhysicalTable, 'table_name' | 'capacity'> | null }>
  const isAdmin = membership.role === 'admin'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reservations</h1>
          <p className="text-slate-400 text-sm mt-1">{reservations.length} total records</p>
        </div>
        <Link href="/dashboard/reservations/new"
          className={cn(buttonVariants(), 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 shadow-lg shadow-violet-500/25')}>
          + New Booking
        </Link>
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400 font-medium">Guest</TableHead>
                <TableHead className="text-slate-400 font-medium">Table</TableHead>
                <TableHead className="text-slate-400 font-medium">Party</TableHead>
                <TableHead className="text-slate-400 font-medium">Time</TableHead>
                <TableHead className="text-slate-400 font-medium">Status</TableHead>
                <TableHead className="text-slate-400 font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map((res) => {
                const timeStr = res.reservation_time?.replace(/[[\]()]/g, '').split(',')
                const start = timeStr?.[0]?.trim()
                const canCancel = !['cancelled', 'completed'].includes(res.status)
                return (
                  <TableRow key={res.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-white">{res.guest_name}</p>
                        <p className="text-xs text-slate-500">{res.guest_phone || res.guest_email || '—'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300 text-sm">{res.physical_tables?.table_name ?? '—'}</TableCell>
                    <TableCell className="text-slate-300 text-sm">{res.party_size}</TableCell>
                    <TableCell className="text-slate-300 text-xs">
                      {start ? new Date(start).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${statusColors[res.status] ?? ''}`}>{res.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin && canCancel && (
                          <UpdateStatusButton reservationId={res.id} currentStatus={res.status} />
                        )}
                        {canCancel && (
                          <CancelReservationButton reservationId={res.id} />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {!reservations.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                    No reservations yet ·{' '}
                    <Link href="/dashboard/reservations/new" className="text-violet-400 hover:text-violet-300">Create one</Link>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
