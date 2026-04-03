import { getActiveRestaurant } from '@/lib/restaurant-context'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const res = await getActiveRestaurant()
  
  if (!res || !res.activeId) {
    redirect('/login')
  }

  // Redirect to the active restaurant context
  redirect(`/dashboard/${res.activeId}`)
}
