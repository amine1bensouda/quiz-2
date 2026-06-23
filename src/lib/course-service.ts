import { prisma } from './db';
import { getAllPublishedCoursesData, getCourses, getPublishedCoursesSummaryData } from './cache';
import { convertPrismaQuizToQuiz } from './quiz-service';

/**
 * Service to handle courses with Prisma
 */

/**
 * Fetch all published courses with modules and quizzes (Next cache ~1h).
 */
export async function getAllPublishedCourses() {
  try {
    return await getAllPublishedCoursesData();
  } catch (error) {
    console.error('getAllPublishedCourses error:', error);

    // In dev, log the error without breaking the whole page.
    // Return an empty courses array instead.
    return [];
  }
}

/**
 * Course summary for APIs/lists (reduced payload).
 */
export async function getPublishedCoursesSummary() {
  try {
    return await getPublishedCoursesSummaryData();
  } catch (error) {
    console.error('getPublishedCoursesSummary error:', error);
    return [];
  }
}

/**
 * Published courses the user can practice (active subscription).
 * Admins see the full catalog.
 */
export async function getAccessibleCoursesForUser(
  userId: string | null | undefined,
  hasAdminAccess: boolean = false,
) {
  const { getUserActiveSubscription } = await import('./subscription-access');
  const courses = await getPublishedCoursesSummary();

  if (hasAdminAccess) return courses;
  if (!userId) return [];

  const sub = await getUserActiveSubscription(userId);
  if (!sub) return [];
  if (sub.plan === 'ALL_ACCESS') return courses;
  if (sub.plan === 'SINGLE_COURSE' && sub.courseId) {
    return courses.filter((course) => course.id === sub.courseId);
  }

  return [];
}

export type GetCourseBySlugOptions = {
  /**
   * If true, includes draft courses (server-only, after admin check).
   */
  allowUnpublished?: boolean;
};

/**
 * Fetch a course by slug with modules and quizzes
 */
export async function getCourseBySlug(slug: string, options?: GetCourseBySlugOptions) {
  try {
    const course = await prisma.course.findFirst({
      where: {
        slug,
        ...(options?.allowUnpublished ? {} : { status: 'published' as const }),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        modules: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            order: true,
            quizzes: {
              select: {
                id: true,
                slug: true,
                title: true,
                description: true,
                excerpt: true,
                duration: true,
                difficulty: true,
                passingGrade: true,
                randomizeOrder: true,
                maxQuestions: true,
                featuredImage: true,
                featuredImageUrl: true,
                order: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                  select: {
                    questions: true,
                  },
                },
              },
              orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
            },
            lessons: {
              select: {
                id: true,
                title: true,
                slug: true,
                order: true,
                videoPlaybackSeconds: true,
                allowPreview: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
            _count: {
              select: {
                quizzes: true,
                lessons: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!course) {
      return null;
    }

    // Convert quizzes to the format expected by the frontend
    const courseWithConvertedQuizzes = {
      ...course,
      modules: course.modules.map((module) => ({
        ...module,
        quizzes: module.quizzes.map(convertPrismaQuizToQuiz),
      })),
    };

    return courseWithConvertedQuizzes;
  } catch (error) {
    console.error(`getCourseBySlug(${slug}) error:`, error);
    
    // Check if this is a connection error
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('connect') || errorMessage.includes('connection') || errorMessage.includes('database')) {
        throw new Error('Database connection error. Please check your DATABASE_URL configuration.');
      }
    }
    
    return null;
  }
}

/**
 * Fetch count of published courses by test type and return link slugs
 */
export async function getCourseStatsByTestType() {
  try {
    const courses = await getCourses();

    // Filter courses by test type based on title or slug
    const actCourses = courses.filter(
      (course) =>
        course.title.toLowerCase().includes('act') ||
        course.slug.toLowerCase().includes('act')
    );

    const satCourses = courses.filter(
      (course) =>
        (course.title.toLowerCase().includes('sat') &&
          !course.title.toLowerCase().includes('psat')) ||
        (course.slug.toLowerCase().includes('sat') &&
          !course.slug.toLowerCase().includes('psat'))
    );

    const psatCourses = courses.filter(
      (course) =>
        course.title.toLowerCase().includes('psat') ||
        course.slug.toLowerCase().includes('psat')
    );

    return {
      act: {
        count: actCourses.length,
        slug: actCourses.length > 0 ? actCourses[0].slug : null,
      },
      sat: {
        count: satCourses.length,
        slug: satCourses.length > 0 ? satCourses[0].slug : null,
      },
      psat: {
        count: psatCourses.length,
        slug: psatCourses.length > 0 ? psatCourses[0].slug : null,
      },
    };
  } catch (error) {
    console.error('getCourseStatsByTestType error:', error);
    return {
      act: { count: 0, slug: null },
      sat: { count: 0, slug: null },
      psat: { count: 0, slug: null },
    };
  }
}
