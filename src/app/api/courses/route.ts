import { NextResponse } from 'next/server';
import { isFullRequest } from '@/lib/request-utils';
import { getAllPublishedCourses, getPublishedCoursesSummary } from '@/lib/course-service';
import { withCacheHeaders, withNoStoreHeaders } from '@/lib/http-cache';
import {
  addResponseObservability,
  checkRateLimit,
  getRequestIp,
  tooManyRequestsJson,
} from '@/lib/traffic-guard';


export const revalidate = 3600; // Revalider toutes les heures

export async function GET(request: Request) {
  const startTime = Date.now();
  try {
    const ip = getRequestIp(request);
    const full = isFullRequest(request);
    const rateKey = `api:courses:${ip}:${full ? 'full' : 'summary'}`;
    const rate = checkRateLimit(rateKey, full ? { windowMs: 60_000, max: 30 } : { windowMs: 60_000, max: 120 });
    if (!rate.allowed) {
      return addResponseObservability(
        tooManyRequestsJson(rate.retryAfter, 'Too many course requests'),
        startTime,
        '/api/courses'
      );
    }
    // Léger par défaut pour réduire l'egress DB.
    const courses = full
      ? await getAllPublishedCourses()
      : await getPublishedCoursesSummary();
    if (full) {
      const response = withNoStoreHeaders(NextResponse.json(courses));
      response.headers.set('X-RateLimit-Remaining', String(rate.remaining));
      return addResponseObservability(response, startTime, '/api/courses');
    }
    const response = withCacheHeaders(NextResponse.json(courses), {
      sMaxAge: 300,
      staleWhileRevalidate: 3600,
      maxAge: 60,
    });
    response.headers.set('X-RateLimit-Remaining', String(rate.remaining));
    return addResponseObservability(response, startTime, '/api/courses');
  } catch (error) {
    console.error('Erreur API courses:', error);
    
    // Vérifier si c'est une erreur de connexion à la base de données
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('Database connection error')) {
      return addResponseObservability(
        NextResponse.json(
        { 
          error: 'Database connection error',
          message: 'Unable to connect to the database. Please check your DATABASE_URL configuration.',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 503 }
        ),
        startTime,
        '/api/courses'
      );
    }
    
    return addResponseObservability(
      NextResponse.json(
      { 
        error: 'Failed to fetch courses',
        message: errorMessage
      },
      { status: 500 }
      ),
      startTime,
      '/api/courses'
    );
  }
}
