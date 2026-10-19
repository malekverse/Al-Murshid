import { colors } from '@murshid/tokens';
import type { MetadataRoute } from 'next';

// Installable web app (SPEC 4: the PWA as the fallback to the store apps).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'المُرشِد · Al-Murshid',
    short_name: 'المُرشِد',
    start_url: '/',
    display: 'standalone',
    background_color: colors.light.canvas,
    theme_color: colors.light.canvas,
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
