import { createPrivateMetadata } from '@/lib/seo'

export const metadata = createPrivateMetadata('Login', 'Sign in to manage bookings, tables, rooms, and daily operations.', '/login')

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}