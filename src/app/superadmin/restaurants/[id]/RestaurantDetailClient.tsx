'use client'

import { useActionState, useState } from 'react'
import { updateSubscription, updateRestaurant } from '@/app/actions/restaurants'
import { resetUserPassword } from '@/app/actions/auth'
import { toggleMemberStatus } from '@/app/actions/memberships'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Tables } from '@/lib/types/database'
import { Calendar, Infinity } from 'lucide-react'

interface Props {
  restaurant: Tables<'restaurants'>
  members: (Tables<'account_memberships'> & { profiles: Pick<Tables<'profiles'>, 'full_name' | 'avatar_url'> | null })[]
}

export function RestaurantDetailClient({ restaurant, members }: Props) {
  const [subState, subAction, subPending] = useActionState(updateSubscription, null)
  const [restState, restAction, restPending] = useActionState(updateRestaurant, null)
  const [pwState, pwAction, pwPending] = useActionState(resetUserPassword, null)
  const [toggleState, toggleAction, togglePending] = useActionState(toggleMemberStatus, null)

  const [expiryDate, setExpiryDate] = useState(restaurant.subscription_expires_at?.slice(0, 16) ?? '')

  const isExpired = restaurant.subscription_expires_at && new Date(restaurant.subscription_expires_at) < new Date()

  const setPreset = (days: number | null) => {
    if (days === null) {
      setExpiryDate('')
      return
    }
    const d = new Date()
    d.setDate(d.getDate() + days)
    // Format to yyyy-MM-ddThh:mm for datetime-local
    const pad = (n: number) => n.toString().padStart(2, '0')
    const str = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    setExpiryDate(str)
  }

  return (
    <div className="space-y-6">
      {/* Subscription Management */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-violet-400" /> Subscription
          </CardTitle>
          <CardDescription>Control access and billing period for this restaurant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-6">
            <Badge className={isExpired ? 'bg-red-500/20 text-red-400 border-red-500/30' : restaurant.is_active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-700 text-slate-400'}>
              {isExpired ? 'Expired' : restaurant.is_active ? 'Active' : 'Suspended'}
            </Badge>
            <span className="text-sm text-slate-400">
              Current: {restaurant.subscription_expires_at ? new Date(restaurant.subscription_expires_at).toLocaleString() : 'No Expiration'}
            </span>
          </div>

          <form action={subAction} className="space-y-6">
            <input type="hidden" name="restaurantId" value={restaurant.id} />
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-slate-300 text-sm font-bold flex items-center gap-2">
                    Expiry Date
                   {!expiryDate && <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500">Unending</Badge>}
                  </Label>
                  
                  <Input
                    name="subscriptionExpiresAt"
                    type="datetime-local"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white focus:border-violet-500 h-11"
                  />

                  {/* Presets */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      { label: '7D', days: 7 },
                      { label: '1M', days: 30 },
                      { label: '3M', days: 90 },
                      { label: '6M', days: 180 },
                      { label: '1Y', days: 365 },
                    ].map(p => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setPreset(p.days)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-black text-slate-400 hover:text-white hover:border-violet-500 hover:bg-violet-500/10 transition-all uppercase tracking-tight"
                      >
                        +{p.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPreset(null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 border border-emerald-500/20 text-[10px] font-black text-emerald-500/80 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all uppercase tracking-tight flex items-center gap-1"
                    >
                      <Infinity className="w-3 h-3" /> No Expiry
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-slate-300 text-sm font-bold">Access Status</Label>
                  <select name="isActive" defaultValue={restaurant.is_active ? 'true' : 'false'}
                    className="w-full h-11 rounded-xl bg-slate-800/50 border border-slate-700 text-white px-3 text-sm focus:border-violet-500 focus:outline-none transition-all">
                    <option value="true">Active (Allowed to Login)</option>
                    <option value="false">Suspended (Blocked)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 px-1 italic">Note: Suspended restaurants cannot access their dashboard regardless of expiry date.</p>
                </div>
              </div>
            </div>

            <Separator className="bg-slate-800/50" />

            <div className="flex flex-col gap-3">
              {subState?.error && <p className="text-rose-400 text-sm font-bold px-1">⚠️ {subState.error}</p>}
              {subState?.success && <p className="text-emerald-400 text-sm font-bold px-1">✅ {subState.success}</p>}
              
              <Button type="submit" disabled={subPending}
                className="w-full md:w-fit px-8 h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 rounded-xl font-black shadow-lg shadow-violet-500/20">
                {subPending ? 'Saving Settings...' : 'Update Subscription & Status'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Admin Members */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Admin Accounts</CardTitle>
          <CardDescription>Reset passwords and manage admin status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.filter(m => m.role === 'admin').map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <div>
                  <p className="text-sm font-medium text-white">{m.profiles?.full_name || 'Admin'}</p>
                  <p className="text-xs text-slate-500">Member ID: {m.user_id.slice(0, 8)}...</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={m.is_active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs' : 'bg-slate-700 text-slate-400 text-xs'}>
                    {m.is_active ? 'Active' : 'Disabled'}
                  </Badge>
                  {/* Toggle Status */}
                  <form action={toggleAction}>
                    <input type="hidden" name="memberId" value={m.id} />
                    <input type="hidden" name="isActive" value={(!m.is_active).toString()} />
                    <Button type="submit" variant="outline" size="sm" disabled={togglePending}
                      className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 text-xs h-7">
                      {m.is_active ? 'Disable' : 'Enable'}
                    </Button>
                  </form>
                </div>
              </div>
            ))}
            {members.filter(m => m.role === 'admin').length === 0 && (
              <p className="text-slate-500 text-sm text-center py-4">No admin accounts yet</p>
            )}
          </div>

          {/* Reset Password */}
          {members.filter(m => m.role === 'admin').length > 0 && (
            <>
              <Separator className="my-4 bg-slate-800" />
              <div>
                <p className="text-sm font-medium text-slate-300 mb-3">Reset Admin Password</p>
                <form action={pwAction} className="space-y-3">
                  <select name="userId"
                    className="w-full h-10 rounded-md bg-slate-800/50 border border-slate-700 text-white px-3 text-sm focus:border-violet-500 focus:outline-none">
                    {members.filter(m => m.role === 'admin').map(m => (
                      <option key={m.user_id} value={m.user_id}>{m.profiles?.full_name || m.user_id.slice(0, 8)}</option>
                    ))}
                  </select>
                  <Input name="newPassword" type="password" placeholder="New password (min 6 chars)"
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500" />
                  {pwState?.error && <p className="text-red-400 text-sm">{pwState.error}</p>}
                  {pwState?.success && <p className="text-emerald-400 text-sm">{pwState.success}</p>}
                  <Button type="submit" disabled={pwPending} variant="outline"
                    className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800">
                    {pwPending ? 'Resetting...' : 'Reset Password'}
                  </Button>
                </form>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
