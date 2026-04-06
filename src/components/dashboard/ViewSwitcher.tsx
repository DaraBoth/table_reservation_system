'use client'

import React from 'react'
import { LayoutGrid, List, Square } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export type ViewStyle = 'grid' | 'list' | 'compact'

interface ViewSwitcherProps {
  currentStyle: ViewStyle
  onStyleChange: (style: ViewStyle) => void
  disabled?: boolean
  className?: string
}

export function ViewSwitcher({ currentStyle, onStyleChange, disabled, className }: ViewSwitcherProps) {
  return (
    <Tabs 
      value={currentStyle} 
      onValueChange={(v) => onStyleChange(v as ViewStyle)}
      className={cn('w-fit', className)}
    >
      <TabsList className="bg-muted/50 border border-border/50 h-9 p-1 rounded-xl">
        <TabsTrigger 
          id="view-style-grid"
          value="grid" 
          disabled={disabled}
          className="px-3 gap-2 rounded-lg data-active:bg-background data-active:shadow-sm"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[10px] font-black uppercase tracking-wider">Grid</span>
        </TabsTrigger>
        <TabsTrigger 
          id="view-style-list"
          value="list" 
          disabled={disabled}
          className="px-3 gap-2 rounded-lg data-active:bg-background data-active:shadow-sm"
        >
          <List className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[10px] font-black uppercase tracking-wider">List</span>
        </TabsTrigger>
        <TabsTrigger 
          id="view-style-compact"
          value="compact" 
          disabled={disabled}
          className="px-3 gap-2 rounded-lg data-active:bg-background data-active:shadow-sm"
        >
          <Square className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[10px] font-black uppercase tracking-wider">Compact</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
