import { createPrivateMetadata } from '@/lib/seo'

export const metadata = createPrivateMetadata('Create Brand', 'Create a new restaurant, hotel, or guesthouse workspace.', '/setup/new')

export default function GlobalSetupLayout({ children }: { children: React.ReactNode }) {
  return children
}