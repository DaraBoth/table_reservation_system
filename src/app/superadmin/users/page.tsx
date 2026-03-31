import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { CreateUserDialog } from './CreateUserDialog'
import { DeleteUserButton } from './DeleteUserButton'
import type { Restaurant } from '@/lib/types/database'

export const metadata = { title: 'User Management — Superadmin' }

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: membersRaw } = await supabase
    .from('account_memberships')
    .select('*, profiles(full_name, avatar_url), restaurants(name)')
    .order('role', { ascending: true })

  const { data: restaurantsRaw } = await supabase
    .from('restaurants')
    .select('*')
    .order('name')

  const members = (membersRaw ?? []) as any[]
  const restaurants = (restaurantsRaw ?? []) as Restaurant[]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-slate-400 mt-1">Manage global access for all {members.length} users</p>
        </div>
        <CreateUserDialog restaurants={restaurants} />
      </div>

      <div className="grid gap-6">
        {/* Role Groups */}
        {['superadmin', 'admin', 'staff'].map((role) => {
          const roleMembers = members.filter(m => m.role === role)
          if (roleMembers.length === 0 && role !== 'admin') return null

          return (
            <Card key={role} className="bg-slate-900/50 border-slate-800">
              <CardHeader className="border-b border-slate-800/50 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-white capitalize flex items-center gap-2">
                    {role === 'superadmin' ? '🛡️' : role === 'admin' ? '👤' : '👥'}
                    {role}s
                  </CardTitle>
                  <Badge variant="outline" className="text-slate-500 border-slate-800 text-[10px]">
                    {roleMembers.length} Total
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-800/50">
                  {roleMembers.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-5 hover:bg-slate-800/20 transition-colors">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border border-slate-700">
                          <AvatarFallback className={m.role === 'superadmin' ? 'bg-indigo-600' : m.role === 'admin' ? 'bg-amber-600' : 'bg-slate-700'}>
                            {(m.profiles?.full_name || 'U').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white">{m.profiles?.full_name || 'System User'}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {m.restaurants && (
                              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-slate-500" />
                                {m.restaurants.name}
                              </p>
                            )}
                            <p className="text-[10px] text-slate-600">Joined {new Date(m.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <Badge className={m.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]' : 'bg-red-500/10 text-red-400 border-red-500/20 text-[10px]'}>
                          {m.is_active ? 'Active' : 'Disabled'}
                        </Badge>
                        
                        {/* Only show delete button for non-superadmins */}
                        {m.role !== 'superadmin' && (
                          <DeleteUserButton userId={m.user_id} />
                        )}
                      </div>
                    </div>
                  ))}
                  {roleMembers.length === 0 && (
                    <div className="p-8 text-center text-slate-500 text-sm italic">
                      No {role}s found.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
