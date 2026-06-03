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


export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

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
    // Lightweight by default to reduce DB egress.
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
    console.error('Courses API error:', error);
    
    // Check if this is a database connection error
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

