import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
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

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
