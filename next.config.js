/** @type {import('next').NextConfig} */
const nextConfig = {
  // IMPORTANT: Ne pas utiliser output: 'export' car nous avons des API Routes
  // (authentification, admin, quiz attempts, etc.)
  reactStrictMode: true,
  // Vercel : éviter les timeouts si beaucoup de routes touchent la DB au build
  staticPageGenerationTimeout: 180,
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'crackthecurve.com',
      },
      {
        protocol: 'https',
        hostname: '**.crackthecurve.com',
      },
      {
        protocol: 'http',
        hostname: '**.crackthecurve.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      ...(process.env.WORDPRESS_API_URL
        ? [
            {
              protocol: /^https:/.test(process.env.WORDPRESS_API_URL) ? 'https' : 'http',
              hostname: process.env.WORDPRESS_API_URL
                .replace(/^https?:\/\//, '')
                .split('/')[0],
            },
          ]
        : []),
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Headers de sécurité pour la production
  async headers() {
    return [
      {
        source: '/profile/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          }
        ]
      },
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
  async redirects() {
    return [
      {
        source: '/a-propos',
        destination: '/about-us',
        permanent: true
      },
      {
        source: '/categorie',
        destination: '/quiz',
        permanent: true
      }
    ];
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
}

module.exports = nextConfig

