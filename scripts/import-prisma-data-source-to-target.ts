/**
 * Copie toutes les donnees du schema Prisma depuis une base PostgreSQL source
 * vers la base definie par DATABASE_URL (ex. Neon locale / dev).
 *
 * Prisma ne stocke rien sur le disque : les donnees vivent uniquement dans PostgreSQL.
 *
 * Usage (PowerShell) :
 *   $env:SOURCE_DATABASE_URL = "postgresql://postgres:...@db.xxx.supabase.co:5432/postgres"
 *   # La cible est lue depuis .env (DATABASE_URL) automatiquement via dotenv
 *   npx tsx scripts/import-prisma-data-source-to-target.ts
 *
 * Re-import propre (vide la cible puis copie) :
 *   $env:WIPE_TARGET = "1"
 *   npx tsx scripts/import-prisma-data-source-to-target.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const sourceUrl = process.env.SOURCE_DATABASE_URL?.trim();
const targetUrl =
  process.env.TARGET_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();

const wipe =
  process.env.WIPE_TARGET === '1' ||
  process.env.WIPE_TARGET === 'true' ||
  process.argv.includes('--wipe');

async function wipeTarget(target: PrismaClient) {
  console.log('WIPE_TARGET : suppression des donnees sur la base cible...');
  await target.quizAttempt.deleteMany();
  await target.answer.deleteMany();
  await target.question.deleteMany();
  await target.quiz.deleteMany();
  await target.lesson.deleteMany();
  await target.module.deleteMany();
  await target.course.deleteMany();
  await target.user.deleteMany();
  await target.blogPost.deleteMany();
  console.log('Cible videe.');
}

async function main() {
  if (!sourceUrl) {
    console.error(
      'SOURCE_DATABASE_URL manquant (URL directe Supabase, utilisateur postgres).'
    );
    process.exit(1);
  }
  if (!targetUrl) {
    console.error(
      'DATABASE_URL ou TARGET_DATABASE_URL manquant (base cible, ex. Neon).'
    );
    process.exit(1);
  }
  if (sourceUrl === targetUrl) {
    console.error('SOURCE et CIBLE identiques : annule.');
    process.exit(1);
  }

  const source = new PrismaClient({ datasourceUrl: sourceUrl });
  const target = new PrismaClient({ datasourceUrl: targetUrl });

  try {
    await source.$connect();
    await target.$connect();
    await source.course.findFirst();
    console.log('Connexion source OK.');

    if (wipe) {
      await wipeTarget(target);
    }

    console.log('Lecture source + ecriture cible (ordre FK)...');

    const courses = await source.course.findMany();
    if (courses.length) {
      await target.course.createMany({ data: courses, skipDuplicates: true });
      console.log(`  courses: ${courses.length}`);
    }

    const modules = await source.module.findMany();
    if (modules.length) {
      await target.module.createMany({ data: modules, skipDuplicates: true });
      console.log(`  modules: ${modules.length}`);
    }

    const lessons = await source.lesson.findMany();
    if (lessons.length) {
      await target.lesson.createMany({ data: lessons, skipDuplicates: true });
      console.log(`  lessons: ${lessons.length}`);
    }

    const quizzes = await source.quiz.findMany();
    if (quizzes.length) {
      await target.quiz.createMany({ data: quizzes, skipDuplicates: true });
      console.log(`  quizzes: ${quizzes.length}`);
    }

    const users = await source.user.findMany();
    if (users.length) {
      await target.user.createMany({ data: users, skipDuplicates: true });
      console.log(`  users: ${users.length}`);
    }

    const blogPosts = await source.blogPost.findMany();
    if (blogPosts.length) {
      await target.blogPost.createMany({ data: blogPosts, skipDuplicates: true });
      console.log(`  blog_posts: ${blogPosts.length}`);
    }

    const questions = await source.question.findMany();
    if (questions.length) {
      await target.question.createMany({ data: questions, skipDuplicates: true });
      console.log(`  questions: ${questions.length}`);
    }

    const answers = await source.answer.findMany();
    if (answers.length) {
      await target.answer.createMany({ data: answers, skipDuplicates: true });
      console.log(`  answers: ${answers.length}`);
    }

    const attempts = await source.quizAttempt.findMany();
    if (attempts.length) {
      await target.quizAttempt.createMany({ data: attempts, skipDuplicates: true });
      console.log(`  quiz_attempts: ${attempts.length}`);
    }

    console.log('Termine. Verifiez les tables (Neon / Prisma Studio).');
  } finally {
    await source.$disconnect();
    await target.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
