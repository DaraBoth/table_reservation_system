import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BookJM',
    short_name: 'BookJM',
    description: 'Multi-tenant restaurant and hotel management system',
    start_url: '/login',
    display: 'standalone',
    background_color: '#020617', // slate-950
    theme_color: '#8b5cf6', // violet-500
    icons: [
      {
        src: '/icons/maskable_icon_x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/maskable_icon_x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
