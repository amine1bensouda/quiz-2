import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/db';

type QuizFixConfig = {
  slug: string;
  questionNumbers: number[];
};

const QUIZ_FIXES: QuizFixConfig[] = [
  {
    slug: 'act-exam-1',
    questionNumbers: [9, 12, 13, 14, 15, 16, 37, 39, 40, 42, 43],
  },
  {
    slug: 'act-timed-mini-exam-25',
    questionNumbers: [5, 6, 7, 8, 9, 10],
  },
  {
    slug: 'act-timed-mini-exam-27',
    questionNumbers: [2],
  },
  {
    slug: 'perimeter-area-volume-quiz-6',
    questionNumbers: [1],
  },
  {
    slug: 'act-statistics-quiz-3',
    questionNumbers: [5],
  },
];

function getWordPressBaseUrl(): string {
  const fromEnv =
    process.env.WORDPRESS_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    'https://crackthecurve.com';

  return fromEnv.replace(/\/$/, '');
}

function extractFirstImageUrl(input: unknown): string | null {
  if (!input || typeof input !== 'string') return null;
  const html = input.trim();
  if (!html) return null;

  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch?.[1]) return imgMatch[1].trim();

  const directUrlMatch = html.match(/https?:\/\/[^\s"'<>]+\.(png|jpe?g|gif|webp|svg)(\?[^\s"'<>]*)?/i);
  if (directUrlMatch?.[0]) return directUrlMatch[0].trim();

  const uploadsPathMatch = html.match(/\/wp-content\/uploads\/[^\s"'<>]+/i);
  if (uploadsPathMatch?.[0]) return uploadsPathMatch[0].trim();

  return null;
}

function getQuestionTextCandidate(question: any): string {
  const candidates = [
    question?.question_title,
    question?.question,
    question?.title,
    question?.question_text,
    question?.content,
    question?.post_content,
    question?.post_title,
    question?.description,
  ];

  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c;
    if (c && typeof c === 'object' && typeof c.rendered === 'string' && c.rendered.trim()) {
      return c.rendered;
    }
  }
  return '';
}

function extractImageFromQuestionPayload(question: any): string | null {
  const candidates = [
    question?.media_url,
    question?.image_url,
    question?.question_image_url,
    question?.question_image,
    question?.media,
    question?.featured_image_url,
    question?.featured_media_url,
    question?.attachment_url,
    question?.image,
  ];

  for (const candidate of candidates) {
    const fromCandidate = extractFirstImageUrl(candidate);
    if (fromCandidate) return fromCandidate;
  }

  const fromText = extractFirstImageUrl(getQuestionTextCandidate(question));
  if (fromText) return fromText;

  return null;
}

function prependImageToQuestionText(originalText: string, imageUrl: string): string {
  const trimmed = (originalText || '').trim();
  const imageBlock = `<p><img src="${imageUrl}" alt="Question image" /></p>`;

  if (!trimmed) return imageBlock;
  if (/<img[^>]+src=["'][^"']+["']/i.test(trimmed)) return trimmed;

  return `${imageBlock}\n${trimmed}`;
}

async function fetchWordPressQuizQuestions(baseUrl: string, quizSlug: string): Promise<any[]> {
  let quizId: number | null = null;

  try {
    const bySlug = await axios.get(`${baseUrl}/wp-json/tutor/v1/quiz/${quizSlug}`, {
      timeout: 15_000,
    });
    const payload = bySlug.data;
    quizId = Number(payload?.ID || payload?.id || payload?.quiz_id || 0) || null;
  } catch {
    // fallback below
  }

  if (!quizId) {
    const allQuizzes = await axios.get(`${baseUrl}/wp-json/tutor/v1/quizzes`, {
      params: { per_page: 200 },
      timeout: 15_000,
    });
    const quizRows = allQuizzes.data?.data || allQuizzes.data || [];
    const found = Array.isArray(quizRows)
      ? quizRows.find((q: any) => q?.post_name === quizSlug || q?.slug === quizSlug)
      : null;
    quizId = found ? Number(found.ID || found.id || 0) || null : null;
  }

  if (!quizId) {
    throw new Error(`Impossible de trouver le quiz "${quizSlug}" côté WordPress.`);
  }

  const questionsRes = await axios.get(`${baseUrl}/wp-json/tutor/v1/questions`, {
    params: { quiz_id: quizId },
    timeout: 20_000,
  });

  const rawQuestions = questionsRes.data?.data || questionsRes.data || [];
  if (!Array.isArray(rawQuestions)) {
    throw new Error('Format inattendu pour la liste des questions WordPress.');
  }

  return rawQuestions;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const uploadsDirArg = process.argv.find((arg) => arg.startsWith('--uploads-dir='))?.split('=')[1];
  const uploadsBaseUrlArg = process.argv
    .find((arg) => arg.startsWith('--uploads-base-url='))
    ?.split('=')[1];
  const wpBaseUrl = getWordPressBaseUrl();
  const uploadsDir = uploadsDirArg || 'C:\\xampp\\htdocs\\quiz-image-word\\wp-content\\uploads';
  const uploadsBaseUrl = (
    uploadsBaseUrlArg ||
    `${wpBaseUrl.replace(/\/$/, '')}/wp-content/uploads`
  ).replace(/\/$/, '');

  console.log(`WordPress: ${wpBaseUrl}`);
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY RUN'}`);
  console.log(`Uploads dir: ${uploadsDir}`);
  console.log(`Uploads base URL: ${uploadsBaseUrl}`);

  if (!fs.existsSync(uploadsDir)) {
    console.log('⚠️ Dossier uploads introuvable localement, fallback API uniquement.');
  } else {
    try {
      const sampleYears = fs
        .readdirSync(uploadsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .slice(0, 8);
      console.log(`Sous-dossiers détectés dans uploads: ${sampleYears.join(', ') || '(aucun)'}`);
    } catch {
      console.log('⚠️ Impossible de lire le dossier uploads local.');
    }
  }

  let totalUpdatedCount = 0;

  for (const fix of QUIZ_FIXES) {
    console.log('\n----------------------------------------');
    console.log(`Quiz: ${fix.slug}`);
    console.log(`Questions ciblées: ${fix.questionNumbers.join(', ')}`);

    const wpQuestions = await fetchWordPressQuizQuestions(wpBaseUrl, fix.slug);
    console.log(`Questions WordPress trouvées: ${wpQuestions.length}`);

    const imageByNumber = new Map<number, string>();
    wpQuestions.forEach((q: any, index: number) => {
      const questionNumber = index + 1;
      const image = extractImageFromQuestionPayload(q);
      if (image) imageByNumber.set(questionNumber, image);
    });

    const dbQuiz = await prisma.quiz.findFirst({
      where: { slug: fix.slug },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!dbQuiz) {
      console.log(`Quiz "${fix.slug}" introuvable en base locale, skip.`);
      continue;
    }

    console.log(`Quiz DB trouvé: ${dbQuiz.title} (${dbQuiz.questions.length} questions)`);

    let updatedCountForQuiz = 0;
    for (const questionNumber of fix.questionNumbers) {
      const questionRow = dbQuiz.questions[questionNumber - 1];
      if (!questionRow) {
        console.log(`Q${questionNumber}: introuvable en base (index hors limite)`);
        continue;
      }

      let imageUrl = imageByNumber.get(questionNumber);
      if (imageUrl && imageUrl.startsWith('/wp-content/uploads/')) {
        imageUrl = `${uploadsBaseUrl}${imageUrl.replace('/wp-content/uploads', '')}`;
      }

      if (!imageUrl) {
        console.log(`Q${questionNumber}: image non trouvée dans le payload WordPress`);
        continue;
      }

      if (/<img[^>]+src=["'][^"']+["']/i.test(questionRow.text || '')) {
        console.log(`Q${questionNumber}: image déjà présente, skip`);
        continue;
      }

      const nextText = prependImageToQuestionText(questionRow.text || '', imageUrl);
      console.log(`Q${questionNumber}: ${apply ? 'UPDATE' : 'WOULD UPDATE'} -> ${imageUrl}`);

      if (apply) {
        await prisma.question.update({
          where: { id: questionRow.id },
          data: { text: nextText },
        });
        updatedCountForQuiz++;
      }
    }

    totalUpdatedCount += updatedCountForQuiz;
    console.log(`Mises à jour pour ${fix.slug}: ${updatedCountForQuiz}`);
  }

  console.log('\n========================================');
  console.log(`Terminé. Questions mises à jour (total): ${totalUpdatedCount}`);
  if (!apply) {
    console.log('Relancez avec --apply pour écrire les changements en base.');
  }
}

main()
  .catch((error) => {
    console.error('Erreur script:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
