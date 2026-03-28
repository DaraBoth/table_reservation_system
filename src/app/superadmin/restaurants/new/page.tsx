'use client'

import { useActionState } from 'react'
import { createRestaurant } from '@/app/actions/restaurants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

export default function NewRestaurantPage() {
  const [state, action, pending] = useActionState(createRestaurant, null)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/superadmin/restaurants" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
          ← Back to restaurants
        </Link>
        <h1 className="text-2xl font-bold text-white mt-2">Create New Restaurant</h1>
        <p className="text-slate-400 text-sm mt-1">Set up a new tenant and create their Admin account</p>
      </div>

      <form action={action} className="space-y-6">
        {/* Restaurant Details */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Restaurant Details</CardTitle>
            <CardDescription>Basic information about the restaurant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Restaurant Name *</Label>
                <Input name="name" required placeholder="The Golden Fork" className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Slug *</Label>
                <Input name="slug" required placeholder="the-golden-fork" className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Contact Email</Label>
                <Input name="contactEmail" type="email" placeholder="info@restaurant.com" className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Contact Phone</Label>
                <Input name="contactPhone" placeholder="+1 555 0100" className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Address</Label>
              <Input name="address" placeholder="123 Main St, City" className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Subscription Expires At</Label>
              <Input name="subscriptionExpiresAt" type="datetime-local" className="bg-slate-800/50 border-slate-700 text-white focus:border-violet-500" />
              <p className="text-xs text-slate-500">Leave blank for no expiry</p>
            </div>
          </CardContent>
        </Card>

        {/* Admin Account */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Admin Account</CardTitle>
            <CardDescription>Create the Admin account for this restaurant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Full Name *</Label>
                <Input name="adminFullName" required placeholder="John Doe" className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Username or Email *</Label>
                <Input name="adminUsername" required placeholder="john or john@email.com" className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Password *</Label>
              <Input name="adminPassword" type="password" required placeholder="min 6 characters" className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500" />
            </div>
          </CardContent>
        </Card>

        {state?.error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">{state.error}</div>
        )}
        {state?.success && (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-400">{state.success}</div>
        )}

        <Button type="submit" disabled={pending}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 shadow-lg shadow-violet-500/25 h-11">
          {pending ? 'Creating...' : 'Create Restaurant & Admin Account'}
        </Button>
      </form>
    </div>
  )
}
