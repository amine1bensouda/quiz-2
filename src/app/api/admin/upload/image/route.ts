import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import path from 'path';
import { randomUUID } from 'crypto';


export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing Cloudflare R2 credentials in environment variables.');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
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

    const bucket = process.env.R2_BUCKET_NAME;
    const cdnBaseUrl = process.env.R2_PUBLIC_BASE_URL;
    if (!bucket || !cdnBaseUrl) {
      return NextResponse.json(
        { error: 'Missing R2_BUCKET_NAME or R2_PUBLIC_BASE_URL in environment variables.' },
        { status: 500 }
      );
    }

    const ext = path.extname(file.name) || (file.type === 'image/jpeg' ? '.jpg' : file.type === 'image/png' ? '.png' : file.type === 'image/gif' ? '.gif' : '.webp');
    const now = new Date();
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const key = `images/${year}/${month}/${randomUUID()}${ext.toLowerCase()}`;
    const bytes = await file.arrayBuffer();

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

    const normalizedBaseUrl = cdnBaseUrl.replace(/\/+$/, '');
    const url = `${normalizedBaseUrl}/${key}`;
    return NextResponse.json({ url });
  } catch (error: unknown) {
    console.error('Upload image error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
