import type { Prisma } from '@prisma/client';
import { unstable_cache } from 'next/cache';
import { prisma } from './db';
import type { Quiz, Question, Category } from './types';
import { getPublishedQuizListData, QUIZZES_CACHE_TAG } from './cache';

/**
 * Service pour gérer les quiz avec Prisma
 * Remplace progressivement wordpress.ts
 */

/** Filtre partagé : quiz visibles (cours publié ou sans module) — stats, listes, etc. */
export const PUBLISHED_QUIZ_WHERE: Prisma.QuizWhereInput = {
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
};

const getFeaturedQuizzesUncached = async () => {
  return prisma.quiz.findMany({
    where: PUBLISHED_QUIZ_WHERE,
    take: 6,
    include: {
      module: {
        include: {
          course: true,
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
};

const getFeaturedQuizzesCached = unstable_cache(
  async () => getFeaturedQuizzesUncached(),
  ['home-featured-quizzes'],
  { revalidate: 3600, tags: [QUIZZES_CACHE_TAG] }
);

/**
 * Récupère tous les quiz avec leurs questions
 */
export async function getAllQuiz(): Promise<Quiz[]> {
  try {
    const quizzes = await prisma.quiz.findMany({
      where: PUBLISHED_QUIZ_WHERE,
      include: {
        module: {
          include: {
            course: true,
          },
        },
        questions: {
          include: {
            answers: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Convertir au format Quiz attendu par le frontend
    const converted = quizzes.map(convertPrismaQuizToQuiz);
    return converted;
  } catch (error: any) {
    console.error('❌ Erreur getAllQuiz:', error);
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    return [];
  }
}

/**
 * Récupère les quiz en vedette pour la home (léger + cache).
 */
export async function getFeaturedQuiz(): Promise<Quiz[]> {
  try {
    const quizzes = await getFeaturedQuizzesCached();
    return quizzes.map(convertPrismaQuizToQuiz);
  } catch (error) {
    console.error('❌ Erreur getFeaturedQuiz:', error);
    return [];
  }
}

/**
 * Liste légère de quiz pour APIs/listes (sans questions/réponses).
 */
export async function getQuizList(options?: {
  limit?: number;
  moduleSlug?: string;
}): Promise<Quiz[]> {
  try {
    const take = options?.limit && options.limit > 0 ? Math.min(options.limit, 100) : undefined;
    const moduleSlug = options?.moduleSlug?.trim();
    const quizzes = await getPublishedQuizListData(moduleSlug || undefined, take);

    return quizzes.map(convertPrismaQuizToQuiz);
  } catch (error) {
    console.error('Erreur getQuizList:', error);
    return [];
  }
}

/**
 * Récupère un quiz par son slug
 * Gère les slugs avec espaces (anciens quiz) et les slugs normalisés
 */
export async function getQuizBySlug(slug: string): Promise<Quiz | null> {
  try {
    // Décoder le slug pour gérer les espaces encodés (%20)
    const decodedSlug = decodeURIComponent(slug);
    
    // Essayer d'abord avec le slug exact
    let quiz = await prisma.quiz.findUnique({
      where: { slug: decodedSlug },
      include: {
        module: {
          include: {
            course: true,
          },
        },
        questions: {
          include: {
            answers: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    // Si pas trouvé et que le slug contient des espaces, essayer avec des tirets
    if (!quiz && decodedSlug.includes(' ')) {
      const normalizedSlug = decodedSlug.replace(/\s+/g, '-').toLowerCase();
      quiz = await prisma.quiz.findFirst({
        where: { slug: normalizedSlug },
        include: {
          module: {
            include: {
              course: true,
            },
          },
          questions: {
            include: {
              answers: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      });
    }

    // Si pas trouvé et que le slug contient des tirets, essayer avec des espaces
    if (!quiz && decodedSlug.includes('-')) {
      const slugWithSpaces = decodedSlug.replace(/-/g, ' ');
      quiz = await prisma.quiz.findFirst({
        where: { slug: slugWithSpaces },
        include: {
          module: {
            include: {
              course: true,
            },
          },
          questions: {
            include: {
              answers: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      });
    }

    if (!quiz) return null;

    // Vérifier que le cours est publié
    if (quiz.module && quiz.module.course.status !== 'published') {
      console.log(`⚠️ Quiz ${slug} non accessible: cours en brouillon`);
      return null;
    }

    return convertPrismaQuizToQuiz(quiz);
  } catch (error) {
    console.error(`Erreur getQuizBySlug(${slug}):`, error);
    return null;
  }
}

/**
 * Récupère tous les slugs de quiz
 */
export async function getAllQuizSlugs(): Promise<string[]> {
  try {
    const quizzes = await prisma.quiz.findMany({
      select: {
        slug: true,
      },
    });

    return quizzes.map((q) => q.slug);
  } catch (error) {
    console.error('Erreur getAllQuizSlugs:', error);
    return [];
  }
}

/**
 * Récupère les quiz d'un module
 */
export async function getQuizByModule(moduleSlug: string): Promise<Quiz[]> {
  try {
    const moduleItem = await prisma.module.findFirst({
      where: { 
        slug: moduleSlug,
        course: {
          status: 'published', // Ne récupérer que les modules de cours publiés
        },
      },
      include: {
        course: true,
      },
    });

    if (!moduleItem) return [];

    // Vérifier que le cours est publié
    if (moduleItem.course.status !== 'published') {
      return [];
    }

    const quizzes = await prisma.quiz.findMany({
      where: { moduleId: moduleItem.id },
      include: {
        module: {
          include: {
            course: true,
          },
        },
        questions: {
          include: {
            answers: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return quizzes.map(convertPrismaQuizToQuiz);
  } catch (error) {
    console.error(`Erreur getQuizByModule(${moduleSlug}):`, error);
    return [];
  }
}

/**
 * Récupère toutes les catégories (modules)
 */
export async function getAllCategories(): Promise<Category[]> {
  try {
    const modules = await prisma.module.findMany({
      where: {
        course: {
          status: 'published', // Ne récupérer que les modules de cours publiés
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        _count: {
          select: {
            quizzes: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    return modules.map((module) => {
      // Convertir l'ID string (cuid) en number pour compatibilité avec le type Category
      const idAsNumber = typeof module.id === 'string' 
        ? module.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % 1000000
        : module.id;
      
      return {
        id: idAsNumber,
        name: module.title,
        slug: module.slug,
        description: module.description || '',
        count: module._count.quizzes,
      };
    });
  } catch (error) {
    console.error('Erreur getAllCategories:', error);
    return [];
  }
}

/**
 * Récupère les cours publiés liés à une catégorie (module) via son slug.
 */
export async function getCoursesByCategorySlug(categorySlug: string): Promise<
  Array<{
    id: string;
    title: string;
    slug: string;
    description: string | null;
    moduleCount: number;
    totalQuizzes: number;
  }>
> {
  try {
    const decodedSlug = decodeURIComponent(categorySlug || '').trim();
    if (!decodedSlug) return [];

    const normalize = (value: string) =>
      value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

    const normalizedSlug = normalize(decodedSlug);

    const courses = await prisma.course.findMany({
      where: {
        status: 'published',
        modules: {
          some: {},
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        modules: {
          select: {
            slug: true,
            title: true,
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

    const filtered = courses.filter((course) =>
      course.modules.some(
        (module) =>
          module.slug === decodedSlug ||
          normalize(module.slug) === normalizedSlug ||
          normalize(module.title) === normalizedSlug
      )
    );

    return filtered.map((course) => ({
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
  } catch (error) {
    console.error(`Erreur getCoursesByCategorySlug(${categorySlug}):`, error);
    return [];
  }
}

/**
 * Convertit un quiz Prisma au format Quiz attendu par le frontend
 */
export function convertPrismaQuizToQuiz(prismaQuiz: any): Quiz {
  const toIsoString = (value: unknown): string => {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    }
    return new Date(0).toISOString();
  };

  const rawQuestions = Array.isArray(prismaQuiz.questions) ? prismaQuiz.questions : [];
  const questions = rawQuestions.map((q: any) => {
    const answers = Array.isArray(q.answers) ? q.answers : [];
    const typeQuestion = q.type === 'true_false' ? 'VraiFaux' : (q.type === 'text_input' ? 'TexteLibre' : 'QCM');

    return {
      id: q.id,
      texte_question: q.text || '',
      type_question: typeQuestion,
      explication: q.explanation || '',
      points: q.points,
      temps_limite: q.timeLimit || undefined,
      reponses: answers
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
        .map((a: any) => ({
          texte: a.text || '',
          correcte: a.isCorrect || false,
          explication: a.explanation || '',
          imageUrl: a.imageUrl && String(a.imageUrl).trim() ? a.imageUrl : undefined,
        })),
    };
  });

  // Convertir l'ID string (cuid) en number pour compatibilité avec le type Quiz (affichage / ancien code)
  const idAsNumber = typeof prismaQuiz.id === 'string'
    ? prismaQuiz.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % 1000000
    : prismaQuiz.id;

  return {
    id: idAsNumber,
    prismaId: typeof prismaQuiz.id === 'string' ? prismaQuiz.id : undefined,
    slug: prismaQuiz.slug,
    title: {
      rendered: prismaQuiz.title,
    },
    content: {
      rendered: prismaQuiz.description || '',
    },
    excerpt: {
      rendered: prismaQuiz.excerpt || '',
    },
    featured_media: 0,
    featured_media_url: prismaQuiz.featuredImageUrl || prismaQuiz.featuredImage || undefined,
    acf: {
      duree_estimee: prismaQuiz.duration > 0 ? prismaQuiz.duration : undefined,
      niveau_difficulte: (prismaQuiz.difficulty != null && String(prismaQuiz.difficulty).trim()) ? prismaQuiz.difficulty : undefined,
      categorie: prismaQuiz.module?.title?.trim() || undefined,
      nombre_questions: prismaQuiz.maxQuestions || prismaQuiz._count?.questions || questions.length,
      score_minimum: prismaQuiz.passingGrade,
      ordre_questions: prismaQuiz.randomizeOrder ? 'Aleatoire' : 'Fixe',
      questions: questions,
    },
    categories: prismaQuiz.module ? [prismaQuiz.module.slug] : [],
    date: toIsoString(prismaQuiz.createdAt),
    modified: toIsoString(prismaQuiz.updatedAt),
  };
}
