'use client'

import React, { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updatePhysicalTable, deletePhysicalTable } from '@/app/actions/tables'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { getTerms } from '@/lib/business-type'
import { cn } from '@/lib/utils'
import { Settings2 } from 'lucide-react'
import type { Tables } from '@/lib/types/database'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTranslation } from 'react-i18next'

interface EditUnitSheetProps {
  table: Tables<'physical_tables'>
  businessType?: string
  canManage: boolean
  trigger?: React.ReactNode
  zones?: { id: string, name: string }[]
}

export function EditUnitSheet({ table, businessType = 'restaurant', canManage, trigger, zones = [] }: EditUnitSheetProps) {
  const { t } = useTranslation()
  const [state, action, pending] = useActionState(updatePhysicalTable, null)
  const [deleteState, deleteAction, deletePending] = useActionState(deletePhysicalTable, null)
  const router = useRouter()
  const terms = getTerms(businessType)
  const isHotel = businessType === 'hotel' || businessType === 'guesthouse'
  const [beds, setBeds] = useState(table.capacity)
  const [isActive, setIsActive] = useState(table.is_active)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [open, setOpen] = useState(false)
  const [selectedZone, setSelectedZone] = useState<string | null>(table.zone_id || 'none')
  const selectedZoneLabel = selectedZone === 'none'
    ? t('dashboard.noZone', { defaultValue: 'No Zone' })
    : zones.find(zone => zone.id === selectedZone)?.name || t('dashboard.selectZone', { defaultValue: 'Select Zone' })

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  React.useEffect(() => {
    if (!state?.success) return

    const frame = window.requestAnimationFrame(() => {
      setOpen(false)
      router.refresh()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [router, state])

  React.useEffect(() => {
    if (!deleteState?.success) return

    const frame = window.requestAnimationFrame(() => {
      setShowConfirmDelete(false)
      setOpen(false)
      router.refresh()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [deleteState, router])

  return (
    <Sheet key={table.id} open={open} onOpenChange={setOpen}>
      <SheetTrigger
        nativeButton
        render={
          (trigger as React.ReactElement) || (
            <button type="button" className="w-9 h-9 flex items-center justify-center bg-muted/50 border border-border rounded-xl text-muted-foreground hover:border-violet-500/50 hover:text-violet-400 transition-all active:scale-90">
              <Settings2 className="w-4 h-4" />
            </button>
          )
        }
      />
      <SheetContent 
        side={isMobile ? "bottom" : "right"} 
        className={cn(
          "bg-background border-border text-foreground overflow-y-auto custom-scrollbar",
          isMobile ? "rounded-t-[2rem] h-[78vh] p-4" : "sm:max-w-md h-full border-l p-6"
        )}
      >
        <SheetHeader className={cn("p-0 font-black italic tracking-tighter uppercase", isMobile ? "mb-4" : "mb-6")}>
          <SheetTitle className={cn("text-foreground", isMobile ? "text-lg" : "text-xl")}>{t('dashboard.editUnit', { defaultValue: 'Edit {{unit}}', unit: terms.unit })}: {table.table_name}</SheetTitle>
        </SheetHeader>

        <div className={cn("pb-8", isMobile ? "space-y-4" : "space-y-6 pb-12")}>
          {/* Main Update Form */}
          <form action={action} className={cn(isMobile ? "space-y-4" : "space-y-5")}>
            <input type="hidden" name="tableId" value={table.id} />
            <input type="hidden" name="restaurantId" value={table.restaurant_id ?? ''} />
            <input type="hidden" name="isActive" value={String(isActive)} />

            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-widest px-1">{terms.unit} Name *</Label>
              <Input name="tableName" required defaultValue={table.table_name}
                className={cn("bg-card border-border text-foreground focus:border-violet-500 rounded-2xl px-4", isMobile ? "h-12 text-sm" : "h-14 text-base")} />
            </div>

            {isHotel ? (
              <div className="space-y-1.5">
                <Label className="text-foreground/70 text-sm font-bold uppercase tracking-widest px-1">{t('dashboard.numberOfCapacityUnit', { defaultValue: 'Number of {{capacityUnit}} *', capacityUnit: terms.capacityUnit })}</Label>
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
                className={cn("bg-card border-border text-foreground focus:border-violet-500 rounded-2xl px-4", isMobile ? "h-12 text-sm" : "h-14 text-base")} />
            </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-widest px-1">{t('dashboard.description', { defaultValue: 'Description' })}</Label>
              <Textarea name="description" defaultValue={table.description || ''}
                className={cn("bg-card border-border text-foreground focus:border-violet-500 resize-none rounded-2xl p-4", isMobile ? "text-sm min-h-[84px]" : "text-base min-h-[100px]")} rows={3} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-widest px-1">{t('dashboard.assignmentZoneOptional', { defaultValue: 'Assignment Zone (Optional)' })}</Label>
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <input type="hidden" name="zoneId" value={selectedZone === 'none' ? '' : (selectedZone ?? '')} />
                <SelectTrigger className={cn("w-full bg-card border-border text-foreground rounded-2xl px-4 font-semibold shadow-sm", isMobile ? "h-12 text-sm" : "h-14 text-base")}>
                  <SelectValue>{selectedZoneLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background/95 border-border rounded-2xl p-1 shadow-2xl backdrop-blur-md">
                  <SelectItem value="none" className="min-h-11 rounded-xl px-3 font-semibold">{t('dashboard.noZone', { defaultValue: 'No Zone' })}</SelectItem>
                  {zones.map(z => (
                    <SelectItem key={z.id} value={z.id} className="min-h-11 rounded-xl px-3 font-semibold">{z.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Status Toggle */}
            <div className={cn("flex items-center justify-between bg-background/50 border border-border rounded-2xl", isMobile ? "p-3" : "p-4")}>
              <div>
                <p className="text-sm font-bold text-foreground">{t('dashboard.activeStatus', { defaultValue: 'Active Status' })}</p>
                <p className="text-xs text-muted-foreground">{t('dashboard.enableDisableUnitForBookings', { defaultValue: 'Enable or disable this {{unitLower}} for {{bookingsLower}}', unitLower: terms.unitLower, bookingsLower: terms.bookingsLower })}</p>
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
              className={cn("w-full bg-gradient-to-r from-violet-600 to-indigo-600 border-0 rounded-2xl font-black shadow-lg shadow-violet-500/20", isMobile ? "h-12 text-sm" : "h-14 text-base")}>
              {pending ? t('dashboard.savingChanges', { defaultValue: 'Saving Changes...' }) : t('dashboard.updateUnit', { defaultValue: 'Update {{unit}}', unit: terms.unit })}
            </Button>
          </form>

          {/* Danger Zone for Admins - Kept outside main form to fix nesting */}
          {canManage && (
            <div className={cn("border-t border-border", isMobile ? "pt-4 space-y-3" : "pt-6 space-y-4")}>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] px-1">{t('dashboard.dangerZone', { defaultValue: 'Danger Zone' })}</p>

              {!showConfirmDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowConfirmDelete(true)}
                  className={cn("w-full rounded-2xl border border-rose-500/20 text-rose-400 font-bold hover:bg-rose-500/10 hover:text-rose-400 transition-all", isMobile ? "h-11" : "h-12")}
                >
                  {t('dashboard.deleteUnit', { defaultValue: 'Delete {{unit}}', unit: terms.unit })}
                </Button>
              ) : (
                <div className={cn("bg-rose-500/5 border border-rose-500/10 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-300", isMobile ? "space-y-3 p-3" : "space-y-4 p-4")}>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowConfirmDelete(false)}
                      className={cn("flex-1 rounded-2xl bg-muted text-foreground/70 font-bold border-0", isMobile ? "h-11" : "h-12")}
                    >
                      {t('common.cancel', { defaultValue: 'Cancel' })}
                    </Button>
                    <form action={deleteAction} className="flex-1">
                      <input type="hidden" name="tableId" value={table.id} />
                      <input type="hidden" name="restaurantId" value={table.restaurant_id ?? ''} />
                      <Button
                        type="submit"
                        disabled={deletePending}
                        className={cn("w-full rounded-2xl bg-rose-600 text-foreground font-black hover:bg-rose-700 border-0 shadow-lg shadow-rose-900/20", isMobile ? "h-11" : "h-12")}
                      >
                        {deletePending ? t('dashboard.deleting', { defaultValue: 'Deleting...' }) : t('dashboard.confirm', { defaultValue: 'Confirm' })}
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
