import type { NextConfig } from 'next';

const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'off',
  },
  {
    key: 'X-Permitted-Cross-Domain-Policies',
    value: 'none',
  },
];

const noIndexHeaders = [
  {
    key: 'X-Robots-Tag',
    value: 'noindex, nofollow, noarchive',
  },
];

const noIndexRoutes = [
  '/dashboard/:path*',
  '/transactions/:path*',
  '/categories/:path*',
  '/debts/:path*',
  '/settings/:path*',
  '/admin/:path*',
  '/login/:path*',
  '/register/:path*',
  '/api/:path*',
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Landing illustrations are large source PNGs. Next serves modern, responsive variants
    // so small phones do not download the desktop-sized original.
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      ...noIndexRoutes.map((source) => ({
        source,
        headers: noIndexHeaders,
      })),
    ];
  },
};

export default nextConfig;
