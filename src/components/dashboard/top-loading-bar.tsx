"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface Props {
  isPending: boolean
}

export function TopLoadingBar({ isPending }: Props) {
  const [progress, setProgress] = React.useState(0)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    let interval: NodeJS.Timeout

    if (isPending) {
      setVisible(true)
      setProgress(0)
      
      // Simulate progress
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 15
        })
      }, 200)
    } else {
      setProgress(100)
      const timer = setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 400)
      return () => clearTimeout(timer)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPending])

  if (!visible && progress === 0) return null

  return (
    <div 
      className={cn(
        "fixed top-0 left-0 right-0 h-[3px] z-[9999] transition-all duration-500 ease-out pointer-events-none overflow-hidden",
        !visible && "opacity-0"
      )}
    >
      <div 
        className="h-full bg-gradient-to-r from-violet-600 via-indigo-500 to-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.6)] transition-all duration-500"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
