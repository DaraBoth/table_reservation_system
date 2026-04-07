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
  component?: React.ReactElement<{ trigger?: React.ReactNode }> // For Dialogs/Sheets that need a trigger
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

      <div className="flex flex-col items-end relative z-[210]">
        <div className="flex flex-col items-end mb-4">
          {actions.map((action, idx) => (
            <motion.div
              key={idx}
              initial={false}
              animate={isOpen ? { opacity: 1, y: 0, scale: 1, height: 56, marginBottom: 12 } : { opacity: 0, y: 10, scale: 0.8, height: 0, marginBottom: 0 }}
              transition={{
                delay: isOpen ? (actions.length - idx) * 0.05 : idx * 0.03,
                type: 'spring',
                stiffness: 300,
                damping: 25
              }}
              style={{ overflow: 'hidden', pointerEvents: isOpen ? 'auto' : 'none', transformOrigin: 'bottom right' }}
              className="flex items-center justify-end gap-4 group"
            >
              <span className={cn(
                'text-[10px] font-black text-foreground uppercase tracking-widest bg-card border border-border px-4 py-2 rounded-xl shadow-2xl whitespace-nowrap transition-all',
                isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
              )}>
                {action.label}
              </span>
              {action.component ? (
                <div onClick={() => setIsOpen(false)}>
                  {React.cloneElement(action.component, {
                    trigger: (
                      <button className={cn(
                        'w-14 h-14 rounded-[1.25rem] flex items-center justify-center transition-all active:scale-95 shadow-2xl border border-border/50 hover:border-violet-500/50',
                        action.color
                      )}>
                        {action.icon}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <button
                  onClick={() => { action.onClick?.(); setIsOpen(false); }}
                  className={cn('w-14 h-14 rounded-[1.25rem] flex items-center justify-center transition-all active:scale-95 shadow-2xl border border-border/50 hover:border-violet-500/50', action.color)}
                >
                  {action.icon}
                </button>
              )}
            </motion.div>
          ))}
        </div>

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
