'use client'

import { useActionState, useState, useEffect } from 'react'
import { updateCommonCustomer } from '@/app/actions/customers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Pencil } from 'lucide-react'

interface EditCustomerDialogProps {
  restaurantId: string
  customer: {
    id: string
    name: string
    phone: string | null
  }
}

export function EditCustomerDialog({ customer, restaurantId }: EditCustomerDialogProps) {
  const [state, action, pending] = useActionState(updateCommonCustomer, null)
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Close dialog on success
  useEffect(() => {
    if (state && 'success' in state) {
      setOpen(false)
    }
  }, [state])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-violet-400 hover:bg-violet-500/10 rounded-xl">
            <Pencil className="w-4 h-4" />
          </Button>
        }
      />
      <SheetContent side={isMobile ? 'bottom' : 'right'} className={`bg-card border-border text-foreground p-6 ${isMobile ? 'rounded-t-3xl' : ''}`}>
        <SheetHeader className="p-0 mb-4">
          <SheetTitle className="text-foreground text-lg font-black italic tracking-tight">Edit Customer Reference</SheetTitle>
        </SheetHeader>
        <form action={action} className="space-y-4 mt-2">
          <input type="hidden" name="id" value={customer.id} />
          <input type="hidden" name="restaurantId" value={restaurantId} />
          
          <div className="space-y-1.5">
            <Label className="text-foreground/70 text-sm">Full Name *</Label>
            <Input 
              name="name" 
              required 
              defaultValue={customer.name}
              placeholder="e.g. Sokha Chan"
              className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-violet-500" 
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-foreground/70 text-sm">Phone</Label>
            <Input 
              name="phone" 
              type="tel"
              defaultValue={customer.phone || ''}
              placeholder="e.g. 012 345 678"
              className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-violet-500" 
            />
          </div>

          {state && 'error' in state && (
            <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg p-2.5">
              ⚠️ {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 border-0 shadow-lg shadow-violet-500/20 h-11 font-bold">
            {pending ? 'Saving Changes...' : 'Save Changes'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
