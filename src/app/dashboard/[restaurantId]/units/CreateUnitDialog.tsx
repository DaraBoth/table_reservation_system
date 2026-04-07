'use client'

import { useActionState, useState, useEffect } from 'react'
import { createPhysicalTable } from '@/app/actions/tables'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Confetti } from '@/components/magicui/confetti'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getTerms } from '@/lib/business-type'

export function CreateUnitDialog({
  businessType = 'restaurant',
  restaurantId,
  zones = []
}: {
  businessType?: string
  restaurantId: string
  zones?: { id: string, name: string }[]
}) {
  const [state, action, pending] = useActionState(createPhysicalTable, null)
  const [open, setOpen] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [selectedZone, setSelectedZone] = useState<string | null>('none')
  const terms = getTerms(businessType)

  // 🎉 Success Surprise!
  useEffect(() => {
    if (state && 'success' in state && state.success) {
      setShowConfetti(true)
      setTimeout(() => {
        setOpen(false)
        setShowConfetti(false)
        setSelectedZone('none') // Reset
      }, 2000)
    }
  }, [state])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Confetti active={showConfetti} />
      <SheetTrigger
        render={
          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 shadow-lg shadow-violet-500/25 text-foreground h-12 rounded-xl text-[11px] font-black uppercase tracking-widest px-6 active:scale-95 transition-all">
            + Add {terms.unit}
          </Button>
        }
      />
      <SheetContent side="bottom" className="bg-background border-border text-foreground p-6 rounded-t-3xl h-[85vh] overflow-y-auto custom-scrollbar">
        <SheetHeader className="p-0 mb-6 font-black italic tracking-tighter uppercase">
          <SheetTitle className="text-foreground text-xl">Add New {terms.unit}</SheetTitle>
        </SheetHeader>
        <form action={action} className="space-y-6 mt-2">
          <input type="hidden" name="restaurantId" value={restaurantId} />
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-widest px-1">{terms.unit} Name *</Label>
              <Input name="tableName" required placeholder="Ex: T01, VIP Room 1..." 
                className="bg-card border-border text-foreground focus:border-violet-500 rounded-2xl h-14 text-base px-4 font-bold" />
            </div>

            {businessType !== 'mart' && (
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-widest px-1">{terms.capacityUnit} ({terms.partyUnitLower}) *</Label>
              <Input name="capacity" type="number" required min={1} defaultValue={1}
                className="bg-card border-border text-foreground focus:border-violet-500 rounded-2xl h-14 text-base px-4 font-bold" />
            </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-widest px-1">Description (Optional)</Label>
              <Textarea name="description" placeholder="Notes for staff..."
                className="bg-card border-border text-foreground focus:border-violet-500 resize-none rounded-2xl text-base p-4 min-h-[100px] font-bold" rows={3} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-widest px-1">Assignment Zone (Optional)</Label>
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <input type="hidden" name="zoneId" value={selectedZone ?? 'none'} />
                <SelectTrigger className="bg-card border-border text-foreground h-14 rounded-2xl text-base px-4 font-bold">
                  <SelectValue placeholder="No Zone (Unassigned)" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border rounded-2xl">
                  <SelectItem value="none">No Zone</SelectItem>
                  {zones.map(z => (
                    <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {state?.error && <p className="text-red-400 text-sm font-bold text-center italic">{state.error}</p>}
          {state?.success && <p className="text-emerald-400 text-sm font-bold text-center italic">{state.success}</p>}
          
          <Button type="submit" disabled={pending}
            className="w-full h-14 bg-gradient-to-r from-violet-600 to-indigo-600 border-0 text-foreground font-black rounded-2xl text-base shadow-lg shadow-violet-500/20 active:scale-95 transition-all">
            {pending ? 'Creating Infrastructure...' : `Create ${terms.unit}`}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
