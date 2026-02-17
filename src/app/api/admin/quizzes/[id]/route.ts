import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { generateSlug } from '@/lib/utils';

/**
 * PUT /api/admin/quizzes/[id]
 * Met à jour un quiz existant
 * TODO: Ajouter authentification
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Normaliser le slug si fourni
    const normalizedSlug = slug ? generateSlug(slug) : undefined;

    // Supprimer toutes les questions existantes et leurs réponses
    await prisma.answer.deleteMany({
      where: {
        question: {
          quizId: params.id,
        },
      },
    });
    await prisma.question.deleteMany({
      where: {
        quizId: params.id,
      },
    });

    // Mettre à jour le quiz et créer les nouvelles questions
    const quiz = await prisma.quiz.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(normalizedSlug && { slug: normalizedSlug }),
        ...(moduleId !== undefined && { moduleId: moduleId || null }),
        ...(description !== undefined && { description: description || null }),
        ...(excerpt !== undefined && { excerpt: excerpt || null }),
        ...(duration !== undefined && { duration: (duration === null || duration === '' || Number(duration) <= 0) ? 0 : Math.max(0, Number(duration)) }),
        // Toujours mettre à jour difficulty si présente dans le body (y compris '' pour "Not specified")
        ...('difficulty' in body && { difficulty: (body.difficulty === null || body.difficulty === '') ? '' : body.difficulty }),
        ...(passingGrade !== undefined && { passingGrade }),
        ...(randomizeOrder !== undefined && { randomizeOrder }),
        ...(maxQuestions !== undefined && { maxQuestions: maxQuestions || null }),
        ...(featuredImageUrl !== undefined && { featuredImageUrl: featuredImageUrl || null }),
        ...(questions && {
          questions: {
            create: questions.map((q: any, index: number) => ({
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
        }),
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

    // Invalider le cache de la page quiz pour afficher les nouvelles données
    revalidatePath(`/quiz/${quiz.slug}`);

    return NextResponse.json(quiz);
  } catch (error: any) {
    console.error(`Erreur mise à jour quiz ${params.id}:`, error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update quiz', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/quizzes/[id]
 * Supprime un quiz
 * TODO: Ajouter authentification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.quiz.delete({
      where: { id: params.id },
    });

    revalidatePath('/admin/quizzes');
    revalidatePath('/');
    revalidatePath('/quiz');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Erreur suppression quiz ${params.id}:`, error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete quiz', details: error.message },
      { status: 500 }
    );
  }
}
