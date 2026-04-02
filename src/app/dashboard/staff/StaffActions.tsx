'use client'

import React, { useActionState, useState } from 'react'
import { toggleMemberStatus, deleteStaffMember } from '@/app/actions/memberships'
import { Button, buttonVariants } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Trash2, UserX, UserCheck, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StaffActions({ userId, membershipId, isActive, name }: { userId: string, membershipId: string, isActive: boolean, name: string }) {
  const [toggleState, toggleAction, togglePending] = useActionState(toggleMemberStatus, null)
  const [deleteState, deleteAction, deletePending] = useActionState(deleteStaffMember, null)
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div className="flex items-center gap-2">
      {/* Toggle Active/Disable */}
      <form action={toggleAction}>
        <input type="hidden" name="memberId" value={membershipId} />
        <input type="hidden" name="isActive" value={(!isActive).toString()} />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={togglePending}
          className={cn(
            "h-9 px-3 rounded-xl border transition-all duration-300 gap-1.5 font-bold tracking-tight",
            isActive 
              ? "bg-slate-900 border-slate-800 text-slate-400 hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/30" 
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
          )}
        >
          {togglePending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isActive ? (
            <><UserX className="w-4 h-4" /> Disable</>
          ) : (
            <><UserCheck className="w-4 h-4" /> Enable</>
          )}
        </Button>
      </form>

      {/* Hard Delete */}
      <Popover open={showConfirm} onOpenChange={setShowConfirm}>
        <PopoverTrigger
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            "h-9 w-9 p-0 rounded-xl bg-slate-900 border-slate-800 text-slate-500 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all duration-300 shadow-inner"
          )}
        >
          <Trash2 className="w-4 h-4" />
        </PopoverTrigger>
        <PopoverContent className="w-64 bg-slate-950 border-slate-800 p-5 rounded-2xl shadow-2xl z-50 overflow-hidden" side="left">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
          <div className="space-y-3">
            <h3 className="text-sm font-black text-white italic tracking-tight">Full Delete?</h3>
            <p className="text-[10px] text-slate-400 uppercase font-bold leading-relaxed tracking-tight">
              Permanently remove "{name}" and their account from the database. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end pt-2 border-t border-slate-800/50">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowConfirm(false)}
                className="text-[10px] uppercase font-black tracking-widest text-slate-500 hover:bg-slate-900 hover:text-white h-8"
              >
                Cancel
              </Button>
              <form action={deleteAction} onSubmit={() => setShowConfirm(false)}>
                <input type="hidden" name="userId" value={userId} />
                <Button 
                  type="submit"
                  disabled={deletePending}
                  className="bg-red-600 hover:bg-red-500 text-white text-[10px] uppercase font-black tracking-widest h-8 px-4 rounded-lg shadow-lg shadow-red-600/25 transition-all active:scale-95"
                >
                  {deletePending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm Deletion'}
                </Button>
              </form>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
