'use client'

import { useActionState, useState, useEffect } from 'react'
import { addCommonCustomer } from '@/app/actions/customers'
import { Confetti } from '@/components/magicui/confetti'
import { UserPlus, ChevronDown, ChevronUp, Plus, AlertTriangle, CircleCheck } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

type ActionState = { error: string } | { success: true } | null

interface AddCustomerFormProps {
  trigger?: React.ReactNode
  restaurantId: string
}

export function AddCustomerForm({ trigger, restaurantId }: AddCustomerFormProps) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addCommonCustomer as any, null)
  const [open, setOpen] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // 🎉 Success Surprise!
  useEffect(() => {
    if (state && 'success' in state && state.success) {
      setShowConfetti(true)
      setTimeout(() => {
        setShowConfetti(false)
        setOpen(false)
      }, 2000)
    }
  }, [state])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Confetti active={showConfetti} />
      <SheetTrigger
        render={
          (trigger as React.ReactElement) || (
            <Button className="fixed bottom-24 right-5 w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 border-0 shadow-2xl shadow-violet-500/40 z-30 group active:scale-90 transition-all duration-300">
              <Plus className="w-7 h-7 text-foreground group-hover:rotate-90 transition-transform duration-300" />
              <span className="sr-only">Add Customer</span>
            </Button>
          )
        }
      />
      <SheetContent side={isMobile ? 'bottom' : 'right'} className={`bg-card border-border text-foreground p-6 ${isMobile ? 'rounded-t-3xl' : ''}`}>
        <SheetHeader className="p-0 mb-4">
          <SheetTitle className="text-foreground text-lg font-black italic tracking-tight">Create User Profile</SheetTitle>
          <p className="text-xs text-muted-foreground">Quickly save contact details for future seatings</p>
        </SheetHeader>
        <form action={action} className="space-y-4 mt-2">
          <input type="hidden" name="restaurantId" value={restaurantId} />
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">
              Full Name *
            </label>
            <input
              name="name"
              required
              placeholder="e.g. Sokha Chan"
              className="w-full h-12 px-4 rounded-2xl bg-background border border-border text-foreground text-sm font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">
              Phone
            </label>
            <input
              name="phone"
              type="tel"
              placeholder="e.g. 012 345 678"
              className="w-full h-12 px-4 rounded-2xl bg-background border border-border text-foreground text-sm font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {/* Error / success */}
          {(state as any)?.error && (
            <p className="text-xs text-red-400 font-bold bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {(state as any).error}
            </p>
          )}
          {(state as any)?.success && (
            <p className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 flex items-center gap-1.5">
              <CircleCheck className="w-3 h-3 flex-shrink-0" /> Customer saved!
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-foreground rounded-2xl font-bold text-sm transition-all active:scale-[0.98]"
          >
            {pending ? 'Saving…' : 'Save Customer'}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
