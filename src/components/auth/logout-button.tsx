'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logout } from '@/app/actions/auth'
import { getOrCreateDeviceToken } from '@/lib/push-client'
import { cn } from '@/lib/utils'

interface LogoutButtonProps {
  className?: string
  isCollapsed?: boolean
  showText?: boolean
}

export function LogoutButton({ className, isCollapsed, showText = true }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const deviceToken = getOrCreateDeviceToken()
      
      // Attempt to unsubscribe this device before logging out
      // We don't want to block logout if this fails, so we use a timeout or just fire and forget
      // but ideally we wait a bit
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceToken }),
      }).catch(err => console.error('Failed to unbind device on logout:', err))
    } catch (err) {
      console.error('Error during logout unbinding:', err)
    }

    // Now call the server action
    const formData = new FormData()
    await logout()
  }

  return (
    <form onSubmit={handleLogout} className="w-full">
      <Button 
        type="submit" 
        variant="ghost" 
        disabled={isLoading}
        size={isCollapsed ? "icon" : "sm"}
        className={cn(
          "w-full text-muted-foreground hover:text-foreground hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-all",
          isCollapsed ? "justify-center" : "justify-start gap-3 px-3 h-10 rounded-xl",
          className
        )}
      >
        <LogOut className={cn("h-4 w-4", isLoading && "animate-pulse")} />
        {!isCollapsed && showText && <span className="text-xs font-bold uppercase tracking-wider">Sign out</span>}
      </Button>
    </form>
  )
}
