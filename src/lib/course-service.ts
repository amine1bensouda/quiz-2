import { prisma } from './db';
import { convertPrismaQuizToQuiz } from './quiz-service';

/**
 * Service pour gérer les cours avec Prisma
 */

/**
 * Récupère tous les cours publiés avec leurs modules et quiz
 */
export async function getAllPublishedCourses() {
  try {
    // Tester la connexion à la base de données
    await prisma.$connect();
    
    const courses = await prisma.course.findMany({
      where: {
        status: 'published',
      },
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

    return courses;
  } catch (error) {
    console.error('Erreur getAllPublishedCourses:', error);
    
    // Vérifier si c'est une erreur de connexion
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('connect') || errorMessage.includes('connection') || errorMessage.includes('database')) {
        throw new Error('Database connection error. Please check your DATABASE_URL configuration.');
      }
    }
    
    return [];
  }
}

/**
 * Récupère un cours par son slug avec ses modules et quiz
 */
export async function getCourseBySlug(slug: string) {
  try {
    // Tester la connexion à la base de données
    await prisma.$connect();
    
    const course = await prisma.course.findFirst({
      where: {
        slug,
        status: 'published',
      },
      include: {
        modules: {
          include: {
            quizzes: {
              include: {
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
            },
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
    const courses = await prisma.course.findMany({
      where: {
        status: 'published',
      },
      select: {
        title: true,
        slug: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

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
