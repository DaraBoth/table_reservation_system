'use client'

import { useActionState, useState } from 'react'
import { addCommonCustomer } from '@/app/actions/customers'
import { UserPlus, ChevronDown, ChevronUp } from 'lucide-react'

type ActionState = { error: string } | { success: true } | null

export function AddCustomerForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(addCommonCustomer as any, null)
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-5 text-left transition-colors hover:bg-slate-800/40"
      >
        <div className="w-10 h-10 rounded-2xl bg-violet-600/15 flex items-center justify-center flex-shrink-0">
          <UserPlus className="w-5 h-5 text-violet-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">Add New Customer</p>
          <p className="text-xs text-slate-500">Save a customer so staff can select them quickly</p>
        </div>
        {open
          ? <ChevronUp className="w-5 h-5 text-slate-500" />
          : <ChevronDown className="w-5 h-5 text-slate-500" />
        }
      </button>

      {/* Form body */}
      {open && (
        <form action={action} className="px-5 pb-5 space-y-4 border-t border-slate-800 pt-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">
              Full Name *
            </label>
            <input
              name="name"
              required
              placeholder="e.g. Sokha Chan"
              className="w-full h-12 px-4 rounded-2xl bg-slate-950 border border-slate-700 text-white text-sm font-semibold placeholder:text-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {/* Phone + Party Size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">
                Phone
              </label>
              <input
                name="phone"
                type="tel"
                placeholder="e.g. 012 345 678"
                className="w-full h-12 px-4 rounded-2xl bg-slate-950 border border-slate-700 text-white text-sm font-semibold placeholder:text-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">
                Party Size
              </label>
              <input
                name="partySize"
                type="number"
                defaultValue={2}
                min={1}
                max={50}
                className="w-full h-12 px-4 rounded-2xl bg-slate-950 border border-slate-700 text-white text-sm font-semibold focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">
              Notes (optional)
            </label>
            <textarea
              name="notes"
              rows={2}
              placeholder="e.g. Prefers window seat, allergic to nuts"
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white text-sm font-semibold placeholder:text-slate-600 focus:outline-none focus:border-violet-500 transition-colors resize-none"
            />
          </div>

          {/* Error / success */}
          {state && 'error' in state && (
            <p className="text-xs text-red-400 font-bold bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              ⚠️ {state.error}
            </p>
          )}
          {state && 'success' in state && (
            <p className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
              ✅ Customer saved!
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-2xl font-bold text-sm transition-all active:scale-[0.98]"
          >
            {pending ? 'Saving…' : 'Save Customer'}
          </button>
        </form>
      )}
    </div>
  )
}
