import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, ShieldAlert, Users, Info } from 'lucide-react'
import { CreateUserDialog } from './CreateUserDialog'
import { DeleteUserButton } from './DeleteUserButton'
import { cn } from '@/lib/utils'
import type { Restaurant } from '@/lib/types/database'

export const metadata = { title: 'User Management — Superadmin' }

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: membersRaw, error: membersError } = await supabase
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">User Management</h1>
          <p className="text-slate-400 mt-2 font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Manage global access for all {members.length} platform participants
          </p>
        </div>
        <CreateUserDialog restaurants={restaurants} />
      </div>

      {membersError && (
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400 rounded-3xl p-6">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="font-black uppercase tracking-widest text-xs ml-2">Database Access Error</AlertTitle>
          <AlertDescription className="mt-2 text-sm opacity-90">
            {membersError.message}. This might be due to a security policy restriction.
          </AlertDescription>
        </Alert>
      )}

      {/* Diagnostics for Superadmin */}
      {members.length === 0 && !membersError && (
        <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-400 rounded-3xl p-6">
          <Info className="h-5 w-5" />
          <AlertTitle className="font-black uppercase tracking-widest text-xs ml-2">Visibility Insight</AlertTitle>
          <AlertDescription className="mt-2 text-sm opacity-90">
            The system found 0 records matching your permissions. If you expect users here, check if their profiles are correctly provisioned in the base platform.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8">
        {['superadmin', 'admin', 'staff'].map((role) => {
          const roleMembers = members.filter(m => m.role === role)
          if (roleMembers.length === 0 && role !== 'admin') return null

          return (
            <Card key={role} className="bg-slate-900/40 backdrop-blur-xl border-slate-800/60 shadow-3xl overflow-hidden rounded-[2.5rem] transition-all hover:border-slate-700/50">
              <CardHeader className="border-b border-slate-800/40 pb-6 p-8">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-black text-white capitalize flex items-center gap-3 tracking-tight">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      role === 'superadmin' ? 'bg-indigo-600/20 text-indigo-400' : role === 'admin' ? 'bg-amber-600/20 text-amber-400' : 'bg-slate-700/20 text-slate-400'
                    )}>
                      {role === 'superadmin' ? <ShieldAlert className="h-5 w-5" /> : role === 'admin' ? <Users className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                    </div>
                    {role}s
                  </CardTitle>
                  <Badge variant="outline" className="bg-slate-800/40 text-slate-500 border-slate-800 text-[10px] uppercase font-black tracking-widest px-4 py-1 rounded-full">
                    {roleMembers.length} Accounts
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-800/40">
                  {roleMembers.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-6 hover:bg-slate-800/20 transition-all duration-300">
                      <div className="flex items-center gap-5">
                        <Avatar className="h-14 w-14 border-2 border-slate-800 ring-2 ring-transparent group-hover:ring-violet-500/20 transition-all">
                          <AvatarFallback className={cn(
                            "font-black text-white",
                            m.role === 'superadmin' ? 'bg-gradient-to-br from-indigo-500 to-blue-600' : m.role === 'admin' ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-slate-700'
                          )}>
                            {(m.profiles?.full_name || 'U').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-black text-lg text-white leading-tight">{m.profiles?.full_name || 'System Identity'}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            {m.restaurants && (
                              <Badge className="bg-slate-800/60 text-slate-400 border-0 text-[10px] py-0 px-2 rounded-md font-bold">
                                {m.restaurants.name}
                              </Badge>
                            )}
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Provisioned {new Date(m.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <Badge className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full",
                          m.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                        )}>
                          {m.is_active ? 'Authorized' : 'Deactivated'}
                        </Badge>
                        
                        {m.role !== 'superadmin' && (
                          <DeleteUserButton userId={m.user_id} />
                        )}
                      </div>
                    </div>
                  ))}
                  {roleMembers.length === 0 && (
                    <div className="p-12 text-center text-slate-600 text-xs font-black uppercase tracking-[0.2em]">
                      No active {role} nodes detect.
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
