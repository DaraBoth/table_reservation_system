import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RestaurantDetailClient } from './RestaurantDetailClient'
import { createPrivateMetadata } from '@/lib/seo'
import { getServerT } from '@/i18n/server'

export const metadata = createPrivateMetadata('Restaurant Details', 'Review a restaurant account, slug, and assigned team members.')

export default async function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = await getServerT()
  const { id } = await params
  const supabase = await createClient()

  const [{ data: restaurant }, { data: members }] = await Promise.all([
    supabase.from('restaurants').select('*').eq('id', id).single(),
    supabase.from('account_memberships').select('*, profiles(full_name, avatar_url)').eq('restaurant_id', id),
  ])

  if (!restaurant) notFound()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/superadmin/restaurants" className="text-sm text-muted-foreground hover:text-foreground/70 transition-colors">
          {t('common.back', { defaultValue: 'Back' })}
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-lg font-bold text-foreground">
            {restaurant.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{restaurant.name}</h1>
            <p className="text-muted-foreground text-sm">/{restaurant.slug}</p>
          </div>
        </div>
      </div>

      <RestaurantDetailClient
        restaurant={restaurant}
        members={(members as any) ?? []}
      />
    </div>
  )
}
