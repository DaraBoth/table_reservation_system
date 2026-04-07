import { createPrivateMetadata } from '@/lib/seo'

export const metadata = createPrivateMetadata('Superadmin Setup', 'Create the first superadmin account for the platform.', '/register-superadmin')

export default function RegisterSuperadminLayout({ children }: { children: React.ReactNode }) {
  return children
}