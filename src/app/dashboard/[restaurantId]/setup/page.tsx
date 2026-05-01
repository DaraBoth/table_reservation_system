import { getActiveRestaurant } from '@/lib/restaurant-context'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SetupForm } from './SetupForm'
import { Sparkles } from 'lucide-react'
import { createPrivateMetadata } from '@/lib/seo'
import { getServerT } from '@/i18n/server'

export const metadata = createPrivateMetadata('Business Setup', 'Complete the first-time setup for your restaurant or property.')

export default async function ({ params }: { params: Promise<{ restaurantId: string }> }) {
  const { t } = await getServerT()
  const { restaurantId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const res = await getActiveRestaurant(restaurantId)
  if (!res) return null
  const membershipRaw = res.membership

  const membership = membershipRaw as any
  if (!membership?.restaurant_id || !membership.restaurants) redirect('/dashboard')

  if (!membership.restaurants.is_new) redirect('/dashboard')

  return (
    <div className="min-h-[80vh] flex flex-col justify-start py-6 px-4">
      <div className="w-full max-w-md mx-auto space-y-5">

        {/* Compact inline header */}
        <div className="flex items-center gap-4 pt-2">
          <div className="w-14 h-14 rounded-[1.5rem] bg-violet-600 flex items-center justify-center shadow-xl shadow-violet-500/30 shrink-0">
            <Sparkles className="w-7 h-7 text-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">{t('dashboard.welcome', { defaultValue: 'Welcome!' })}</h1>
            <p className="text-muted-foreground text-sm font-medium">{t('dashboard.setupBusinessPrompt', { defaultValue: 'Set up your business to get started.' })}</p>
          </div>
        </div>

        <SetupForm restaurant={membership.restaurants} restaurantId={membership.restaurant_id} />

        <p className="text-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed px-4">
          {t('dashboard.adminForBusiness', { defaultValue: 'Admin for {{name}} · Settings can be changed later', name: membership.restaurants.name })}
        </p>
      </div>
    </div>
  )
}
