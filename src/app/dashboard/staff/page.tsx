import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CreateStaffDialog } from './CreateStaffDialog'
import { StaffPasswordResetButton } from './StaffPasswordReset'
import type { AccountMembership, Profile } from '@/lib/types/database'

export const metadata = { title: 'Staff — TableBook' }

export default async function StaffPage() {
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
    .from('account_memberships')
    .select('*, profiles(full_name, avatar_url)')
    .eq('restaurant_id', membership.restaurant_id!)
    .eq('role', 'staff')
    .order('created_at', { ascending: false })

  const staff = (raw ?? []) as unknown as Array<AccountMembership & { profiles: Pick<Profile, 'full_name' | 'avatar_url'> | null }>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Staff</h1>
          <p className="text-slate-400 text-sm mt-1">{staff.length} staff members</p>
        </div>
        <CreateStaffDialog />
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Name</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Joined</TableHead>
                <TableHead className="text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((s) => (
                <TableRow key={s.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                        {(s.profiles?.full_name || 'S').slice(0, 2).toUpperCase()}
                      </div>
                      <p className="text-sm font-medium text-white">{s.profiles?.full_name || 'Staff Member'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={s.is_active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs' : 'bg-slate-700 text-slate-400 text-xs'}>
                      {s.is_active ? 'Active' : 'Disabled'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {new Date(s.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <StaffPasswordResetButton userId={s.user_id} name={s.profiles?.full_name || 'Staff'} />
                  </TableCell>
                </TableRow>
              ))}
              {!staff.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-slate-500">
                    No staff yet · Click &quot;Add Staff&quot; to invite members
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
