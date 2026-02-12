import { NextResponse } from 'next/server';
import { getCourseBySlug } from '@/lib/course-service';

export const revalidate = 3600; // Revalider toutes les heures

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const course = await getCourseBySlug(slug);
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(course);
  } catch (error) {
    console.error('Erreur API course by slug:', error);
    
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
        error: 'Failed to fetch course',
        message: errorMessage
      },
      { status: 500 }
    );
  }
}
