import { createClient } from '@/lib/supabase/server'
import { AddCustomerForm } from './AddCustomerForm'
import { DeleteCustomerButton } from './DeleteCustomerButton'
import { Users, Phone, Users2, StickyNote } from 'lucide-react'
import { EditCustomerDialog } from './EditCustomerDialog'

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
    <div className="space-y-5 max-w-2xl mx-auto pb-8">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-slate-400 text-sm">
            {customers.length} saved {customers.length === 1 ? 'customer' : 'customers'}
          </p>
        </div>
      </div>

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


                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <EditCustomerDialog 
                  customer={{
                    id: c.id,
                    name: c.name,
                    phone: c.phone
                  }} 
                />
                <DeleteCustomerButton id={c.id} name={c.name} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-8 bg-slate-900 rounded-3xl border border-slate-800">
          <Users2 className="w-14 h-14 text-violet-800 mx-auto mb-4" />
          <p className="text-slate-300 font-bold text-base">No saved customers yet</p>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            Add customers above, or tick &ldquo;Save to customer list&rdquo; when creating a booking.
          </p>
        </div>
      )}

      {/* FAB with Bottom Sheet */}
      <AddCustomerForm />
    </div>
  )
}
