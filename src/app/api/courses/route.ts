import { NextResponse } from 'next/server';
import { getAllPublishedCourses } from '@/lib/course-service';

export const revalidate = 3600; // Revalider toutes les heures

export async function GET() {
  try {
    const courses = await getAllPublishedCourses();
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Erreur API courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
