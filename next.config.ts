import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://generativelanguage.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://images.unsplash.com https://lh3.googleusercontent.com https://cdn.shortpixel.ai https://padelcafe.pk https://scontent.flhe5-1.fna.fbcdn.net https://i.postimg.cc",
      "connect-src 'self' https://generativelanguage.googleapis.com https://graph.facebook.com https://va.vercel-scripts.com https://vitals.vercel-insights.com",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  // Allow dev access from local network
  allowedDevOrigins: ['192.168.18.216'],
  // Security Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // Cache public API routes at CDN level
      {
        source: '/api/sports',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=600' },
        ],
      },
      {
        source: '/api/availability',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=60' },
        ],
      },
      // Immutable static assets
      {
        source: '/:path(.+\\.(?:jpg|jpeg|png|webp|avif|ico|svg)$)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  // PERFORMANCE OPTIMIZATIONS
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Remove console.log in production
  },

  // Image optimization
  images: {
    qualities: [75, 90], // Fix for Hero image quality warning
    formats: ['image/avif', 'image/webp'], // Modern formats first
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30, // Cache images for 30 days
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'cdn.shortpixel.ai' },
      { protocol: 'https', hostname: 'padelcafe.pk' },
      { protocol: 'https', hostname: 'scontent.flhe5-1.fna.fbcdn.net' },
      { protocol: 'https', hostname: 'i.postimg.cc' },
    ]
  },

  // Enable React strict mode for better development
  reactStrictMode: true,

  // Experimental optimizations
  experimental: {
    optimizeCss: true, // Optimize CSS loading
  },

  // typescript: { ignoreBuildErrors: true } — REMOVED (audit fix: type errors must not be suppressed)
};

export default nextConfig;
