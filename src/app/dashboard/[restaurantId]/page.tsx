import { format } from 'date-fns'
import { getActiveRestaurant } from '@/lib/restaurant-context'
import { createClient } from '@/lib/supabase/server'
import { countAvailableUnits } from '@/lib/dashboard-utils'
import type { BusinessType } from '@/lib/business-type'
import type { Tables } from '@/lib/types/database'
import { DashboardClient } from './DashboardClient'
import { createPrivateMetadata } from '@/lib/seo'
import { getServerT } from '@/i18n/server'

type DashboardReservation = Tables<'reservations'> & {
	physical_tables: Pick<Tables<'physical_tables'>, 'table_name' | 'capacity'> | null
}

export const metadata = createPrivateMetadata('Today Overview', 'Monitor today\'s bookings and availability at a glance.')

export default async function RestaurantDashboardPage({ params }: { params: Promise<{ restaurantId: string }> }) {
	await getServerT()
	const { restaurantId } = await params

	const supabase = await createClient()
	const { data: { user } } = await supabase.auth.getUser()
	if (!user) return null

	const res = await getActiveRestaurant(restaurantId)
	if (!res) return null

	const membership = res.membership as {
		restaurant_id?: string | null
		restaurants?: { business_type?: string | null } | null
	} | null

	if (!membership?.restaurant_id) return null

	const today = new Date()
	const todayIso = format(today, 'yyyy-MM-dd')

	const [{ data: rawRows }, { data: allTableRows }] = await Promise.all([
		supabase
			.from('reservations')
			.select('id, status, guest_name, start_time, party_size, reservation_date, table_id, physical_tables(table_name, capacity)')
			.eq('restaurant_id', membership.restaurant_id)
			.eq('reservation_date', todayIso)
			.neq('status', 'cancelled')
			.order('created_at', { ascending: false }),
		supabase
			.from('physical_tables')
			.select('id')
			.eq('restaurant_id', membership.restaurant_id)
			.eq('is_active', true),
	])

	const reservations = (rawRows as DashboardReservation[] | null) ?? []
	const businessType = (membership.restaurants?.business_type ?? 'restaurant') as BusinessType

	return (
		<div className="max-w-6xl mx-auto pb-10 md:pb-6">
			<DashboardClient
				restaurantId={membership.restaurant_id}
				activeSlug={res.activeSlug}
				initialData={{
					totalToday: reservations.length,
					pendingCount: reservations.filter((reservation) => reservation.status === 'pending').length,
					availableUnits: countAvailableUnits(allTableRows?.length ?? 0, reservations),
					upcomingReservations: reservations.slice(0, 10),
					businessType,
					todayStr: format(today, 'EEEE, MMMM d'),
				}}
			/>
		</div>
	)
}
