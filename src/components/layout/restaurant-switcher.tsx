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
import { switchRestaurant } from "@/app/actions/restaurant-context"

interface RestaurantSwitcherProps {
  currentRestaurantId: string
  memberships: any[]
}

import { useRouter } from 'next/navigation'

export function RestaurantSwitcher({ currentRestaurantId, memberships }: RestaurantSwitcherProps) {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  const activeMembership = memberships.find(m => m.restaurant_id === currentRestaurantId)
  const currentName = activeMembership?.restaurants?.name || "Select Restaurant"

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="flex items-center gap-2 px-2 h-9 text-white hover:bg-white/5 rounded-xl transition-all duration-200"
          >
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
              <Store className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <span className="text-sm font-semibold truncate max-w-[120px]">
              {currentName}
            </span>
            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        }
      />
      <DropdownMenuContent 
        className="w-[200px] bg-slate-900 border-slate-800 text-slate-200 p-1 shadow-2xl rounded-2xl" 
        align="start"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-slate-500 font-bold px-2 py-1.5">
            Your Restaurants
          </DropdownMenuLabel>
          {memberships.map((membership) => (
            <DropdownMenuItem
              key={membership.restaurant_id}
              disabled={isPending}
              onSelect={(e) => {
                e.preventDefault()
                setOpen(false)
                startTransition(() => {
                  // Fire-and-forget the cookie update action
                  switchRestaurant(membership.restaurant_id).catch(() => {})
                  // Navigate explicitly on the client
                  router.push(`/dashboard/${membership.restaurant_id}`)
                })
              }}
              className={cn(
                "flex items-center justify-between px-2 py-2 cursor-pointer rounded-xl transition-colors",
                membership.restaurant_id === currentRestaurantId 
                  ? "bg-violet-500/10 text-violet-400" 
                  : "hover:bg-slate-800"
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
        <DropdownMenuSeparator className="bg-slate-800 mx-1 my-1" />
        <DropdownMenuItem 
          disabled 
          className="flex items-center gap-2 px-2 py-2 text-slate-500 rounded-xl opacity-50"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Add Business</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
