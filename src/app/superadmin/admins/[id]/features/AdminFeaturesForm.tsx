'use client'

import { useState, useTransition } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { updateSpecialAdminStatus } from '@/app/actions/memberships'
import { toast } from 'sonner'
import { ShieldCheck, Zap, Star, LayoutGrid, PlusCircle, Save, Loader2, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button-variants'

interface AdminFeaturesFormProps {
  membershipId: string
  name: string
  property: string
  initialIsSpecial: boolean
  initialFeatures: string[]
}

const AVAILABLE_FEATURES = [
  { 
    id: 'create_restaurant', 
    label: 'Multi-Brand Expansion', 
    description: 'Allows this admin to create and manage their own portfolio of properties independently.',
    icon: PlusCircle 
  },
  { 
    id: 'analytics_pro', 
    label: 'Advanced Intelligence', 
    description: 'Access to cross-property analytics and enterprise-grade reporting modules.',
    icon: LayoutGrid 
  },
]

export default function AdminFeaturesForm({ 
  membershipId, 
  name, 
  property,
  initialIsSpecial, 
  initialFeatures 
}: AdminFeaturesFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isSpecial, setIsSpecial] = useState(initialIsSpecial)
  
  // Normalize features to a JSON object
  const [features, setFeatures] = useState<Record<string, any>>(() => {
    if (Array.isArray(initialFeatures)) {
      return initialFeatures.reduce((acc, f) => ({ ...acc, [f]: {} }), {})
    }
    return initialFeatures || {}
  })

  const toggleFeature = (id: string) => {
    setFeatures(prev => {
      const next = { ...prev }
      if (id in next) {
        delete next[id]
      } else {
        next[id] = id === 'create_restaurant' ? { max_brands: 1 } : {}
      }
      return next
    })
  }

  const updateFeatureConfig = (id: string, config: any) => {
    setFeatures(prev => ({
      ...prev,
      [id]: { ...prev[id], ...config }
    }))
  }

  async function handleSave() {
    const formData = new FormData()
    formData.append('membershipId', membershipId)
    formData.append('isSpecial', isSpecial.toString())
    formData.append('features', JSON.stringify(features))

    startTransition(async () => {
      const result = await updateSpecialAdminStatus({ success: '', error: '' }, formData)
      if (result?.error) {
        toast.error(result.error)
      } else if (result?.success) {
        toast.success(result.success)
        router.refresh()
        router.push('/superadmin/admins')
      }
    })
  }

  return (
    <div className="space-y-4 pb-10">
      
      {/* Compressed Header with Top-Right Save */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/superadmin/admins"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              "w-8 h-8 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 border border-border"
            )}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-foreground uppercase tracking-tight">Entitlements</h1>
            <p className="text-[10px] text-muted-foreground font-medium">
              Identity: <span className="text-foreground font-black">{name}</span> at <span className="text-foreground font-bold">{property}</span>
            </p>
          </div>
        </div>

        <Button 
          onClick={handleSave}
          disabled={isPending}
          className="h-9 px-5 bg-violet-600 hover:bg-violet-500 text-foreground rounded-lg font-black text-[10px] uppercase tracking-[0.2em] shadow-md shadow-violet-500/5 gap-2 group"
        >
          {isPending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <>
              <Save className="w-3 h-3 transition-transform group-hover:scale-110" />
              Commit Updates
            </>
          )}
        </Button>
      </div>

      {/* Ultra-Compact Status Card */}
      <div className={cn(
        "rounded-2xl border transition-all duration-300",
        isSpecial 
          ? "bg-violet-600/5 border-violet-500/30" 
          : "bg-card border-border"
      )}>
        <div className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
              isSpecial ? "bg-violet-600/20 text-violet-400" : "bg-muted text-muted-foreground/60"
            )}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-sm font-black text-foreground uppercase tracking-tight">Special Admin Status</h2>
              <p className="text-muted-foreground/60 text-[9px] font-bold uppercase tracking-widest italic">{isSpecial ? 'Privileged platform access enabled' : 'Standard administrator constraints applied'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-xl border border-white/5 backdrop-blur-sm">
            <Switch 
              id="special-toggle"
              checked={isSpecial}
              onCheckedChange={setIsSpecial}
              className="data-[state=checked]:bg-violet-600 h-5 w-9"
            />
            <Label htmlFor="special-toggle" className={cn("text-[9px] font-black uppercase tracking-widest", isSpecial ? "text-violet-400" : "text-muted-foreground/60")}>
              {isSpecial ? 'Active' : 'Off'}
            </Label>
          </div>
        </div>
      </div>

      {/* Tighter Module List */}
      <div className={cn(
        "space-y-3 transition-all duration-300",
        !isSpecial && "opacity-30 grayscale pointer-events-none blur-[1px]"
      )}>
        <div className="flex items-center gap-2 px-1">
           <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
           <h3 className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Platform Modules</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {AVAILABLE_FEATURES.map((feat) => {
            const Icon = feat.icon
            const isSelected = feat.id in features
            const config = features[feat.id]

            return (
              <div key={feat.id} className="space-y-2">
                <div 
                  onClick={() => toggleFeature(feat.id)}
                  className={cn(
                    "group cursor-pointer rounded-xl border p-3 transition-all duration-200",
                    isSelected 
                      ? "bg-muted text-violet-400 border-violet-500/30 shadow-md" 
                      : "bg-card border-border hover:border-border"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                      isSelected ? "bg-violet-500 text-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-foreground group-hover:text-violet-300 transition-colors uppercase tracking-tight text-[11px] italic truncate mr-2">{feat.label}</span>
                        <Checkbox 
                          checked={isSelected}
                          className="w-3.5 h-3.5 rounded-sm border-border data-[state=checked]:bg-violet-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-logic for specific features */}
                {isSelected && feat.id === 'create_restaurant' && (
                  <div className="ml-1 px-3 py-2 bg-black/30 border border-border/50 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Brand Quota</Label>
                      <span className="text-[11px] font-black text-violet-400 italic">{config.max_brands || 1} UNIT(S)</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      value={config.max_brands || 1}
                      onChange={(e) => updateFeatureConfig(feat.id, { max_brands: parseInt(e.target.value) })}
                      className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-violet-500"
                    />
                    <p className="text-[8px] text-muted-foreground/60 font-bold uppercase">Limits the total number of brands this admin can establish.</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer Info Only */}
      <div className="pt-4">
        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">UID_REF: {membershipId.slice(0, 8)}</p>
      </div>
    </div>
  )
}
