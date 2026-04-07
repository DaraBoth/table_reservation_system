'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, 
  SheetDescription, SheetTrigger, SheetFooter
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Plus, Settings2, Trash2,
  Layers, Save, X, ArrowUp, ArrowDown, Search
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Zone {
  id: string
  name: string
  sort_order: number
}

interface Props {
  restaurantId: string
  onUpdate?: () => void
  trigger?: React.ReactNode
}

export function ZoneManagementDialog({ restaurantId, onUpdate, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [zones, setZones] = useState<Zone[]>([])
  const [newName, setNewName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const supabase = createClient()
  const latestZonesRef = useRef<Zone[]>([])
  const persistedOrderRef = useRef('')

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const fetchZones = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('sort_order', { ascending: true })
    
    if (error) {
      toast.error('Failed to load zones')
    } else {
      const nextZones = data || []
      setZones(nextZones)
      latestZonesRef.current = nextZones
      persistedOrderRef.current = nextZones.map(zone => zone.id).join('|')
    }
    setLoading(false)
  }, [restaurantId, supabase])

  const persistZoneOrder = useCallback(async () => {
    const currentZones = latestZonesRef.current
    const nextOrder = currentZones.map(zone => zone.id).join('|')

    if (!currentZones.length || nextOrder === persistedOrderRef.current) {
      return
    }

    const updateResults = await Promise.all(
      currentZones.map((zone, index) =>
        supabase
          .from('zones')
          .update({ sort_order: index })
          .eq('id', zone.id)
          .eq('restaurant_id', restaurantId)
      )
    )

    const firstError = updateResults.find((result) => result.error)?.error

    if (firstError) {
      toast.error(firstError.message || 'Failed to save order')
      await fetchZones()
      return
    }

    persistedOrderRef.current = nextOrder
    onUpdate?.()
  }, [fetchZones, onUpdate, restaurantId, supabase])

  useEffect(() => {
    const load = async () => {
      if (open) await fetchZones()
    }
    void load()
  }, [open, fetchZones])

  const handleAdd = async () => {
    if (!newName.trim()) return
    setLoading(true)
    const maxOrder = zones.length > 0 ? Math.max(...zones.map(z => z.sort_order)) : 0
    
    const { error } = await supabase
      .from('zones')
      .insert({
        name: newName.trim(),
        restaurant_id: restaurantId,
        sort_order: maxOrder + 1
      })
      .select()
      .single()

    if (error) {
      toast.error('Failed to create zone')
    } else {
      toast.success('Zone created')
      setNewName('')
      await fetchZones()
      await onUpdate?.()
    }
    setLoading(false)
  }

  const handleUpdateName = async (id: string) => {
    if (!editName.trim()) return
    setLoading(true)
    const { error } = await supabase
      .from('zones')
      .update({ name: editName.trim() })
      .eq('id', id)

    if (error) {
      toast.error('Failed to update zone')
    } else {
      toast.success('Zone updated')
      setEditingId(null)
      await fetchZones()
      await onUpdate?.()
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? Units in this zone will be unassigned.')) return
    setLoading(true)
    const { error } = await supabase.from('zones').delete().eq('id', id)

    if (error) {
      toast.error('Failed to delete zone')
    } else {
      toast.success('Zone deleted')
      await fetchZones()
      await onUpdate?.()
    }
    setLoading(false)
  }

  const moveZone = async (zoneId: string, direction: 'up' | 'down') => {
    const currentIndex = zones.findIndex(zone => zone.id === zoneId)
    if (currentIndex === -1) return

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= zones.length) return

    const nextZones = [...zones]
    const [movedZone] = nextZones.splice(currentIndex, 1)
    nextZones.splice(targetIndex, 0, movedZone)

    setZones(nextZones)
    latestZonesRef.current = nextZones
    await persistZoneOrder()
  }

  const filteredZones = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return zones
    return zones.filter((zone) => zone.name.toLowerCase().includes(query))
  }, [searchQuery, zones])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        nativeButton
        render={
          (trigger as React.ReactElement) || (
            <Button variant="outline" className="h-10 px-4 bg-card border border-border rounded-xl text-foreground/70 text-[10px] font-black uppercase tracking-widest hover:border-violet-500/50 hover:text-violet-300 transition-all shadow-lg gap-2">
              <Layers className="w-4 h-4" /> Manage Zones
            </Button>
          )
        }
      />
      <SheetContent 
        side={isMobile ? "bottom" : "right"} 
        className={cn(
          "bg-background border-border text-foreground p-0 overflow-hidden",
          isMobile ? "rounded-t-[2rem] h-[82vh]" : "sm:max-w-md h-full border-l"
        )}
      >
        <div className="flex flex-col h-full bg-background/40">
          <SheetHeader className={cn("text-left border-b border-border/50", isMobile ? "p-5 pb-3" : "p-8 pb-4")}>
            <SheetTitle className="text-lg sm:text-xl font-black uppercase italic tracking-tighter">Zones</SheetTitle>
            <SheetDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed mt-1">
              Group your tables by area.
            </SheetDescription>
          </SheetHeader>

          <div className={cn("flex-1 overflow-y-auto overscroll-contain custom-scrollbar space-y-6", isMobile ? "p-4" : "p-8")}>
            <div className="space-y-2.5">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">Add Zone</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Zone name" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-11 bg-card/70 border-border rounded-2xl font-semibold px-4 text-sm"
                />
                <Button 
                  type="button"
                  onClick={handleAdd} 
                  disabled={loading || !newName.trim()}
                  className="h-11 px-4 rounded-2xl bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-500/20 text-[10px] font-black uppercase tracking-[0.18em]"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
            </div>

            <div className="space-y-3">
               <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">Zones</Label>
               {zones.length > 4 && (
                 <div className="relative">
                   <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
                   <Input
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="Search zones"
                     className="h-10 rounded-2xl border-border bg-card/50 pl-9 pr-4 text-sm font-medium"
                   />
                 </div>
               )}
               <div className="flex items-center justify-between px-1">
                 <span className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground/50">
                   {filteredZones.length === zones.length ? `${zones.length} total` : `${filteredZones.length} of ${zones.length}`}
                 </span>
                 {searchQuery && (
                   <button
                     type="button"
                     onClick={() => setSearchQuery('')}
                     className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-400"
                   >
                     Clear
                   </button>
                 )}
               </div>
               <div className="space-y-2.5">
                 {filteredZones.map((zone) => {
                   const index = zones.findIndex((item) => item.id === zone.id)
                   return (
                   <div 
                     key={zone.id}
                     className="group flex items-center gap-2 p-2.5 bg-card/40 border border-border rounded-2xl hover:border-violet-500/30 transition-all"
                   >
                     <div className="flex flex-col items-center gap-1.5">
                       <Button
                         type="button"
                         variant="ghost"
                         disabled={loading || index === 0}
                         onClick={() => { void moveZone(zone.id, 'up') }}
                         className="h-7 w-7 rounded-lg border border-border bg-background/70 p-0 text-muted-foreground hover:border-violet-500/50 hover:text-violet-400 disabled:opacity-30 disabled:hover:border-border"
                       >
                         <ArrowUp className="w-3 h-3" />
                       </Button>
                       <Button
                         type="button"
                         variant="ghost"
                         disabled={loading || index === zones.length - 1}
                         onClick={() => { void moveZone(zone.id, 'down') }}
                         className="h-7 w-7 rounded-lg border border-border bg-background/70 p-0 text-muted-foreground hover:border-violet-500/50 hover:text-violet-400 disabled:opacity-30 disabled:hover:border-border"
                       >
                         <ArrowDown className="w-3 h-3" />
                       </Button>
                     </div>

                     {editingId === zone.id ? (
                       <div className="flex-1 flex gap-2">
                         <Input 
                           autoFocus
                           value={editName}
                           onChange={(e) => setEditName(e.target.value)}
                           className="h-8 bg-background border-border rounded-xl text-sm font-semibold"
                           onKeyDown={(e) => e.key === 'Enter' && handleUpdateName(zone.id)}
                         />
                         <Button type="button" size="icon" variant="ghost" onClick={() => handleUpdateName(zone.id)} className="h-8 w-8 text-emerald-400">
                           <Save className="w-4 h-4" />
                         </Button>
                         <Button type="button" size="icon" variant="ghost" onClick={() => setEditingId(null)} className="h-8 w-8 text-rose-400">
                           <X className="w-4 h-4" />
                         </Button>
                       </div>
                     ) : (
                       <>
                         <div className="flex-1 min-w-0">
                           <span className="block text-sm font-bold truncate italic uppercase tracking-tight">{zone.name}</span>
                           <span className="block mt-0.5 text-[8px] font-black text-muted-foreground/50 uppercase tracking-[0.18em]">Position {index + 1}</span>
                         </div>
                         <div className="flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                           <Button 
                             type="button"
                             size="icon" variant="ghost" 
                             onClick={() => { setEditingId(zone.id); setEditName(zone.name); }}
                             className="h-7 w-7 rounded-lg border border-border bg-background/60 text-muted-foreground hover:border-violet-500/50 hover:text-violet-400"
                           >
                             <Settings2 className="w-3 h-3" />
                           </Button>
                           <Button 
                             type="button"
                             id={`delete-zone-${zone.id}`}
                             size="icon" variant="ghost" 
                             onClick={() => handleDelete(zone.id)}
                             className="h-7 w-7 rounded-lg border border-border bg-background/60 text-muted-foreground hover:border-rose-500/40 hover:text-rose-400"
                           >
                             <Trash2 className="w-3 h-3" />
                           </Button>
                         </div>
                       </>
                     )}
                   </div>
                 )})}
                
                {zones.length === 0 && !loading && (
                  <div className="text-center py-14 bg-muted/10 border border-dashed border-border rounded-2xl opacity-50">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">No zones yet</p>
                  </div>
                )}
                {zones.length > 0 && filteredZones.length === 0 && !loading && (
                  <div className="text-center py-14 bg-muted/10 border border-dashed border-border rounded-2xl opacity-60">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">No matches</p>
                  </div>
                )}
               </div>
            </div>
          </div>
          
          <SheetFooter className={cn("bg-card/5 border-t border-border/50 mt-auto", isMobile ? "p-4" : "p-8")}>
             <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground rounded-2xl" onClick={() => setOpen(false)}>
                Done
             </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
