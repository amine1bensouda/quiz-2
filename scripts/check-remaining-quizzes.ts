import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

if (process.env.DATABASE_URL) {
  let dbPath = process.env.DATABASE_URL.replace(/^file:/, '');
  if (!dbPath.startsWith('/') && !dbPath.match(/^[A-Z]:/)) {
    dbPath = resolve(process.cwd(), dbPath);
  }
  process.env.DATABASE_URL = `file:${dbPath}`;
}

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

(async () => {
  const allQuizzes = await prisma.quiz.findMany({
    where: {
      module: {
        course: {
          slug: 'all-quizzes',
        },
      },
    },
    select: {
      title: true,
      slug: true,
    },
  });

  console.log(`\n📝 Quiz restants dans "Tous les Quiz": ${allQuizzes.length}\n`);
  allQuizzes.forEach((q) => console.log(`  - ${q.title} (${q.slug})`));

  // Vérifier aussi les cours et leurs quiz
  console.log('\n📚 Résumé de tous les cours:\n');
  const courses = await prisma.course.findMany({
    include: {
      modules: {
        include: {
          _count: {
            select: { quizzes: true },
          },
        },
      },
    },
    orderBy: {
      title: 'asc',
    },
  });

  for (const course of courses) {
    const totalQuizzes = course.modules.reduce(
      (sum, module) => sum + module._count.quizzes,
      0
    );
    console.log(`  - ${course.title}: ${totalQuizzes} quiz`);
  }

  await prisma.$disconnect();
})();
