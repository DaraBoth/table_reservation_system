'use client'

import * as React from "react"
import { Check, ChevronsUpDown, Store, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePathname } from 'next/navigation'

interface RestaurantSwitcherProps {
  currentRestaurantId: string
  memberships: any[]
}

export function RestaurantSwitcher({ currentRestaurantId, memberships }: RestaurantSwitcherProps) {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()
  const [isPending, setIsPending] = React.useState(false)

  const activeMembership = memberships.find(m => m.restaurant_id === currentRestaurantId)
  const currentName = activeMembership?.restaurants?.name || "Select Restaurant"

  const buildTargetPath = React.useCallback((nextRestaurantId: string) => {
    const segments = pathname.split('/').filter(Boolean)
    if (segments[0] === 'dashboard' && segments[1]) {
      const suffix = segments.slice(2).join('/')
      return suffix
        ? `/dashboard/${nextRestaurantId}/${suffix}`
        : `/dashboard/${nextRestaurantId}`
    }
    return `/dashboard/${nextRestaurantId}`
  }, [pathname])

  const handleSwitch = React.useCallback(async (nextRestaurantId: string) => {
    if (isPending || nextRestaurantId === currentRestaurantId) {
      setOpen(false)
      return
    }

    setIsPending(true)
    try {
      await fetch('/api/active-restaurant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId: nextRestaurantId }),
      })
    } catch {
      // Continue navigation even if cookie persistence fails.
    } finally {
      const target = buildTargetPath(nextRestaurantId)
      window.location.assign(target)
    }
  }, [buildTargetPath, currentRestaurantId, isPending])

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="flex items-center gap-2 px-2 h-9 text-foreground hover:bg-white/5 rounded-xl transition-all duration-200"
        >
          <div className="w-6 h-6 rounded-md bg-linear-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
            <Store className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <span className="text-sm font-semibold truncate max-w-30">
            {currentName}
          </span>
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-50 bg-card border-border text-foreground/80 p-1 shadow-2xl rounded-2xl" 
        align="start"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-2 py-1.5">
            Your Restaurants
          </DropdownMenuLabel>
          {memberships.map((membership) => (
            <DropdownMenuItem
              key={membership.restaurant_id}
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault()
                setOpen(false)
                void handleSwitch(membership.restaurant_id)
              }}
              className={cn(
                "flex items-center justify-between px-2 py-2 cursor-pointer rounded-xl transition-colors",
                membership.restaurant_id === currentRestaurantId 
                  ? "bg-violet-500/10 text-violet-400" 
                  : "hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 opacity-70" />
                <span className="text-sm font-medium">{membership.restaurants?.name}</span>
              </div>
              {membership.restaurant_id === currentRestaurantId && (
                <Check className="h-3.5 w-3.5" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        
        {/* Placeholder for "Add New" for Admins if relevant, or just a separator */}
        <DropdownMenuSeparator className="bg-muted mx-1 my-1" />
        <DropdownMenuItem 
          disabled 
          className="flex items-center gap-2 px-2 py-2 text-muted-foreground rounded-xl opacity-50"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Add Business</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
