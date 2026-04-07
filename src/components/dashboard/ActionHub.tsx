'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ActionHubItem {
  label: string
  icon: React.ReactNode
  color: string
  onClick?: () => void
  component?: React.ReactNode // For Dialogs/Sheets that need a trigger
}

interface ActionHubProps {
  actions: ActionHubItem[]
}

export function ActionHub({ actions }: ActionHubProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-26 md:bottom-8 right-6 md:right-8 z-[200]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-background/60 backdrop-blur-[6px] z-[190]"
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col items-end gap-3 relative z-[210]">
        <AnimatePresence mode="popLayout">
          {isOpen && (
            <div className="flex flex-col items-end gap-3 mb-4">
              {actions.map((action, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  transition={{
                    delay: (actions.length - idx) * 0.05,
                    type: "spring",
                    stiffness: 300,
                    damping: 25
                  }}
                  className="flex items-center gap-4 group"
                >
                  <span className="text-[10px] font-black text-foreground uppercase tracking-widest bg-card border border-border px-4 py-2 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 whitespace-nowrap">
                    {action.label}
                  </span>
                  {action.component ? (
                    <div onClick={() => setIsOpen(false)}>
                      {React.cloneElement(action.component as any, {
                        trigger: (
                          <button className={cn("w-14 h-14 rounded-[1.25rem] flex items-center justify-center transition-all active:scale-95 shadow-2xl border border-border/50 hover:border-violet-500/50", action.color)}>
                            {action.icon}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <button
                      onClick={() => { action.onClick?.(); setIsOpen(false); }}
                      className={cn("w-14 h-14 rounded-[1.25rem] flex items-center justify-center transition-all active:scale-95 shadow-2xl border border-border/50 hover:border-violet-500/50", action.color)}
                    >
                      {action.icon}
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 shadow-[0_20px_50px_rgba(109,40,217,0.3)] relative overflow-hidden group border border-violet-500/20",
            isOpen ? "bg-card border-border rotate-45 text-muted-foreground" : "bg-violet-600 hover:bg-violet-500 text-white"
          )}
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <Plus className="w-8 h-8" />
          </motion.div>
        </button>
      </div>
    </div>
  )
}
