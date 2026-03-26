import { revalidateTag, unstable_cache } from 'next/cache';
import { prisma } from './db';

/**
 * Tag Next.js pour invalider tout le cache cours d’un coup.
 * Appeler revalidateTag(COURSES_CACHE_TAG) après create/update/delete côté admin.
 */
export const COURSES_CACHE_TAG = 'courses';

const coursesCacheConfig = {
  revalidate: 3600,
  tags: [COURSES_CACHE_TAG],
} as const;

/**
 * Liste légère des cours publiés — réduit l’egress vs charger toutes les relations.
 * slug inclus pour les liens (/quiz/course/...).
 */
export const getCourses = unstable_cache(
  async () => {
    return prisma.course.findMany({
      where: { status: 'published' },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },
  ['courses-published-minimal'],
  coursesCacheConfig
);

/**
 * Cours publiés avec modules et compteurs — home, page quiz, cartes cours.
 */
export const getAllPublishedCoursesData = unstable_cache(
  async () => {
    return prisma.course.findMany({
      where: { status: 'published' },
      include: {
        modules: {
          include: {
            _count: {
              select: {
                quizzes: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            modules: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },
  ['courses-published-full'],
  coursesCacheConfig
);

/**
 * Résumé des cours publiés pour listes/API (léger par défaut).
 */
export const getPublishedCoursesSummaryData = unstable_cache(
  async () => {
    const courses = await prisma.course.findMany({
      where: { status: 'published' },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        modules: {
          select: {
            _count: {
              select: {
                quizzes: true,
              },
            },
          },
        },
        _count: {
          select: {
            modules: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return courses.map((course) => ({
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      moduleCount: course._count.modules,
      totalQuizzes: course.modules.reduce(
        (sum, module) => sum + (module._count?.quizzes ?? 0),
        0
      ),
    }));
  },
  ['courses-published-summary'],
  coursesCacheConfig
);

/** À appeler après toute mutation de cours côté admin (API routes / server actions). */
export function invalidatePublishedCoursesCache() {
  revalidateTag(COURSES_CACHE_TAG);
}
