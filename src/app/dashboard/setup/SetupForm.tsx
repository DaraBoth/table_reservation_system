'use client'

import { useActionState, useState } from 'react'
import { completeRestaurantSetup } from '@/app/actions/restaurants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Store, BedDouble, Hotel, CheckCircle2 } from 'lucide-react'

export function SetupForm({ restaurant }: { restaurant: any }) {
  const [state, action, pending] = useActionState(completeRestaurantSetup, null)
  const [selectedType, setSelectedType] = useState(restaurant.business_type || 'restaurant')

  const types = [
    { id: 'restaurant', label: 'Restaurant', icon: Store, desc: 'Dining, tables, & cafe' },
    { id: 'hotel',      label: 'Hotel',      icon: Hotel, desc: 'Rooms & concierge' },
    { id: 'guesthouse', label: 'Guest house', icon: BedDouble, desc: 'Simple lodging' },
  ]

  return (
    <form action={action} className="space-y-8">
      <div className="space-y-6">
        {/* Business Name */}
        <div className="space-y-3">
          <Label className="text-slate-400 text-xs font-black uppercase tracking-widest px-1">Business Name</Label>
          <Input
            name="name"
            defaultValue={restaurant.name}
            required
            placeholder="e.g. Skyline Diner"
            className="h-14 bg-slate-950 border-slate-700 text-white text-lg font-bold rounded-2xl focus:border-violet-500 transition-all placeholder:text-slate-800"
          />
        </div>

        {/* Business Type */}
        <div className="space-y-3">
          <Label className="text-slate-400 text-xs font-black uppercase tracking-widest px-1">Operational Type</Label>
          <div className="grid grid-cols-1 gap-2">
            {types.map((t) => (
              <label
                key={t.id}
                className={cn(
                  "relative flex items-center gap-4 p-4 rounded-3xl border-2 transition-all cursor-pointer",
                  selectedType === t.id 
                    ? "bg-violet-600/10 border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.1)]" 
                    : "bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40"
                )}
              >
                <input
                  type="radio"
                  name="businessType"
                  value={t.id}
                  checked={selectedType === t.id}
                  onChange={() => setSelectedType(t.id)}
                  className="absolute opacity-0"
                />
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                  selectedType === t.id ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-500"
                )}>
                  <t.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("font-black text-sm uppercase tracking-tight", selectedType === t.id ? "text-white" : "text-slate-400")}>{t.label}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 opacity-60">{t.desc}</p>
                </div>
                {selectedType === t.id && (
                  <CheckCircle2 className="w-5 h-5 text-violet-500" />
                )}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-2">
        {state?.error && <p className="text-rose-400 text-sm font-bold text-center mb-4">⚠️ {state.error}</p>}
        
        <Button
          type="submit"
          disabled={pending}
          className="w-full h-16 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 rounded-2xl font-black text-lg shadow-xl shadow-violet-500/30 transition-all active:scale-[0.98]"
        >
          {pending ? 'Initializing...' : 'Launch Dashboard'}
        </Button>
      </div>
    </form>
  )
}
