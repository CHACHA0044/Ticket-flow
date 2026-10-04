import type { MetadataRoute } from 'next'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants'

/**
 * Web app manifest.
 *
 * `theme_color` and `background_color` match `viewport.themeColor` and the body
 * background in `globals.css`; a mismatch shows as a white flash during install
 * on Android, which is the whole point of shipping a manifest here.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} — ${APP_TAGLINE}`,
    short_name: APP_NAME,
    description:
      'Pick your exact seat, see availability update in real time, and check out in under a minute.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#050505',
    theme_color: '#0A0A0B',
    categories: ['entertainment', 'shopping', 'lifestyle'],
    icons: [
      {
        src: '/icon.svg',
        // `any` is intentional: a single scalable mark avoids shipping a 512px
        // raster that a maskable install icon would crop unpredictably.
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }
}
