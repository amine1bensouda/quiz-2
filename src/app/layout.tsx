import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { Suspense } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import GoogleAnalytics from '@/components/Analytics/GoogleAnalytics';
import NavigationProgress from '@/components/Layout/NavigationProgress';
import ConditionalLayout from '@/components/Layout/ConditionalLayout';
import CookieBanner from '@/components/Layout/CookieBanner';
import SiteSchema from '@/components/SEO/SiteSchema';
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from '@/lib/constants';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: ['quiz', 'test', 'mathematics', 'math', 'education', 'learning'],
  authors: [{ name: SITE_NAME }],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: ['aqePUc7IOnNBwXrNGJFYlioTwHiWw7VugJH7lJ_BmVc', 'zgHDyL-ZuEVF3FHAtIQ3v7jpIbUBnARlfF11hM6_EXM'],
  },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      </head>
      <body className={inter.className}>
        <Script id="ctc-theme-init" strategy="beforeInteractive">
          {`(function(){try{var k='ctc-theme',d=document.documentElement,t=localStorage.getItem(k);d.classList.remove('light','dark');if(t==='light'||t==='dark'){d.classList.add(t);}else{d.classList.add('dark');}}catch(e){try{document.documentElement.classList.add('dark');}catch(_){}}})();`}
        </Script>
        <SiteSchema />
        <GoogleAnalytics />
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <ConditionalLayout>{children}</ConditionalLayout>
        <CookieBanner />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

