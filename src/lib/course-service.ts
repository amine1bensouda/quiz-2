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
    return null;
  }
}

/**
 * Récupère le nombre de cours publiés par type de test
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
    });

    // Compter les cours par type de test en fonction du titre ou slug
    const actCount = courses.filter(
      (course) =>
        course.title.toLowerCase().includes('act') ||
        course.slug.toLowerCase().includes('act')
    ).length;

    const satCount = courses.filter(
      (course) =>
        (course.title.toLowerCase().includes('sat') &&
          !course.title.toLowerCase().includes('psat')) ||
        (course.slug.toLowerCase().includes('sat') &&
          !course.slug.toLowerCase().includes('psat'))
    ).length;

    const psatCount = courses.filter(
      (course) =>
        course.title.toLowerCase().includes('psat') ||
        course.slug.toLowerCase().includes('psat')
    ).length;

    return {
      act: actCount,
      sat: satCount,
      psat: psatCount,
    };
  } catch (error) {
    console.error('Erreur getCourseStatsByTestType:', error);
    return {
      act: 0,
      sat: 0,
      psat: 0,
    };
  }
}
