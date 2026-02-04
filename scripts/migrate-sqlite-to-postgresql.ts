/**
 * Script pour migrer les données de SQLite vers PostgreSQL (Supabase)
 * 
 * Usage:
 * 1. Assurez-vous que DATABASE_URL pointe vers PostgreSQL dans .env.local
 * 2. Exécuter: npx tsx scripts/migrate-sqlite-to-postgresql.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import Database from 'better-sqlite3';
import { PrismaClient } from '@prisma/client';

// Charger .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const sqlitePath = resolve(process.cwd(), 'prisma/dev.db');
const postgresUrl = process.env.DATABASE_URL;

if (!postgresUrl) {
  console.error('❌ DATABASE_URL non défini dans .env.local');
  process.exit(1);
}

// Connexion SQLite (lecture seule)
let sqliteDb: Database.Database | null = null;
try {
  sqliteDb = new Database(sqlitePath, { readonly: true });
  console.log('✅ Connexion SQLite établie');
} catch (error: any) {
  console.log('⚠️  Fichier SQLite non trouvé ou inaccessible');
  sqliteDb = null;
}

// Client PostgreSQL
const postgresPrisma = new PrismaClient();

async function migrateData() {
  console.log('🚀 Migration SQLite → PostgreSQL\n');
  console.log('='.repeat(70));
  console.log('');

  if (!sqliteDb) {
    console.log('⚠️  Aucune base SQLite trouvée');
    console.log('💡 Vous pouvez importer les données depuis WordPress avec:');
    console.log('   npx tsx scripts/import-courses-from-wordpress.ts\n');
    await postgresPrisma.$disconnect();
    return;
  }

  try {
    // 1. Vérifier la connexion PostgreSQL
    console.log('📥 Connexion à PostgreSQL...');
    await postgresPrisma.$connect();
    console.log('✅ Connexion PostgreSQL réussie\n');

    // 2. Compter les données dans SQLite
    const coursesCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM courses').get() as { count: number };
    const modulesCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM modules').get() as { count: number };
    const quizzesCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM quizzes').get() as { count: number };
    const questionsCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM questions').get() as { count: number };
    const answersCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM answers').get() as { count: number };
    const usersCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const quizAttemptsCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM quiz_attempts').get() as { count: number };

    console.log('📊 Données dans SQLite:');
    console.log(`  - Cours: ${coursesCount.count}`);
    console.log(`  - Modules: ${modulesCount.count}`);
    console.log(`  - Quiz: ${quizzesCount.count}`);
    console.log(`  - Questions: ${questionsCount.count}`);
    console.log(`  - Réponses: ${answersCount.count}`);
    console.log(`  - Utilisateurs: ${usersCount.count}`);
    console.log(`  - Tentatives de quiz: ${quizAttemptsCount.count}\n`);

    if (coursesCount.count === 0 && quizzesCount.count === 0) {
      console.log('⚠️  Aucune donnée à migrer depuis SQLite');
      console.log('💡 Vous pouvez importer les données depuis WordPress avec:');
      console.log('   npx tsx scripts/import-courses-from-wordpress.ts\n');
      return;
    }

    // 3. Migrer les cours
    console.log('🔄 Migration des cours...');
    const sqliteCourses = sqliteDb.prepare('SELECT * FROM courses ORDER BY createdAt ASC').all() as any[];

    let coursesMigrated = 0;
    for (const course of sqliteCourses) {
      const existing = await postgresPrisma.course.findUnique({
        where: { slug: course.slug },
      });

      if (!existing) {
        await postgresPrisma.course.create({
          data: {
            id: course.id,
            title: course.title,
            slug: course.slug,
            description: course.description,
            status: (course as any).status || 'draft',
            createdAt: new Date(course.createdAt),
            updatedAt: new Date(course.updatedAt),
          },
        });
        coursesMigrated++;
        console.log(`  ✅ Cours migré: ${course.title}`);
      } else {
        console.log(`  ⏭️  Cours déjà existant: ${course.title}`);
      }
    }
    console.log(`✅ ${coursesMigrated} cours migrés\n`);

    // 4. Migrer les modules
    console.log('🔄 Migration des modules...');
    const sqliteModules = sqliteDb.prepare('SELECT * FROM modules ORDER BY createdAt ASC').all() as any[];

    let modulesMigrated = 0;
    for (const module of sqliteModules) {
      // Vérifier que le cours existe dans PostgreSQL
      const courseExists = await postgresPrisma.course.findUnique({
        where: { id: module.courseId },
      });

      if (!courseExists) {
        console.log(`  ⚠️  Cours ${module.courseId} non trouvé, module ignoré: ${module.title}`);
        continue;
      }

      const existing = await postgresPrisma.module.findFirst({
        where: {
          courseId: module.courseId,
          slug: module.slug,
        },
      });

      if (!existing) {
        await postgresPrisma.module.create({
          data: {
            id: module.id,
            courseId: module.courseId,
            title: module.title,
            slug: module.slug,
            description: module.description,
            order: module.order,
            createdAt: new Date(module.createdAt),
            updatedAt: new Date(module.updatedAt),
          },
        });
        modulesMigrated++;
        console.log(`  ✅ Module migré: ${module.title}`);
      } else {
        console.log(`  ⏭️  Module déjà existant: ${module.title}`);
      }
    }
    console.log(`✅ ${modulesMigrated} modules migrés\n`);

    // 5. Migrer les quiz
    console.log('🔄 Migration des quiz...');
    const sqliteQuizzes = sqliteDb.prepare('SELECT * FROM quizzes ORDER BY createdAt ASC').all() as any[];

    let quizzesMigrated = 0;
    for (const quiz of sqliteQuizzes) {
      const existing = await postgresPrisma.quiz.findUnique({
        where: { slug: quiz.slug },
      });

      if (!existing) {
        // Vérifier que le module existe si moduleId est défini
        if (quiz.moduleId) {
          const moduleExists = await postgresPrisma.module.findUnique({
            where: { id: quiz.moduleId },
          });
          if (!moduleExists) {
            console.log(`  ⚠️  Module ${quiz.moduleId} non trouvé, quiz migré sans module: ${quiz.title}`);
          }
        }

        await postgresPrisma.quiz.create({
          data: {
            id: quiz.id,
            moduleId: quiz.moduleId,
            title: quiz.title,
            slug: quiz.slug,
            description: quiz.description,
            excerpt: quiz.excerpt,
            duration: quiz.duration,
            difficulty: quiz.difficulty,
            passingGrade: quiz.passingGrade,
            randomizeOrder: Boolean(quiz.randomizeOrder),
            maxQuestions: quiz.maxQuestions,
            featuredImage: quiz.featuredImage,
            featuredImageUrl: quiz.featuredImageUrl,
            createdAt: new Date(quiz.createdAt),
            updatedAt: new Date(quiz.updatedAt),
          },
        });
        quizzesMigrated++;
        console.log(`  ✅ Quiz migré: ${quiz.title}`);
      } else {
        console.log(`  ⏭️  Quiz déjà existant: ${quiz.title}`);
      }
    }
    console.log(`✅ ${quizzesMigrated} quiz migrés\n`);

    // 6. Migrer les questions
    console.log('🔄 Migration des questions...');
    const sqliteQuestions = sqliteDb.prepare('SELECT * FROM questions ORDER BY createdAt ASC').all() as any[];

    let questionsMigrated = 0;
    for (const question of sqliteQuestions) {
      // Vérifier que le quiz existe
      const quizExists = await postgresPrisma.quiz.findUnique({
        where: { id: question.quizId },
      });

      if (!quizExists) {
        console.log(`  ⚠️  Quiz ${question.quizId} non trouvé, question ignorée`);
        continue;
      }

      const existing = await postgresPrisma.question.findFirst({
        where: {
          quizId: question.quizId,
          text: question.text,
        },
      });

      if (!existing) {
        await postgresPrisma.question.create({
          data: {
            id: question.id,
            quizId: question.quizId,
            text: question.text,
            type: question.type,
            points: question.points,
            explanation: question.explanation,
            timeLimit: question.timeLimit,
            order: question.order,
            createdAt: new Date(question.createdAt),
            updatedAt: new Date(question.updatedAt),
          },
        });
        questionsMigrated++;
      }
    }
    console.log(`✅ ${questionsMigrated} questions migrées\n`);

    // 7. Migrer les réponses
    console.log('🔄 Migration des réponses...');
    const sqliteAnswers = sqliteDb.prepare('SELECT * FROM answers ORDER BY createdAt ASC').all() as any[];

    let answersMigrated = 0;
    for (const answer of sqliteAnswers) {
      // Vérifier que la question existe
      const questionExists = await postgresPrisma.question.findUnique({
        where: { id: answer.questionId },
      });

      if (!questionExists) {
        continue;
      }

      const existing = await postgresPrisma.answer.findFirst({
        where: {
          questionId: answer.questionId,
          text: answer.text,
        },
      });

      if (!existing) {
        await postgresPrisma.answer.create({
          data: {
            id: answer.id,
            questionId: answer.questionId,
            text: answer.text,
            isCorrect: Boolean(answer.isCorrect),
            explanation: answer.explanation,
            order: answer.order,
            createdAt: new Date(answer.createdAt),
            updatedAt: new Date(answer.updatedAt),
          },
        });
        answersMigrated++;
      }
    }
    console.log(`✅ ${answersMigrated} réponses migrées\n`);

    // 8. Migrer les utilisateurs (sans les mots de passe pour sécurité)
    console.log('🔄 Migration des utilisateurs...');
    const sqliteUsers = sqliteDb.prepare('SELECT * FROM users ORDER BY createdAt ASC').all() as any[];

    let usersMigrated = 0;
    for (const user of sqliteUsers) {
      const existing = await postgresPrisma.user.findUnique({
        where: { email: user.email },
      });

      if (!existing) {
        // Note: Les mots de passe ne peuvent pas être migrés directement
        // car ils sont hashés différemment. Les utilisateurs devront réinitialiser.
        await postgresPrisma.user.create({
          data: {
            id: user.id,
            email: user.email,
            name: user.name,
            password: '$2b$10$PLACEHOLDER_PASSWORD_RESET_REQUIRED', // Mot de passe temporaire
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
          },
        });
        usersMigrated++;
        console.log(`  ✅ Utilisateur migré: ${user.email} (mot de passe à réinitialiser)`);
      } else {
        console.log(`  ⏭️  Utilisateur déjà existant: ${user.email}`);
      }
    }
    console.log(`✅ ${usersMigrated} utilisateurs migrés\n`);

    // 9. Migrer les tentatives de quiz
    console.log('🔄 Migration des tentatives de quiz...');
    const sqliteAttempts = sqliteDb.prepare('SELECT * FROM quiz_attempts ORDER BY createdAt ASC').all() as any[];

    let attemptsMigrated = 0;
    for (const attempt of sqliteAttempts) {
      // Vérifier que l'utilisateur et le quiz existent
      const userExists = await postgresPrisma.user.findUnique({
        where: { id: attempt.userId },
      });
      const quizExists = await postgresPrisma.quiz.findUnique({
        where: { id: attempt.quizId },
      });

      if (!userExists || !quizExists) {
        continue;
      }

      const existing = await postgresPrisma.quizAttempt.findFirst({
        where: {
          userId: attempt.userId,
          quizId: attempt.quizId,
          completedAt: attempt.completedAt,
        },
      });

      if (!existing) {
        await postgresPrisma.quizAttempt.create({
          data: {
            id: attempt.id,
            userId: attempt.userId,
            quizId: attempt.quizId,
            score: attempt.score,
            percentage: attempt.percentage,
            totalQuestions: attempt.totalQuestions,
            correctAnswers: attempt.correctAnswers,
            timeSpent: attempt.timeSpent,
            completedAt: new Date(attempt.completedAt),
            createdAt: new Date(attempt.createdAt),
            updatedAt: new Date(attempt.updatedAt),
          },
        });
        attemptsMigrated++;
      }
    }
    console.log(`✅ ${attemptsMigrated} tentatives migrées\n`);

    // Résumé final
    console.log('='.repeat(70));
    console.log('\n📊 Résumé de la migration:');
    console.log(`  ✅ Cours: ${coursesMigrated}`);
    console.log(`  ✅ Modules: ${modulesMigrated}`);
    console.log(`  ✅ Quiz: ${quizzesMigrated}`);
    console.log(`  ✅ Questions: ${questionsMigrated}`);
    console.log(`  ✅ Réponses: ${answersMigrated}`);
    console.log(`  ✅ Utilisateurs: ${usersMigrated}`);
    console.log(`  ✅ Tentatives: ${attemptsMigrated}`);
    console.log('\n✅ Migration terminée avec succès !');

    if (usersMigrated > 0) {
      console.log('\n⚠️  IMPORTANT: Les utilisateurs migrés doivent réinitialiser leur mot de passe');
    }

  } catch (error: any) {
    console.error('\n❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    if (sqliteDb) {
      sqliteDb.close();
    }
    await postgresPrisma.$disconnect();
  }
}

// Exécuter la migration
migrateData()
  .then(() => {
    console.log('\n🎉 Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
