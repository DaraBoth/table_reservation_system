'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Store, Mail, Link as LinkIcon, ShieldCheck, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RestaurantPreviewProps {
  name: string
  slug: string
  email: string
  isActive: boolean
}

export function RestaurantPreview({ name, slug, email, isActive }: RestaurantPreviewProps) {
  const displayName = name || 'New Restaurant'
  const displaySlug = slug || 'restaurant-slug'
  const displayEmail = email || 'contact@restaurant.com'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="sticky top-12 space-y-6 animate-in fade-in slide-in-from-right-4 duration-1000">
      <div className="flex items-center gap-2 mb-2">
        <Activity className="h-4 w-4 text-violet-400" />
        <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Live Studio Preview</span>
      </div>

      {/* Main Card Preview */}
      <Card className="bg-card/40 backdrop-blur-xl border-border/60 shadow-2xl overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-indigo-600/10 opacity-50" />
        <CardHeader className="relative pb-4">
          <div className="flex items-start justify-between">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-xl font-black text-foreground shadow-2xl shadow-violet-500/20 mb-4 border border-violet-400/20 transition-transform duration-500 group-hover:scale-110">
              {initials}
            </div>
            <Badge className={cn(
              "text-[10px] font-black uppercase tracking-tighter px-3",
              isActive ? 'bg-emerald-500 text-black' : 'bg-muted text-muted-foreground'
            )}>
              {isActive ? 'Live' : 'Draft'}
            </Badge>
          </div>
          <CardTitle className="text-2xl font-black text-foreground tracking-tight break-words">
            {displayName}
          </CardTitle>
          <div className="flex items-center gap-2 mt-1 text-muted-foreground">
            <LinkIcon className="h-3 w-3" />
            <span className="text-xs font-semibold tabular-nums">tablebook.app/{displaySlug}</span>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-4 pt-0">
          <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
          <div className="flex items-center gap-3 text-foreground/70">
            <div className="w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-xs font-medium truncate">{displayEmail}</span>
          </div>
          <div className="flex items-center gap-3 text-foreground/70">
            <div className="w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-xs font-medium">Platform Admin Access Enabled</span>
          </div>
        </CardContent>
      </Card>

      {/* Helper Tip */}
      <div className="p-6 rounded-3xl bg-violet-600/5 border border-violet-500/10 backdrop-blur-sm">
        <h4 className="text-violet-400 text-xs font-black uppercase tracking-widest mb-2">Design Pro-Tip</h4>
        <p className="text-muted-foreground text-xs leading-relaxed font-medium">
          Make sure your <span className="text-foreground">Slug</span> is URL-friendly. Use lowercase letters and hyphens only—this will be the unique link your customers use to book tables.
        </p>
      </div>
    </div>
  )
}
