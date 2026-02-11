import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Route de diagnostic pour vérifier la santé de l'API et de la base de données
 */
export async function GET() {
  const health: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {},
  };

  // Vérifier la connexion à la base de données
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = {
      status: 'ok',
      message: 'Database connection successful',
    };
  } catch (error: any) {
    health.status = 'error';
    health.checks.database = {
      status: 'error',
      message: error.message || 'Database connection failed',
      code: error.code,
    };
  }

  // Vérifier les variables d'environnement (sans exposer les valeurs sensibles)
  health.checks.environment = {
    DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'missing',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? 'configured' : 'missing',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'not configured',
  };

  const statusCode = health.status === 'ok' ? 200 : 503;
  
  return NextResponse.json(health, { status: statusCode });
}
