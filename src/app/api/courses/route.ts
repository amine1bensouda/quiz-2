import { NextResponse } from 'next/server';
import { isFullRequest } from '@/lib/request-utils';
import { getAllPublishedCourses, getPublishedCoursesSummary } from '@/lib/course-service';


export const dynamic = 'force-dynamic';

export const revalidate = 3600; // Revalider toutes les heures

export async function GET(request: Request) {
  try {
    const full = isFullRequest(request);
    // Léger par défaut pour réduire l'egress DB.
    const courses = full
      ? await getAllPublishedCourses()
      : await getPublishedCoursesSummary();
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Erreur API courses:', error);
    
    // Vérifier si c'est une erreur de connexion à la base de données
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('Database connection error')) {
      return NextResponse.json(
        { 
          error: 'Database connection error',
          message: 'Unable to connect to the database. Please check your DATABASE_URL configuration.',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch courses',
        message: errorMessage
      },
      { status: 500 }
    );
  }
}
