import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AdminPasswordResetCard } from './AdminPasswordResetClient'

export const metadata = { title: 'Admin Accounts — Superadmin' }

export default async function AdminsPage() {
  const supabase = await createClient()

  const { data: members } = await supabase
    .from('account_memberships')
    .select('*, profiles(full_name, avatar_url), restaurants(name)')
    .eq('role', 'admin')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Accounts</h1>
        <p className="text-slate-400 text-sm mt-1">{members?.length ?? 0} admin accounts across all restaurants</p>
      </div>

      <div className="grid gap-4">
        {members?.map((m: any) => (
          <Card key={m.id} className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center text-sm font-bold text-white">
                    {(m.profiles?.full_name || 'A').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-white">{m.profiles?.full_name || 'Admin'}</p>
                    <p className="text-xs text-slate-500">{m.restaurants?.name || 'Unknown Restaurant'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={m.is_active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs' : 'bg-slate-700 text-slate-400 text-xs'}>
                    {m.is_active ? 'Active' : 'Disabled'}
                  </Badge>
                  <AdminPasswordResetCard userId={m.user_id} name={m.profiles?.full_name || 'Admin'} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {!members?.length && (
          <Card className="bg-slate-900/50 border-slate-800 border-dashed">
            <CardContent className="p-12 text-center">
              <p className="text-slate-500">No admin accounts yet. Create a restaurant to add an admin.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
