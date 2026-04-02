'use client'

import { useActionState, useState } from 'react'
import { createPhysicalTable } from '@/app/actions/tables'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { getTerms } from '@/lib/business-type'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'
import { Confetti } from '@/components/magicui/confetti'

export function CreateTableDialog({ businessType = 'restaurant' }: { businessType?: string }) {
  const [state, action, pending] = useActionState(createPhysicalTable, null)
  const [open, setOpen] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const terms = getTerms(businessType)
  const isHotel = businessType === 'hotel' || businessType === 'guesthouse'
  const [beds, setBeds] = useState(1)

  // 🎉 Success Surprise!
  useEffect(() => {
    if (state && 'success' in state && state.success) {
      setShowConfetti(true)
      setTimeout(() => {
        setOpen(false)
        setShowConfetti(false)
      }, 2000)
    }
  }, [state])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Confetti active={showConfetti} />
      <SheetTrigger
        render={
          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 shadow-lg shadow-violet-500/25 text-white">
            + Add {terms.unit}
          </Button>
        }
      />
      <SheetContent side="bottom" className="bg-slate-900 border-slate-800 text-white p-6 rounded-t-3xl">
        <SheetHeader className="p-0 mb-4">
          <SheetTitle className="text-white text-lg font-black italic tracking-tight">Add New {terms.unit}</SheetTitle>
        </SheetHeader>
        <form action={action} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm">{terms.unit} Name *</Label>
            <Input name="tableName" required placeholder={businessType === 'restaurant' ? "Table 1, Window Booth..." : "Room 101, Suite A..."}
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500" />
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
              <Label className="text-slate-300 text-sm">Capacity *</Label>
              <Input name="capacity" type="number" required min={1} defaultValue={4}
                className="bg-slate-800/50 border-slate-700 text-white focus:border-violet-500" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm">Description</Label>
            <Textarea name="description" placeholder="Near window, outdoor..."
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 resize-none" rows={2} />
          </div>
          {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}
          {state?.success && <p className="text-emerald-400 text-sm">{state.success}</p>}
          <Button type="submit" disabled={pending}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 border-0 text-white font-black">
            {pending ? 'Creating...' : `Create ${terms.unit}`}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
