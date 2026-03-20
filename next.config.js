/** @type {import('next').NextConfig} */
const nextConfig = {
  // IMPORTANT: Ne pas utiliser output: 'export' car nous avons des API Routes
  // (authentification, admin, quiz attempts, etc.)
  reactStrictMode: true,
  images: {
    // Optimisation d'images activée pour la production
    unoptimized: false,
    domains: [
      'theschoolofmathematics.com',
      'www.theschoolofmathematics.com',
      'picsum.photos',
      'images.unsplash.com',
      process.env.WORDPRESS_API_URL?.replace('https://', '').replace('http://', '').split('/')[0] || ''
    ].filter(Boolean),
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.theschoolofmathematics.com',
      },
      {
        protocol: 'http',
        hostname: '**.theschoolofmathematics.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Headers de sécurité pour la production
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
}

module.exports = nextConfig

