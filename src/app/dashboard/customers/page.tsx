import { createClient } from '@/lib/supabase/server'
import { AddCustomerForm } from './AddCustomerForm'
import { DeleteCustomerButton } from './DeleteCustomerButton'
import { Users, Phone, Users2, StickyNote } from 'lucide-react'

export const metadata = { title: 'Saved Customers — TableBook' }

export default async function CustomersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membership } = await supabase
    .from('account_memberships')
    .select('restaurant_id')
    .eq('user_id', user.id)
    .single()

  if (!membership?.restaurant_id) return null

  const { data } = await supabase
    .from('common_customers')
    .select('*')
    .eq('restaurant_id', membership.restaurant_id)
    .order('name')

  const customers = data ?? []

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-24">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-slate-400 text-sm">
            {customers.length} saved {customers.length === 1 ? 'customer' : 'customers'}
          </p>
        </div>
      </div>

      {/* Add Customer Form */}
      <AddCustomerForm />

      {/* Divider */}
      {customers.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Saved List</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>
      )}

      {/* Customer List */}
      {customers.length > 0 ? (
        <div className="space-y-3">
          {customers.map((c: any) => (
            <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-4">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-base font-black text-white flex-shrink-0 shadow-lg shadow-violet-500/20">
                {c.name.slice(0, 2).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-base font-black text-white truncate">{c.name}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                  {c.phone && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {c.phone}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Users2 className="w-3 h-3" /> {c.default_party_size ?? 2} people
                  </span>
                  {c.notes && (
                    <span className="text-xs text-slate-500 flex items-center gap-1 truncate max-w-[180px]">
                      <StickyNote className="w-3 h-3 flex-shrink-0" /> {c.notes}
                    </span>
                  )}
                </div>
              </div>

              {/* Delete */}
              <DeleteCustomerButton id={c.id} name={c.name} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900 rounded-3xl border border-slate-800">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-slate-300 font-bold text-base">No saved customers yet</p>
          <p className="text-slate-500 text-sm mt-1">
            Add customers above, or tick "Save to customer list" when creating a booking.
          </p>
        </div>
      )}
    </div>
  )
}
