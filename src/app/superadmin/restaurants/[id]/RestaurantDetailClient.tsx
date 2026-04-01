'use client'

import { useActionState } from 'react'
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

interface Props {
  restaurant: Tables<'restaurants'>
  members: (Tables<'account_memberships'> & { profiles: Pick<Tables<'profiles'>, 'full_name' | 'avatar_url'> | null })[]
}

export function RestaurantDetailClient({ restaurant, members }: Props) {
  const [subState, subAction, subPending] = useActionState(updateSubscription, null)
  const [restState, restAction, restPending] = useActionState(updateRestaurant, null)
  const [pwState, pwAction, pwPending] = useActionState(resetUserPassword, null)
  const [toggleState, toggleAction, togglePending] = useActionState(toggleMemberStatus, null)

  const isExpired = restaurant.subscription_expires_at && new Date(restaurant.subscription_expires_at) < new Date()

  return (
    <div className="space-y-6">
      {/* Subscription Management */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Subscription</CardTitle>
          <CardDescription>Control access and billing period for this restaurant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-6">
            <Badge className={isExpired ? 'bg-red-500/20 text-red-400 border-red-500/30' : restaurant.is_active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-700 text-slate-400'}>
              {isExpired ? 'Expired' : restaurant.is_active ? 'Active' : 'Suspended'}
            </Badge>
            {restaurant.subscription_expires_at && (
              <span className="text-sm text-slate-400">
                Expires: {new Date(restaurant.subscription_expires_at).toLocaleString()}
              </span>
            )}
          </div>
          <form action={subAction} className="space-y-4">
            <input type="hidden" name="restaurantId" value={restaurant.id} />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Subscription Expiry Date</Label>
                <Input
                  name="subscriptionExpiresAt"
                  type="datetime-local"
                  defaultValue={restaurant.subscription_expires_at?.slice(0, 16) ?? ''}
                  className="bg-slate-800/50 border-slate-700 text-white focus:border-violet-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Status</Label>
                <select name="isActive" defaultValue={restaurant.is_active ? 'true' : 'false'}
                  className="w-full h-10 rounded-md bg-slate-800/50 border border-slate-700 text-white px-3 text-sm focus:border-violet-500 focus:outline-none">
                  <option value="true">Active</option>
                  <option value="false">Suspended</option>
                </select>
              </div>
            </div>
            {subState?.error && <p className="text-red-400 text-sm">{subState.error}</p>}
            {subState?.success && <p className="text-emerald-400 text-sm">{subState.success}</p>}
            <Button type="submit" disabled={subPending}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0">
              {subPending ? 'Saving...' : 'Update Subscription'}
            </Button>
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
