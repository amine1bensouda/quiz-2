import { unstable_cache } from 'next/cache';
import { prisma } from './db';

const LESSONS_CACHE_TAG = 'lessons';

const getLessonByIdOrSlugCached = unstable_cache(
  async (idOrSlug: string) => {
    const lessonById = await prisma.lesson.findUnique({
      where: { id: idOrSlug },
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
    });

    const lesson =
      lessonById ??
      (await prisma.lesson.findFirst({
        where: { slug: idOrSlug },
        include: {
          module: {
            include: {
              course: true,
            },
          },
        },
      }));

    if (!lesson) {
      return null;
    }

    if (lesson.module && lesson.module.course.status !== 'published') {
      return null;
    }

    return lesson;
  },
  ['lesson-by-id-or-slug'],
  { revalidate: 300, tags: [LESSONS_CACHE_TAG] }
);

export async function getLessonByIdOrSlug(idOrSlug: string) {
  try {
    return await getLessonByIdOrSlugCached(idOrSlug);
  } catch (error) {
    console.error(`Erreur getLessonByIdOrSlug(${idOrSlug}):`, error);
    return null;
  }
}
