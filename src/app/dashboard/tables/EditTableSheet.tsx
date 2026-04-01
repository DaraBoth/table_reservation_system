'use client'

import { useActionState, useState } from 'react'
import { updatePhysicalTable } from '@/app/actions/tables'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { getTerms } from '@/lib/business-type'
import { cn } from '@/lib/utils'
import { Settings2, Pencil } from 'lucide-react'
import type { Tables } from '@/lib/types/database'

interface EditTableSheetProps {
  table: Tables<'physical_tables'>
  businessType?: string
}

export function EditTableSheet({ table, businessType = 'restaurant' }: EditTableSheetProps) {
  const [state, action, pending] = useActionState(updatePhysicalTable, null)
  const terms = getTerms(businessType)
  const isHotel = businessType === 'hotel' || businessType === 'guesthouse'
  const [beds, setBeds] = useState(table.capacity)
  const [isActive, setIsActive] = useState(table.is_active)

  return (
    <Sheet>
      <SheetTrigger
        render={
          <button className="w-7 h-7 flex items-center justify-center bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 hover:border-violet-500/50 hover:text-violet-400 transition-all active:scale-90">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        }
      />
      <SheetContent side="bottom" className="bg-slate-900 border-slate-800 text-white p-6 rounded-t-3xl">
        <SheetHeader className="p-0 mb-4">
          <SheetTitle className="text-white text-lg font-black italic tracking-tight">Edit {terms.unit}: {table.table_name}</SheetTitle>
        </SheetHeader>
        
        <form action={action} className="space-y-5 mt-2">
          <input type="hidden" name="tableId" value={table.id} />
          <input type="hidden" name="isActive" value={String(isActive)} />

          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm">{terms.unit} Name *</Label>
            <Input name="tableName" required defaultValue={table.table_name}
              className="bg-slate-800/50 border-slate-700 text-white focus:border-violet-500" />
          </div>

          {isHotel ? (
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Number of Beds *</Label>
              <div className="flex gap-2">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setBeds(num)}
                    className={cn(
                      "flex-1 h-12 rounded-xl border-2 font-bold transition-all",
                      beds === num 
                        ? "border-violet-500 bg-violet-500/10 text-violet-400" 
                        : "border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-700"
                    )}
                  >
                    {num} {num === 1 ? 'Bed' : 'Beds'}
                  </button>
                ))}
              </div>
              <input type="hidden" name="capacity" value={beds} />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Capacity (people) *</Label>
              <Input name="capacity" type="number" required min={1} defaultValue={table.capacity}
                className="bg-slate-800/50 border-slate-700 text-white focus:border-violet-500" />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm">Description</Label>
            <Textarea name="description" defaultValue={table.description || ''}
              className="bg-slate-800/50 border-slate-700 text-white focus:border-violet-500 resize-none" rows={2} />
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
            <div>
              <p className="text-sm font-bold text-white">Active Status</p>
              <p className="text-xs text-slate-500">Enable or disable this room for bookings</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                isActive ? "bg-emerald-500" : "bg-slate-700"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                isActive ? "left-7" : "left-1"
              )} />
            </button>
          </div>

          {state?.error && <p className="text-red-400 text-sm text-center">{state.error}</p>}
          {state?.success && <p className="text-emerald-400 text-sm text-center">{state.success}</p>}
          
          <Button type="submit" disabled={pending}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 border-0 h-12 rounded-2xl font-black text-base shadow-lg shadow-violet-500/20">
            {pending ? 'Saving...' : `Update ${terms.unit}`}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
