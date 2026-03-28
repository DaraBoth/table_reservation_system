import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CreateTableDialog } from './CreateTableDialog'
import type { AccountMembership, PhysicalTable } from '@/lib/types/database'

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

  const membership = membershipRaw as AccountMembership | null
  if (membership?.role !== 'admin') redirect('/dashboard')

  const { data: raw } = await supabase
    .from('physical_tables')
    .select('*')
    .eq('restaurant_id', membership.restaurant_id!)
    .order('table_name')

  const tables = (raw ?? []) as PhysicalTable[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tables</h1>
          <p className="text-slate-400 text-sm mt-1">{tables.length} dining tables configured</p>
        </div>
        <CreateTableDialog />
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Table Name</TableHead>
                <TableHead className="text-slate-400">Capacity</TableHead>
                <TableHead className="text-slate-400">Description</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map(t => (
                <TableRow key={t.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                  <TableCell className="font-medium text-white">{t.table_name}</TableCell>
                  <TableCell className="text-slate-300">{t.capacity} guests</TableCell>
                  <TableCell className="text-slate-500 text-sm">{t.description || '—'}</TableCell>
                  <TableCell>
                    <Badge className={t.is_active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs' : 'bg-slate-700 text-slate-400 text-xs'}>
                      {t.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
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
