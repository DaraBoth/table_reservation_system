'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, 
  SheetDescription, SheetTrigger, SheetFooter
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Plus, Settings2, Trash2, GripVertical, 
  Layers, Save, X, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, Reorder } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Zone {
  id: string
  name: string
  sort_order: number
}

interface Props {
  restaurantId: string
  onUpdate?: () => void
}

export function ZoneManagementDialog({ restaurantId, onUpdate }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [zones, setZones] = useState<Zone[]>([])
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const supabase = createClient()

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const fetchZones = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('sort_order', { ascending: true })
    
    if (error) {
      toast.error('Failed to load zones')
    } else {
      setZones(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (open) fetchZones()
  }, [open])

  const handleAdd = async () => {
    if (!newName.trim()) return
    setLoading(true)
    const maxOrder = zones.length > 0 ? Math.max(...zones.map(z => z.sort_order)) : 0
    
    const { data, error } = await supabase
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
      fetchZones()
      onUpdate?.()
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
      fetchZones()
      onUpdate?.()
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
      fetchZones()
      onUpdate?.()
    }
    setLoading(false)
  }

  const handleReorder = async (newZones: Zone[]) => {
    setZones(newZones)
    const updates = newZones.map((z, index) => ({
      id: z.id,
      restaurant_id: restaurantId,
      name: z.name,
      sort_order: index
    }))

    const { error } = await supabase
      .from('zones')
      .upsert(updates)

    if (error) {
      toast.error('Failed to save order')
    } else {
      onUpdate?.()
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" className="h-10 px-4 bg-card border border-border rounded-xl text-foreground/70 text-[10px] font-black uppercase tracking-widest hover:border-violet-500/50 hover:text-violet-300 transition-all shadow-lg gap-2">
            <Layers className="w-4 h-4" /> Manage Zones
          </Button>
        }
      />
      <SheetContent 
        side={isMobile ? "bottom" : "right"} 
        className={cn(
          "bg-background border-border text-foreground p-0 overflow-hidden",
          isMobile ? "rounded-t-[2.5rem] h-[85vh]" : "sm:max-w-md h-full border-l"
        )}
      >
        <div className="flex flex-col h-full bg-background/40">
          <SheetHeader className="p-8 pb-4 text-left border-b border-border/50">
            <SheetTitle className="text-xl font-black uppercase italic tracking-tighter">Zone Management</SheetTitle>
            <SheetDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed mt-1">
              Organize your infrastructure into logical areas (VIP, Outdoor, Floor 1)
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
            <div className="space-y-3">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">Quick Add</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="New Zone Name..." 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-12 bg-card border-border rounded-xl font-bold px-4"
                />
                <Button 
                  onClick={handleAdd} 
                  disabled={loading || !newName.trim()}
                  className="h-12 w-12 rounded-xl bg-violet-600 hover:bg-violet-500 p-0 shadow-lg shadow-violet-500/20"
                >
                  <Plus className="w-6 h-6" />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
               <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">Active Zones (Drag to reorder)</Label>
               <div className="space-y-2">
                <Reorder.Group axis="y" values={zones} onReorder={handleReorder} className="space-y-2">
                  {zones.map((zone) => (
                    <Reorder.Item 
                      key={zone.id} 
                      value={zone}
                      className="group flex items-center gap-3 p-4 bg-card/40 border border-border rounded-2xl hover:border-violet-500/30 transition-all cursor-grab active:cursor-grabbing"
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground/40 group-hover:text-violet-400" />
                      
                      {editingId === zone.id ? (
                        <div className="flex-1 flex gap-2">
                          <Input 
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-9 bg-background border-border rounded-lg text-sm font-bold"
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateName(zone.id)}
                          />
                          <Button size="icon" variant="ghost" onClick={() => handleUpdateName(zone.id)} className="h-9 w-9 text-emerald-400">
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} className="h-9 w-9 text-rose-400">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="flex-1 text-sm font-bold truncate italic uppercase tracking-tight">{zone.name}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              size="icon" variant="ghost" 
                              onClick={() => { setEditingId(zone.id); setEditName(zone.name); }}
                              className="h-8 w-8 text-muted-foreground hover:text-violet-400"
                            >
                              <Settings2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              id={`delete-zone-${zone.id}`}
                              size="icon" variant="ghost" 
                              onClick={() => handleDelete(zone.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </>
                      )}
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
                
                {zones.length === 0 && !loading && (
                  <div className="text-center py-20 bg-muted/10 border border-dashed border-border rounded-2xl opacity-40">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Architecture Empty</p>
                  </div>
                )}
               </div>
            </div>
          </div>
          
          <SheetFooter className="p-8 bg-card/5 border-t border-border/50 mt-auto">
             <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>
                Done Managing
             </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
