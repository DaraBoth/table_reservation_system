import type { Metadata } from 'next'
import { APP_NAME } from '@/lib/seo'

export const metadata: Metadata = {
  title: {
    default: 'Account Access',
    template: `%s | ${APP_NAME}`,
  },
  description: 'Private sign-in and account access pages for BookJM.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
