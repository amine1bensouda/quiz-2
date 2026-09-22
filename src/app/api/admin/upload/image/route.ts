import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import {
  ensureImagesUploadDir,
  localImagePublicUrl,
} from '@/lib/local-uploads';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function hasR2Config(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_PUBLIC_BASE_URL
  );
}

function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID!;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function extensionFor(file: File): string {
  const fromName = path.extname(file.name);
  if (fromName) return fromName.toLowerCase();
  if (file.type === 'image/jpeg') return '.jpg';
  if (file.type === 'image/png') return '.png';
  if (file.type === 'image/gif') return '.gif';
  return '.webp';
}

async function uploadToLocal(file: File, bytes: ArrayBuffer): Promise<string> {
  const filename = `${randomUUID()}${extensionFor(file)}`;
  const uploadDir = await ensureImagesUploadDir();
  await writeFile(path.join(uploadDir, filename), Buffer.from(bytes));
  // Relative API URL — works behind nginx/pm2 without R2 or public/ static quirks
  return localImagePublicUrl(filename);
}

async function uploadToR2(file: File, bytes: ArrayBuffer): Promise<string> {
  const bucket = process.env.R2_BUCKET_NAME!;
  const cdnBaseUrl = process.env.R2_PUBLIC_BASE_URL!.replace(/\/+$/, '');
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const key = `images/${year}/${month}/${randomUUID()}${extensionFor(file)}`;

  const r2 = getR2Client();
  await r2.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(bytes),
      ContentType: file.type,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  return `${cdnBaseUrl}/${key}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No image file provided. Use field name "image".' },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Use JPEG, PNG, GIF or WebP.' },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Max 5 MB.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const useR2 = hasR2Config();
    const url = useR2 ? await uploadToR2(file, bytes) : await uploadToLocal(file, bytes);

    return NextResponse.json({
      url,
      storage: useR2 ? 'r2' : 'local',
    });
  } catch (error: unknown) {
    console.error('Upload image error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
