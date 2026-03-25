import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Quand SITE_UNDER_CONSTRUCTION=1, toutes les pages (sauf API, assets, /maintenance)
 * affichent l’écran « under construction » via rewrite interne vers /maintenance.
 * Désactiver : SITE_UNDER_CONSTRUCTION=0 ou supprimer la variable.
 */
export function middleware(request: NextRequest) {
  if (process.env.SITE_UNDER_CONSTRUCTION !== '1') {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/maintenance') ||
    pathname === '/favicon.ico' ||
    /\.(?:ico|png|jpe?g|gif|webp|svg|woff2?|ttf|eot|txt|xml|json|webmanifest)$/i.test(
      pathname
    )
  ) {
    return NextResponse.next();
  }

  return NextResponse.rewrite(new URL('/maintenance', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
