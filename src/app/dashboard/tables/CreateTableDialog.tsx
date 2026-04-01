'use client'

import { useActionState } from 'react'
import { createPhysicalTable } from '@/app/actions/tables'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { getTerms } from '@/lib/business-type'

export function CreateTableDialog({ businessType = 'restaurant' }: { businessType?: string }) {
  const [state, action, pending] = useActionState(createPhysicalTable, null)
  const terms = getTerms(businessType)

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 shadow-lg shadow-violet-500/25">
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
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm">Capacity *</Label>
            <Input name="capacity" type="number" required min={1} defaultValue={4}
              className="bg-slate-800/50 border-slate-700 text-white focus:border-violet-500" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm">Description</Label>
            <Textarea name="description" placeholder="Near window, outdoor..."
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 resize-none" rows={2} />
          </div>
          {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}
          {state?.success && <p className="text-emerald-400 text-sm">{state.success}</p>}
          <Button type="submit" disabled={pending}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 border-0">
            {pending ? 'Creating...' : `Create ${terms.unit}`}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
