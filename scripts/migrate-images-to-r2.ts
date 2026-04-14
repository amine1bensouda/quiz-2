/**
 * Migre les images locales (/uploads/...) vers Cloudflare R2
 * puis met à jour les URLs dans la base Prisma.
 *
 * Usage:
 * - Dry run (par défaut): npx tsx scripts/migrate-images-to-r2.ts
 * - Exécution réelle:      npx tsx scripts/migrate-images-to-r2.ts --apply
 */

import { config } from 'dotenv';
import { resolve, extname, basename } from 'path';
import { access, readFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';

config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

type TargetField = 'featuredImageUrl' | 'featuredImage' | 'imageUrl';
type TargetModel = 'lesson' | 'quiz' | 'answer';

type MigrationTask = {
  model: TargetModel;
  id: string;
  field: TargetField;
  oldUrl: string;
  sourceType: 'local-upload' | 'data-url';
};

const applyChanges = process.argv.includes('--apply');
const dryRun = !applyChanges;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`❌ Variable manquante: ${name}`);
    process.exit(1);
  }
  return value;
}

const accountId = process.env.R2_ACCOUNT_ID || '9a3dd3eab85fa0bc37624ca240487b9b';
const endpoint =
  process.env.R2_ENDPOINT ||
  `https://${accountId}.r2.cloudflarestorage.com`;
const bucket = requireEnv('R2_BUCKET_NAME');
const publicBaseUrl = requireEnv('R2_PUBLIC_BASE_URL');
const r2AccessKeyId = requireEnv('R2_ACCESS_KEY_ID');
const r2SecretAccessKey = requireEnv('R2_SECRET_ACCESS_KEY');

const s3 = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey,
  },
});

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function looksLikeLocalUpload(raw: string): boolean {
  const value = raw.trim();
  if (!value) return false;
  if (value.startsWith('/uploads/')) return true;
  return /\/uploads\//.test(value) && !/^https?:\/\/[^/]*\/cdn\//i.test(value);
}

function looksLikeDataImageUrl(raw: string): boolean {
  const value = raw.trim();
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(value);
}

function extensionFromMimeType(mimeType: string): string {
  const normalized = mimeType.toLowerCase();
  if (normalized === 'image/jpeg' || normalized === 'image/jpg') return '.jpg';
  if (normalized === 'image/png') return '.png';
  if (normalized === 'image/gif') return '.gif';
  if (normalized === 'image/webp') return '.webp';
  if (normalized === 'image/avif') return '.avif';
  if (normalized === 'image/svg+xml') return '.svg';
  return '.bin';
}

function parseDataImageUrl(raw: string): { mimeType: string; buffer: Buffer } | null {
  const value = raw.trim();
  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/i);
  if (!match) return null;

  try {
    const mimeType = match[1].toLowerCase();
    const base64Payload = match[2];
    const buffer = Buffer.from(base64Payload, 'base64');
    if (!buffer.length) return null;
    return { mimeType, buffer };
  } catch {
    return null;
  }
}

function extractUploadPath(rawUrl: string): string | null {
  const value = rawUrl.trim();
  if (value.startsWith('/uploads/')) return value;

  try {
    const parsed = new URL(value);
    const marker = '/uploads/';
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return null;
    return parsed.pathname.slice(idx);
  } catch {
    const marker = '/uploads/';
    const idx = value.indexOf(marker);
    if (idx === -1) return null;
    return value.slice(idx);
  }
}

function getMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.avif') return 'image/avif';
  if (ext === '.svg') return 'image/svg+xml';
  return 'application/octet-stream';
}

function buildR2Key(localUploadPath: string): string {
  const ext = extname(localUploadPath) || '.bin';
  const safeBaseName = basename(localUploadPath, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  return `images/migrated/${safeBaseName}-${randomUUID()}${ext.toLowerCase()}`;
}

async function collectTasks(): Promise<MigrationTask[]> {
  const tasks: MigrationTask[] = [];

  const lessons = await prisma.lesson.findMany({
    select: { id: true, featuredImageUrl: true },
  });
  for (const row of lessons) {
    if (row.featuredImageUrl && looksLikeLocalUpload(row.featuredImageUrl)) {
      tasks.push({
        model: 'lesson',
        id: row.id,
        field: 'featuredImageUrl',
        oldUrl: row.featuredImageUrl,
        sourceType: 'local-upload',
      });
    } else if (row.featuredImageUrl && looksLikeDataImageUrl(row.featuredImageUrl)) {
      tasks.push({
        model: 'lesson',
        id: row.id,
        field: 'featuredImageUrl',
        oldUrl: row.featuredImageUrl,
        sourceType: 'data-url',
      });
    }
  }

  const quizzes = await prisma.quiz.findMany({
    select: { id: true, featuredImage: true, featuredImageUrl: true },
  });
  for (const row of quizzes) {
    if (row.featuredImage && looksLikeLocalUpload(row.featuredImage)) {
      tasks.push({
        model: 'quiz',
        id: row.id,
        field: 'featuredImage',
        oldUrl: row.featuredImage,
        sourceType: 'local-upload',
      });
    } else if (row.featuredImage && looksLikeDataImageUrl(row.featuredImage)) {
      tasks.push({
        model: 'quiz',
        id: row.id,
        field: 'featuredImage',
        oldUrl: row.featuredImage,
        sourceType: 'data-url',
      });
    }
    if (row.featuredImageUrl && looksLikeLocalUpload(row.featuredImageUrl)) {
      tasks.push({
        model: 'quiz',
        id: row.id,
        field: 'featuredImageUrl',
        oldUrl: row.featuredImageUrl,
        sourceType: 'local-upload',
      });
    } else if (row.featuredImageUrl && looksLikeDataImageUrl(row.featuredImageUrl)) {
      tasks.push({
        model: 'quiz',
        id: row.id,
        field: 'featuredImageUrl',
        oldUrl: row.featuredImageUrl,
        sourceType: 'data-url',
      });
    }
  }

  const answers = await prisma.answer.findMany({
    select: { id: true, imageUrl: true },
  });
  for (const row of answers) {
    if (row.imageUrl && looksLikeLocalUpload(row.imageUrl)) {
      tasks.push({
        model: 'answer',
        id: row.id,
        field: 'imageUrl',
        oldUrl: row.imageUrl,
        sourceType: 'local-upload',
      });
    } else if (row.imageUrl && looksLikeDataImageUrl(row.imageUrl)) {
      tasks.push({
        model: 'answer',
        id: row.id,
        field: 'imageUrl',
        oldUrl: row.imageUrl,
        sourceType: 'data-url',
      });
    }
  }

  return tasks;
}

async function updateRecordUrl(task: MigrationTask, newUrl: string) {
  if (task.model === 'lesson') {
    await prisma.lesson.update({
      where: { id: task.id },
      data: { featuredImageUrl: newUrl },
    });
    return;
  }

  if (task.model === 'quiz') {
    if (task.field === 'featuredImage') {
      await prisma.quiz.update({
        where: { id: task.id },
        data: { featuredImageUrl: newUrl, featuredImage: null },
      });
      return;
    }
    await prisma.quiz.update({
      where: { id: task.id },
      data: { featuredImageUrl: newUrl },
    });
    return;
  }

  await prisma.answer.update({
    where: { id: task.id },
    data: { imageUrl: newUrl },
  });
}

async function migrate() {
  console.log(`🚀 Migration images vers R2 (${dryRun ? 'DRY RUN' : 'APPLY'})`);
  console.log(`📦 Bucket: ${bucket}`);
  console.log(`🌐 Endpoint: ${endpoint}`);
  console.log(`🔗 Base URL publique: ${normalizeBaseUrl(publicBaseUrl)}\n`);

  const tasks = await collectTasks();
  if (tasks.length === 0) {
    console.log('✅ Aucune image locale ou base64 à migrer.');
    return;
  }

  const localCount = tasks.filter((task) => task.sourceType === 'local-upload').length;
  const dataCount = tasks.filter((task) => task.sourceType === 'data-url').length;
  console.log(`📋 ${tasks.length} référence(s) trouvée(s): ${localCount} locale(s), ${dataCount} base64.\n`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const [index, task] of tasks.entries()) {
    let key = '';
    let fileBuffer: Buffer | null = null;
    let contentType = 'application/octet-stream';
    let sourceLabel = '';

    if (task.sourceType === 'local-upload') {
      const localUploadPath = extractUploadPath(task.oldUrl);
      if (!localUploadPath) {
        console.log(`⏭️  [${index + 1}/${tasks.length}] URL locale non compatible.`);
        skipped++;
        continue;
      }

      const absoluteLocalPath = resolve(process.cwd(), `public${localUploadPath}`);
      try {
        await access(absoluteLocalPath);
      } catch {
        console.log(`⚠️  [${index + 1}/${tasks.length}] Fichier introuvable: ${absoluteLocalPath}`);
        failed++;
        continue;
      }

      key = buildR2Key(localUploadPath);
      contentType = getMimeType(absoluteLocalPath);
      sourceLabel = localUploadPath;
      if (!dryRun) {
        fileBuffer = await readFile(absoluteLocalPath);
      }
    } else {
      const parsed = parseDataImageUrl(task.oldUrl);
      if (!parsed) {
        console.log(`⚠️  [${index + 1}/${tasks.length}] Data URL invalide.`);
        failed++;
        continue;
      }

      const ext = extensionFromMimeType(parsed.mimeType);
      key = `images/migrated/base64-${randomUUID()}${ext}`;
      contentType = parsed.mimeType;
      sourceLabel = `data-url (${parsed.mimeType})`;
      if (!dryRun) {
        fileBuffer = parsed.buffer;
      }
    }

    const newUrl = `${normalizeBaseUrl(publicBaseUrl)}/${key}`;

    console.log(`➡️  [${index + 1}/${tasks.length}] ${task.model}.${task.field} (${task.id})`);
    console.log(`   Source: ${sourceLabel}`);
    console.log(`   Cible : ${newUrl}`);

    if (dryRun) {
      migrated++;
      continue;
    }

    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: fileBuffer ?? undefined,
          ContentType: contentType,
          CacheControl: 'public, max-age=31536000, immutable',
        })
      );

      await updateRecordUrl(task, newUrl);
      migrated++;
      console.log('   ✅ Upload + update DB ok');
    } catch (error) {
      failed++;
      console.log(`   ❌ Erreur: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log('\n📊 Résumé');
  console.log(`✅ Migrées : ${migrated}`);
  console.log(`⏭️  Ignorées: ${skipped}`);
  console.log(`❌ Erreurs : ${failed}`);
  if (dryRun) {
    console.log('\nℹ️  Exécute avec --apply pour appliquer réellement les changements.');
  }
}

migrate()
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
