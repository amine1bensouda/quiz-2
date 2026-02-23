import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const ALLOWED_TYPES = ['video/mp4', 'video/webm'];
const MAX_SIZE = 200 * 1024 * 1024; // 200 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('video') as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No video file provided. Use field name "video".' },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Use MP4 or WebM.' },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Max 200 MB.' },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name) || (file.type === 'video/mp4' ? '.mp4' : '.webm');
    const filename = `${randomUUID()}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'videos');
    await mkdir(uploadDir, { recursive: true });
    const filepath = path.join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    const url = baseUrl ? `${baseUrl}/uploads/videos/${filename}` : `/uploads/videos/${filename}`;
    return NextResponse.json({ url });
  } catch (error: unknown) {
    console.error('Upload video error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
