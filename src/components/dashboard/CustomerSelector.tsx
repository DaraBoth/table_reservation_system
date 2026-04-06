'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Search, User, Zap, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { getTopCustomers, searchCustomers } from '@/app/actions/customers'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface Customer {
  id: string
  name: string
  phone: string | null
  total_bookings: number
}

interface CustomerSelectorProps {
  restaurantId: string
  onSelect: (customer: { name: string; phone: string }) => void
  className?: string
}

export function CustomerSelector({ restaurantId, onSelect, className }: CustomerSelectorProps) {
  const [query, setQuery] = useState('')
  const [topCustomers, setTopCustomers] = useState<Customer[]>([])
  const [results, setResults] = useState<Customer[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // 1. Fetch Top 3 on mount
  useEffect(() => {
    const fetchTop = async () => {
      const top = await getTopCustomers(restaurantId)
      setTopCustomers(top as any[])
    }
    fetchTop()
  }, [restaurantId])

  // 2. Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      const data = await searchCustomers(restaurantId, query)
      setResults(data as any[])
      setIsSearching(false)
    }, 400)

    return () => clearTimeout(timer)
  }, [query, restaurantId])

  const handleSelect = (c: Customer) => {
    onSelect({ name: c.name, phone: c.phone || '' })
    setQuery('')
    setShowResults(false)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Header */}
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-violet-400 transition-colors">
          <Search className="w-4 h-4" />
        </div>
        <Input
          placeholder="Search returning guests by name or phone..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowResults(true)
          }}
          onFocus={() => setShowResults(true)}
          className="pl-11 h-12 bg-card/40 border-border/50 rounded-2xl text-sm focus:border-violet-500/50 transition-all shadow-inner placeholder:text-muted-foreground/30"
        />
        {query && (
          <button 
            type="button"
            onClick={() => { setQuery(''); setShowResults(false); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {showResults && (query.trim() || results.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute left-0 right-0 top-full mt-2 z-50 bg-background/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-muted-foreground animate-pulse font-black uppercase tracking-widest">
                    Searching database...
                  </div>
                ) : results.length > 0 ? (
                  <div className="grid gap-1">
                    {results.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelect(c)}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-violet-500/10 transition-all text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                            <User className="w-4 h-4 text-muted-foreground group-hover:text-violet-400" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-foreground uppercase italic leading-none">{c.name}</p>
                            <p className="text-[10px] text-muted-foreground font-bold mt-1 tracking-wider">{c.phone || 'No phone'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-violet-400 uppercase tracking-tighter">{c.total_bookings} Bookings</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground font-bold italic">
                    No matching customers found.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Selection: Top 3 */}
      {topCustomers.length > 0 && !query && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Zap className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Quick Select: Top Returning Guests</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {topCustomers.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelect(c)}
                className="flex items-center gap-2 px-3 py-2 bg-violet-500/5 hover:bg-violet-500/15 border border-violet-500/20 rounded-xl transition-all active:scale-95 group"
              >
                <div className="flex flex-col items-start leading-none">
                  <span className="text-xs font-black text-foreground uppercase tracking-tight group-hover:text-violet-300">
                    {c.name.split(' ')[0]}
                  </span>
                  <span className="text-[8px] text-muted-foreground font-bold uppercase mt-0.5 tracking-tighter">
                    {c.total_bookings} bookings
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
