import { revalidateTag, unstable_cache } from 'next/cache';
import { prisma } from './db';

/**
 * Tag Next.js pour invalider tout le cache cours d’un coup.
 * Appeler revalidateTag(COURSES_CACHE_TAG) après create/update/delete côté admin.
 */
export const COURSES_CACHE_TAG = 'courses';
export const BLOGS_CACHE_TAG = 'blogs';
export const QUIZZES_CACHE_TAG = 'quizzes';
export const PAGES_CACHE_TAG = 'custom-pages';

const coursesCacheConfig = {
  revalidate: 3600,
  tags: [COURSES_CACHE_TAG],
};

const blogsCacheConfig = {
  revalidate: 900,
  tags: [BLOGS_CACHE_TAG],
};

const quizzesCacheConfig = {
  revalidate: 900,
  tags: [QUIZZES_CACHE_TAG],
};

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

/** Liste des blogs en base (tous statuts) pour lister ce qui est ajouté. */
export const getAllBlogsData = unstable_cache(
  async () => {
    return prisma.blogPost.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        category: true,
        tags: true,
        ctaLink: true,
        ctaText: true,
        publishedAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },
  ['blogs-all-list'],
  blogsCacheConfig
);

/** Blog par id ou slug (tous statuts). */
export const getBlogByIdOrSlugData = unstable_cache(
  async (idOrSlug: string) => {
    const blog =
      (await prisma.blogPost.findUnique({ where: { id: idOrSlug } })) ??
      (await prisma.blogPost.findUnique({ where: { slug: idOrSlug } }));
    return blog ?? null;
  },
  ['blogs-by-id-or-slug'],
  blogsCacheConfig
);

/** Liste publique des blogs publiés (pages frontend). */
export const getAllPublishedBlogsData = unstable_cache(
  async () => {
    return prisma.blogPost.findMany({
      where: {
        status: 'published',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        category: true,
        tags: true,
        ctaLink: true,
        ctaText: true,
        publishedAt: true,
        createdAt: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });
  },
  ['blogs-published-list'],
  blogsCacheConfig
);

/** Blog public publié par id ou slug (pages frontend). */
export const getPublishedBlogByIdOrSlugData = unstable_cache(
  async (idOrSlug: string) => {
    const byId = await prisma.blogPost.findFirst({
      where: {
        id: idOrSlug,
        status: 'published',
      },
    });
    if (byId) return byId;

    const bySlug = await prisma.blogPost.findFirst({
      where: {
        slug: idOrSlug,
        status: 'published',
      },
    });
    return bySlug ?? null;
  },
  ['blogs-published-by-id-or-slug'],
  blogsCacheConfig
);

/** Liste légère de quiz publiés, cacheable (API publiques). */
export const getPublishedQuizListData = unstable_cache(
  async (moduleSlug?: string, limit?: number) => {
    const take = limit && Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : undefined;

    const quizzes = await prisma.quiz.findMany({
      where: {
        OR: [
          {
            module: {
              course: {
                status: 'published',
              },
            },
          },
          {
            moduleId: null,
          },
        ],
        ...(moduleSlug
          ? {
              module: {
                slug: moduleSlug,
                course: {
                  status: 'published',
                },
              },
            }
          : {}),
      },
      ...(take ? { take } : {}),
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        excerpt: true,
        difficulty: true,
        duration: true,
        maxQuestions: true,
        passingGrade: true,
        randomizeOrder: true,
        featuredImage: true,
        featuredImageUrl: true,
        createdAt: true,
        updatedAt: true,
        module: {
          select: {
            slug: true,
            title: true,
            courseId: true,
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return quizzes;
  },
  ['quizzes-published-list'],
  quizzesCacheConfig
);

/** Invalidation centralisée pour toutes les lectures blog. */
export function invalidatePublishedBlogsCache() {
  revalidateTag(BLOGS_CACHE_TAG);
}

/** Invalidation centralisée pour toutes les lectures quiz. */
export function invalidatePublishedQuizzesCache() {
  revalidateTag(QUIZZES_CACHE_TAG);
}

const pagesCacheConfig = {
  revalidate: 900,
  tags: [PAGES_CACHE_TAG],
};

/** Liste publique des pages custom publiées (pour sitemap). */
export const getAllPublishedPagesData = unstable_cache(
  async () => {
    return prisma.customPage.findMany({
      where: {
        status: 'published',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        metaTitle: true,
        metaDescription: true,
        noIndex: true,
        publishedAt: true,
        updatedAt: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });
  },
  ['pages-published-list'],
  pagesCacheConfig
);

/** Page custom publique par slug (front). */
export const getPublishedPageBySlugData = unstable_cache(
  async (slug: string) => {
    return prisma.customPage.findFirst({
      where: {
        slug,
        status: 'published',
      },
    });
  },
  ['pages-published-by-slug'],
  pagesCacheConfig
);

/** Invalidation centralisée pour toutes les lectures de pages custom. */
export function invalidatePublishedPagesCache() {
  revalidateTag(PAGES_CACHE_TAG);
}
