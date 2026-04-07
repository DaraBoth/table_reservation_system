import { getActiveRestaurant } from '@/lib/restaurant-context'
import { redirect } from 'next/navigation'
import { createPrivateMetadata } from '@/lib/seo'

export const metadata = createPrivateMetadata('Workspace Redirect', 'Redirects signed-in users to their active dashboard.', '/dashboard')

export default async function DashboardPage() {
  const res = await getActiveRestaurant()
  
  if (!res || !res.activeId) {
    redirect('/login')
  }

  // Redirect to the active restaurant context (branded slug or fallback to ID)
  redirect(`/dashboard/${res.activeSlug}`)
}
