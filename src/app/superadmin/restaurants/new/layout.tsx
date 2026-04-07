import { createPrivateMetadata } from '@/lib/seo'

export const metadata = createPrivateMetadata('New Restaurant', 'Create a new restaurant, hotel, or guesthouse account in the platform.')

export default function NewRestaurantLayout({ children }: { children: React.ReactNode }) {
  return children
}