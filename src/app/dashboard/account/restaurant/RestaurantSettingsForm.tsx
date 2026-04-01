'use client'

import { useActionState } from 'react'
import { updateOwnRestaurantInfo } from '@/app/actions/restaurants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function RestaurantSettingsForm({ restaurant }: { restaurant: any }) {
  const [state, action, pending] = useActionState(updateOwnRestaurantInfo, null)

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-4">
        {/* Basic Info */}
        <div className="space-y-2">
          <Label className="text-slate-500 text-[10px] font-black uppercase tracking-widest px-1">Business Name</Label>
          <Input
            name="name"
            defaultValue={restaurant.name}
            required
            className="h-12 bg-slate-950 border-slate-700 text-white font-bold rounded-xl focus:border-violet-500 shadow-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-500 text-[10px] font-black uppercase tracking-widest px-1">Email Address</Label>
            <Input
              name="contactEmail"
              type="email"
              defaultValue={restaurant.contact_email}
              className="h-12 bg-slate-950 border-slate-700 text-white font-bold rounded-xl focus:border-violet-500 shadow-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-500 text-[10px] font-black uppercase tracking-widest px-1">Phone Number</Label>
            <Input
              name="contactPhone"
              defaultValue={restaurant.contact_phone}
              className="h-12 bg-slate-950 border-slate-700 text-white font-bold rounded-xl focus:border-violet-500 shadow-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-500 text-[10px] font-black uppercase tracking-widest px-1">Physical Address</Label>
          <Input
            name="address"
            defaultValue={restaurant.address}
            className="h-12 bg-slate-950 border-slate-700 text-white font-bold rounded-xl focus:border-violet-500 shadow-sm"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-500 text-[10px] font-black uppercase tracking-widest px-1">Logo URL</Label>
          <Input
            name="logoUrl"
            defaultValue={restaurant.logo_url}
            placeholder="https://example.com/logo.png"
            className="h-12 bg-slate-950 border-slate-700 text-white font-bold rounded-xl focus:border-violet-500 shadow-sm"
          />
        </div>
      </div>

      <div className="pt-2">
        {state?.error && <p className="text-rose-400 text-sm font-bold px-1 mb-3 animate-in fade-in slide-in-from-top-1">⚠️ {state.error}</p>}
        {state?.success && <p className="text-emerald-400 text-sm font-bold px-1 mb-3 animate-in fade-in slide-in-from-top-1">✅ {state.success}</p>}
        
        <Button
          type="submit"
          disabled={pending}
          className="w-full h-14 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 rounded-2xl font-black text-base shadow-lg shadow-violet-500/20 active:scale-[0.98] transition-all"
        >
          {pending ? 'Saving Changes...' : 'Save Profile'}
        </Button>
      </div>
    </form>
  )
}
