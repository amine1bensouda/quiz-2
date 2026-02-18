import { prisma } from './db';
import type { Quiz, Question, Category } from './types';

/**
 * Service pour gérer les quiz avec Prisma
 * Remplace progressivement wordpress.ts
 */

/**
 * Récupère tous les quiz avec leurs questions
 */
export async function getAllQuiz(): Promise<Quiz[]> {
  try {
    console.log('🔍 getAllQuiz: Début de la récupération...');
    console.log('📁 DATABASE_URL:', process.env.DATABASE_URL ? 'défini' : 'non défini');
    
    const quizzes = await prisma.quiz.findMany({
      where: {
        // Ne récupérer que les quiz dont le cours parent est publié
        module: {
          course: {
            status: 'published',
          },
        },
      },
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

    console.log(`✅ getAllQuiz: ${quizzes.length} quiz publiés récupérés depuis Prisma`);

    // Convertir au format Quiz attendu par le frontend
    const converted = quizzes.map(convertPrismaQuizToQuiz);
    console.log(`✅ getAllQuiz: ${converted.length} quiz convertis`);
    
    return converted;
  } catch (error: any) {
    console.error('❌ Erreur getAllQuiz:', error);
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
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
      include: {
        course: true,
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
 * Convertit un quiz Prisma au format Quiz attendu par le frontend
 */
export function convertPrismaQuizToQuiz(prismaQuiz: any): Quiz {
  const questions = prismaQuiz.questions.map((q: any, index: number) => {
    // Vérifier que les réponses existent
    const answers = q.answers || [];
    
    if (answers.length === 0) {
      console.warn(`⚠️ Question ${index + 1} (ID: ${q.id}, ${q.text?.substring(0, 50)}...) n'a pas de réponses`);
      console.warn('   Structure complète de la question:', {
        id: q.id,
        text: q.text,
        type: q.type,
        answersCount: answers.length,
        hasAnswers: !!q.answers,
        questionKeys: Object.keys(q),
      });
    }
    
    const convertedQuestion = {
      id: q.id,
      texte_question: q.text || '',
      type_question: q.type === 'true_false' ? 'VraiFaux' : (q.type === 'text_input' ? 'TexteLibre' : 'QCM'),
      explication: q.explanation || '',
      points: q.points,
      temps_limite: q.timeLimit || undefined,
      reponses: answers
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
        .map((a: any) => ({
          texte: a.text || '',
          correcte: a.isCorrect || false,
          explication: a.explanation || '',
          imageUrl: a.imageUrl && String(a.imageUrl).trim() ? a.imageUrl : undefined,
        })),
    };
    
    // Log pour déboguer
    if (index < 3) {
      console.log(`📝 Question ${index + 1} convertie:`, {
        id: convertedQuestion.id,
        texte_question: convertedQuestion.texte_question?.substring(0, 50),
        reponsesCount: convertedQuestion.reponses.length,
        type: convertedQuestion.type_question,
      });
    }
    
    return convertedQuestion;
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
      nombre_questions: prismaQuiz.maxQuestions || questions.length,
      score_minimum: prismaQuiz.passingGrade,
      ordre_questions: prismaQuiz.randomizeOrder ? 'Aleatoire' : 'Fixe',
      questions: questions,
    },
    categories: prismaQuiz.module ? [prismaQuiz.module.slug] : [],
    date: prismaQuiz.createdAt.toISOString(),
    modified: prismaQuiz.updatedAt.toISOString(),
  };
}
