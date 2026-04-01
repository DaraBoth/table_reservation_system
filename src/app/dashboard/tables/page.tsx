import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTerms } from '@/lib/business-type'
import type { BusinessType } from '@/lib/business-type'
import type { Tables } from '@/lib/types/database'
import { CreateTableDialog } from './CreateTableDialog'
import { TableCard } from './TableCard'
import Link from 'next/link'
import { BarChart3 } from 'lucide-react'

export const metadata = { title: 'Tables — TableBook' }

export default async function TablesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membershipRaw } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id, restaurants(business_type)')
    .eq('user_id', user.id)
    .single()

  const membership = membershipRaw as any
  const role = membership?.role
  const isAdmin = role === 'admin' || role === 'superadmin'
  const isStaff = role === 'staff'
  const canManage = isAdmin || isStaff // User wants staff to edit/manage too
  const businessType = (membership?.restaurants?.business_type ?? 'restaurant') as BusinessType
  const terms = getTerms(businessType)

  if (!canManage) redirect('/dashboard')

  const { data: raw } = await supabase
    .from('physical_tables')
    .select('*')
    .eq('restaurant_id', membership.restaurant_id!)
    .order('table_name')

  const tables = (raw ?? []) as Tables<'physical_tables'>[]

  const today = new Date()
  const todayDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0')

  const { data: busyRows } = await supabase
    .from('reservations')
    .select('table_id, guest_name, status')
    .eq('restaurant_id', membership.restaurant_id!)
    .in('status', ['pending', 'confirmed', 'arrived'])
    .eq('reservation_date', todayDate)

  const busyMap = new Map<string, { guestName: string; status: string }>()
  for (const row of busyRows ?? []) {
    if (row.table_id) {
      busyMap.set(row.table_id, { guestName: row.guest_name, status: row.status })
    }
  }

  const activeTables = tables.filter(t => t.is_active)
  const freeTables = activeTables.filter(t => !busyMap.has(t.id)).length
  const busyTables = activeTables.filter(t => busyMap.has(t.id)).length

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-8">

      {/* Header with Reports + Add */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-slate-400 text-sm font-bold">{tables.length} {terms.unitsLower} total</p>
          <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-widest font-black">
            Today&apos;s Status
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <Link
              href="/dashboard/reports"
              className="flex items-center gap-1.5 h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-300 text-xs font-black uppercase tracking-tight hover:border-violet-500/50 hover:text-violet-300 transition-all"
            >
              <BarChart3 className="w-3.5 h-3.5" /> Reports
            </Link>
          )}
          {canManage && <CreateTableDialog businessType={businessType} />}
        </div>
      </div>

      {/* Summary strip - RESTORED */}
      <div className="flex gap-3">
        <div className="flex-1 bg-slate-900/50 border border-emerald-500/20 rounded-3xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-lg">✅</div>
          <div>
            <p className="text-2xl font-black text-white">{freeTables}</p>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Free Today</p>
          </div>
        </div>
        <div className="flex-1 bg-slate-900/50 border border-rose-500/20 rounded-3xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-lg">🔴</div>
          <div>
            <p className="text-2xl font-black text-white">{busyTables}</p>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Busy Today</p>
          </div>
        </div>
      </div>

      {/* Table Grid - WITH CLIENT-SIDE CARD LOGIC */}
      {tables.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {tables.map(t => {
            const busyInfo = busyMap.get(t.id)
            const isBusy = !!busyInfo
            const isOffline = !t.is_active
            const isTappable = !isBusy && !isOffline

            return (
              <TableCard
                key={t.id}
                table={t}
                busyInfo={busyInfo}
                isBusy={isBusy}
                isOffline={isOffline}
                isTappable={isTappable}
                terms={terms}
                businessType={businessType}
                isAdmin={isAdmin}
              />
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/50 rounded-[2.5rem] border border-slate-800 border-dashed">
          <div className="text-5xl mb-4 grayscale opacity-50">{terms.emoji}</div>
          <p className="text-slate-300 font-black text-lg italic tracking-tight">No {terms.unitsLower} yet</p>
          <p className="text-slate-500 text-xs mt-1 mb-8 font-bold uppercase tracking-widest">Get started by adding your first unit</p>
          {canManage && <CreateTableDialog businessType={businessType} />}
        </div>
      )}

      {/* Note */}
      <p className="text-center text-[10px] text-slate-600 pt-8 pb-4 font-black uppercase tracking-widest leading-relaxed px-8 opacity-50">
        Status updates automatically based on today&apos;s active {terms.bookingsLower}. 
        Rooms show as free once guest check-out is complete.
      </p>
    </div>
  )
}
