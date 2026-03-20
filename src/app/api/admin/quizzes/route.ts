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
      questions: rawQuestions,
    } = body;

    // Validation basique
    if (!title || typeof title !== 'string' || !slug || typeof slug !== 'string') {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      );
    }

    const normalizedSlug = generateSlug(slug);
    const safeModuleId = moduleId && String(moduleId).trim() ? String(moduleId).trim() : null;
    if (safeModuleId) {
      const moduleExists = await prisma.module.findUnique({ where: { id: safeModuleId }, select: { id: true } });
      if (!moduleExists) {
        return NextResponse.json(
          { error: 'Invalid module', details: 'The selected module does not exist' },
          { status: 400 }
        );
      }
    }
    const durationNum = Number(duration);
    const safeDuration = (duration != null && duration !== '' && !Number.isNaN(durationNum))
      ? Math.max(0, Math.floor(durationNum))
      : 0;
    // Chaîne vide si non renseigné (la DB peut avoir une contrainte NOT NULL sur difficulty)
    const safeDifficulty = (difficulty != null && difficulty !== '') ? String(difficulty) : '';
    const safePassingGrade = passingGrade != null && passingGrade !== '' ? Math.max(0, Math.min(100, Number(passingGrade) || 70)) : 70;
    const maxQuestionsNum = (maxQuestions != null && maxQuestions !== '') ? Math.floor(Number(maxQuestions)) : NaN;
    const safeMaxQuestions = Number.isFinite(maxQuestionsNum) && maxQuestionsNum >= 0 ? maxQuestionsNum : null;

    const questionsPayload = Array.isArray(rawQuestions) ? rawQuestions : [];
    const questionsCreate = questionsPayload.map((q: any, index: number) => ({
      text: (q.text ?? q.texte_question ?? '').toString().trim() || 'Question',
      type: (q.type ?? q.type_question ?? 'multiple_choice').toString(),
      points: Math.max(0, Math.floor(Number(q.points) || 1)),
      explanation: (q.explanation ?? q.explication ?? null) != null ? String(q.explanation ?? q.explication) : null,
      timeLimit: (q.timeLimit ?? q.temps_limite) != null && q.timeLimit !== '' ? Math.max(0, Math.floor(Number(q.timeLimit ?? q.temps_limite))) : null,
      order: index,
      answers: {
        create: (Array.isArray(q.answers) ? q.answers : (q.reponses || [])).map((a: any, aIndex: number) => ({
          text: (a.text ?? a.texte ?? '').toString().trim() || 'Answer',
          isCorrect: Boolean(a.isCorrect ?? a.correcte ?? false),
          explanation: (a.explanation ?? a.explication ?? null) != null ? String(a.explanation ?? a.explication) : null,
          imageUrl: (a.imageUrl != null && String(a.imageUrl).trim() !== '') ? String(a.imageUrl).trim() : null,
          order: aIndex,
        })),
      },
    }));

    const quiz = await prisma.quiz.create({
      data: {
        title: title.toString().trim(),
        slug: normalizedSlug,
        moduleId: safeModuleId,
        description: (description != null && description !== '') ? String(description) : null,
        excerpt: (excerpt != null && excerpt !== '') ? String(excerpt) : null,
        duration: safeDuration,
        difficulty: safeDifficulty,
        passingGrade: safePassingGrade,
        randomizeOrder: Boolean(randomizeOrder),
        maxQuestions: safeMaxQuestions,
        featuredImageUrl: (featuredImageUrl != null && featuredImageUrl !== '') ? String(featuredImageUrl) : null,
        questions: { create: questionsCreate },
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
