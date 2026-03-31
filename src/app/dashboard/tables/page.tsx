import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CreateTableDialog } from './CreateTableDialog'
import { cn } from '@/lib/utils'
import type { Tables } from '@/lib/types/database'

export const metadata = { title: 'Tables — TableBook' }

export default async function TablesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membershipRaw } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id')
    .eq('user_id', user.id)
    .single()

  const membership = membershipRaw as Tables<'account_memberships'> | null
  const isAdmin = membership?.role === 'admin'
  const isStaff = membership?.role === 'staff'
  
  if (!isAdmin && !isStaff) redirect('/dashboard')

  const { data: raw } = await supabase
    .from('physical_tables')
    .select('*')
    .eq('restaurant_id', membership.restaurant_id!)
    .order('table_name')

  const tables = (raw ?? []) as Tables<'physical_tables'>[]

  // Fetch current reservations to determine 'Busy/Free' status
  const now = new Date().toISOString()
  const rangeStr = `["${now}", "${now}"]` // point check
  const { data: occupied } = await supabase
    .from('reservations')
    .select('table_id')
    .eq('restaurant_id', membership.restaurant_id!)
    .neq('status', 'cancelled')
    .filter('reservation_time', 'ov', rangeStr)

  const occupiedIds = new Set(occupied?.map(o => o.table_id) ?? [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tables</h1>
          <p className="text-slate-400 text-sm mt-1">{tables.length} dining tables configured</p>
        </div>
        {isAdmin && <CreateTableDialog />}
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Table Name</TableHead>
                <TableHead className="text-slate-400">Capacity</TableHead>
                <TableHead className="text-slate-400">Current Status</TableHead>
                <TableHead className="text-slate-400 text-right">Config</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map(t => {
                const isBusy = occupiedIds.has(t.id)
                return (
                  <TableRow key={t.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <TableCell className="font-medium text-white">{t.table_name}</TableCell>
                    <TableCell className="text-slate-300">{t.capacity} guests</TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "text-xs font-bold uppercase tracking-widest px-2 py-0.5",
                        isBusy 
                          ? "bg-rose-500/20 text-rose-400 border-rose-500/30" 
                          : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      )}>
                        {isBusy ? 'Busy' : 'Free'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className={t.is_active ? 'bg-slate-800 text-slate-400 border-slate-700 text-[10px]' : 'bg-red-900/20 text-red-500 border-red-500/30 text-[10px]'}>
                        {t.is_active ? 'Active' : 'Offline'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
              {!tables.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-slate-500">
                    No tables yet · Click &quot;Add Table&quot; to get started
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
