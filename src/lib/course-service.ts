import { prisma } from './db';
import { getAllPublishedCoursesData, getCourses, getPublishedCoursesSummaryData } from './cache';
import { convertPrismaQuizToQuiz } from './quiz-service';

/**
 * Service pour gérer les cours avec Prisma
 */

/**
 * Récupère tous les cours publiés avec leurs modules et quiz (cache Next ~1 h).
 */
export async function getAllPublishedCourses() {
  try {
    return await getAllPublishedCoursesData();
  } catch (error) {
    console.error('Erreur getAllPublishedCourses:', error);

    // En dev, on logue l'erreur mais on ne casse pas toute la page.
    // On retourne simplement un tableau vide de cours.
    return [];
  }
}

/**
 * Résumé de cours pour APIs/listes (payload réduit).
 */
export async function getPublishedCoursesSummary() {
  try {
    return await getPublishedCoursesSummaryData();
  } catch (error) {
    console.error('Erreur getPublishedCoursesSummary:', error);
    return [];
  }
}

/**
 * Récupère un cours par son slug avec ses modules et quiz
 */
export async function getCourseBySlug(slug: string) {
  try {
    const course = await prisma.course.findFirst({
      where: {
        slug,
        status: 'published',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
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

    // Convertir les quiz au format attendu par le frontend
    const courseWithConvertedQuizzes = {
      ...course,
      modules: course.modules.map((module) => ({
        ...module,
        quizzes: module.quizzes.map(convertPrismaQuizToQuiz),
      })),
    };

    return courseWithConvertedQuizzes;
  } catch (error) {
    console.error(`Erreur getCourseBySlug(${slug}):`, error);
    
    // Vérifier si c'est une erreur de connexion
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
 * Récupère le nombre de cours publiés par type de test et retourne les slugs pour les liens
 */
export async function getCourseStatsByTestType() {
  try {
    const courses = await getCourses();

    // Filtrer les cours par type de test en fonction du titre ou slug
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
    console.error('Erreur getCourseStatsByTestType:', error);
    return {
      act: { count: 0, slug: null },
      sat: { count: 0, slug: null },
      psat: { count: 0, slug: null },
    };
  }
}
