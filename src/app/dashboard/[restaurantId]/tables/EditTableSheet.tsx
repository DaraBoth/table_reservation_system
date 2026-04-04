'use client'

import { useActionState, useState } from 'react'
import { updatePhysicalTable, deletePhysicalTable } from '@/app/actions/tables'
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
  isAdmin: boolean
  trigger?: React.ReactNode
}

export function EditTableSheet({ table, businessType = 'restaurant', isAdmin, trigger }: EditTableSheetProps) {
  const [state, action, pending] = useActionState(updatePhysicalTable, null)
  const [deleteState, deleteAction, deletePending] = useActionState(deletePhysicalTable, null)
  const terms = getTerms(businessType)
  const isHotel = businessType === 'hotel' || businessType === 'guesthouse'
  const [beds, setBeds] = useState(table.capacity)
  const [isActive, setIsActive] = useState(table.is_active)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  return (
    <Sheet>
      <SheetTrigger
        render={
          (trigger as React.ReactElement) || (
            <button className="w-9 h-9 flex items-center justify-center bg-muted/50 border border-border rounded-xl text-muted-foreground hover:border-violet-500/50 hover:text-violet-400 transition-all active:scale-90">
              <Settings2 className="w-4 h-4" />
            </button>
          )
        }
      />
      <SheetContent side="bottom" className="bg-background border-border text-foreground p-6 rounded-t-3xl h-[85vh] overflow-y-auto">
        <SheetHeader className="p-0 mb-4">
          <SheetTitle className="text-foreground text-lg font-black italic tracking-tight">Edit {terms.unit}: {table.table_name}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 pb-12">
          {/* Main Update Form */}
          <form action={action} className="space-y-5">
            <input type="hidden" name="tableId" value={table.id} />
            <input type="hidden" name="restaurantId" value={table.restaurant_id ?? ''} />
            <input type="hidden" name="isActive" value={String(isActive)} />

            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-widest px-1">{terms.unit} Name *</Label>
              <Input name="tableName" required defaultValue={table.table_name}
                className="bg-card border-border text-foreground focus:border-violet-500 rounded-2xl h-14 text-base px-4" />
            </div>

            {isHotel ? (
              <div className="space-y-1.5">
                <Label className="text-foreground/70 text-sm font-bold uppercase tracking-widest px-1">Number of {terms.capacityUnit} *</Label>
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
                          : "border-border bg-background text-muted-foreground hover:border-border"
                      )}
                    >
                      {num} {num === 1 ? terms.capacityUnit.replace(/s$/i, '') : terms.capacityUnit}
                    </button>
                  ))}
                </div>
                <input type="hidden" name="capacity" value={beds} />
              </div>
            ) : (
              <div className="space-y-1.5">
              <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-widest px-1">{terms.capacityUnit} ({terms.partyUnitLower}) *</Label>
              <Input name="capacity" type="number" required min={1} defaultValue={table.capacity}
                className="bg-card border-border text-foreground focus:border-violet-500 rounded-2xl h-14 text-base px-4" />
            </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-widest px-1">Description</Label>
              <Textarea name="description" defaultValue={table.description || ''}
                className="bg-card border-border text-foreground focus:border-violet-500 resize-none rounded-2xl text-base p-4 min-h-[100px]" rows={3} />
            </div>

            {/* Active Status Toggle */}
            <div className="flex items-center justify-between p-4 bg-background/50 border border-border rounded-2xl">
              <div>
                <p className="text-sm font-bold text-foreground">Active Status</p>
                <p className="text-xs text-muted-foreground">Enable or disable this {terms.unitLower} for {terms.bookingsLower}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative focus:outline-none",
                  isActive ? "bg-emerald-500" : "bg-muted"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                  isActive ? "left-7" : "left-1"
                )} />
              </button>
            </div>

            {state?.error && <p className="text-red-400 text-sm text-center font-bold">{state.error}</p>}
            {state?.success && <p className="text-emerald-400 text-sm text-center font-bold">{state.success}</p>}

            <Button type="submit" disabled={pending || deletePending}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 border-0 h-14 rounded-2xl font-black text-base shadow-lg shadow-violet-500/20">
              {pending ? 'Saving Changes...' : `Update ${terms.unit}`}
            </Button>
          </form>

          {/* Danger Zone for Admins - Kept outside main form to fix nesting */}
          {isAdmin && (
            <div className="pt-6 border-t border-border space-y-4">
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] px-1">Danger Zone</p>

              {!showConfirmDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowConfirmDelete(true)}
                  className="w-full h-12 rounded-2xl border border-rose-500/20 text-rose-400 font-bold hover:bg-rose-500/10 hover:text-rose-400 transition-all"
                >
                  Delete {terms.unit}
                </Button>
              ) : (
                <div className="space-y-4 p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowConfirmDelete(false)}
                      className="flex-1 h-12 rounded-2xl bg-muted text-foreground/70 font-bold border-0"
                    >
                      Cancel
                    </Button>
                    <form action={deleteAction} className="flex-1">
                      <input type="hidden" name="tableId" value={table.id} />
                      <input type="hidden" name="restaurantId" value={table.restaurant_id ?? ''} />
                      <Button
                        type="submit"
                        disabled={deletePending}
                        className="w-full h-12 rounded-2xl bg-rose-600 text-foreground font-black hover:bg-rose-700 border-0 shadow-lg shadow-rose-900/20"
                      >
                        {deletePending ? 'Deleting...' : 'Confirm'}
                      </Button>
                    </form>
                  </div>
                  {deleteState?.error && (
                    <p className="text-rose-400 text-xs text-center font-bold px-2 py-1 bg-rose-500/10 rounded-lg">
                      {deleteState.error}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
