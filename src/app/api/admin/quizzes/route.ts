import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateSlug } from '@/lib/utils';

/**
 * POST /api/admin/quizzes
 * Crée un nouveau quiz (admin uniquement)
 * TODO: Ajouter authentification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      slug,
      moduleId,
      description,
      excerpt,
      duration,
      difficulty,
      passingGrade,
      randomizeOrder,
      maxQuestions,
      featuredImageUrl,
      questions,
    } = body;

    // Validation basique
    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      );
    }

    // Normaliser le slug (remplacer les espaces et caractères invalides)
    const normalizedSlug = generateSlug(slug);

    // Créer le quiz avec ses questions et réponses
    const quiz = await prisma.quiz.create({
      data: {
        title,
        slug: normalizedSlug,
        moduleId: moduleId || null,
        description: description || null,
        excerpt: excerpt || null,
        duration: (duration !== undefined && duration !== null && duration !== '') ? Math.max(0, Number(duration)) : 0,
        difficulty: (difficulty !== undefined && difficulty !== null && difficulty !== '') ? difficulty : null,
        passingGrade: passingGrade || 70,
        randomizeOrder: randomizeOrder || false,
        maxQuestions: maxQuestions || null,
        featuredImageUrl: featuredImageUrl || null,
        questions: {
          create: (questions || []).map((q: any, index: number) => ({
            text: q.text || q.texte_question || '',
            type: q.type || q.type_question || 'multiple_choice',
            points: q.points || 1,
            explanation: q.explanation || q.explication || null,
            timeLimit: q.timeLimit || q.temps_limite || null,
            order: q.order !== undefined ? q.order : index,
            answers: {
              create: (q.answers || q.reponses || []).map((a: any, aIndex: number) => ({
                text: a.text || a.texte || '',
                isCorrect: a.isCorrect !== undefined ? a.isCorrect : a.correcte || false,
                explanation: a.explanation || a.explication || null,
                order: a.order !== undefined ? a.order : aIndex,
              })),
            },
          })),
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
    });

    return NextResponse.json(quiz, { status: 201 });
  } catch (error: any) {
    console.error('Erreur création quiz:', error);
    
    // Gérer les erreurs de contrainte unique (slug déjà existant)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A quiz with this slug already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create quiz', details: error.message },
      { status: 500 }
    );
  }
}
