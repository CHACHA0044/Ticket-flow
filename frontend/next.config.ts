import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Event artwork is generated locally (SVG/gradient) — remote patterns are
    // intentionally left empty so no external image host is required.
    remotePatterns: [],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    // Keep client bundles lean by tree-shaking heavy icon libraries.
    optimizePackageImports: ['lucide-react', 'react-icons'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ]
  },
}

export default nextConfig