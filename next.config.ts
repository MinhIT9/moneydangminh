import type { NextConfig } from 'next';

function normalizeDevOrigin(value: string) {
  const origin = value.trim();

  if (!origin) return null;

  try {
    return new URL(origin.includes('://') ? origin : `https://${origin}`).hostname;
  } catch {
    return null;
  }
}

const allowedDevOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? '')
  .split(',')
  .map(normalizeDevOrigin)
  .filter((origin): origin is string => Boolean(origin));

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
  '/income-plan/:path*',
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
  // CI or diagnostic builds can use an isolated output directory when a Windows
  // dev process still has files open in the regular `.next` directory.
  distDir: process.env.NEXT_DIST_DIR?.trim() || '.next',
  // Allow trusted tunnels to load the React client runtime. Without this,
  // HTML may render through ngrok while controls fail to hydrate in `next dev`.
  allowedDevOrigins,
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
