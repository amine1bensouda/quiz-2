import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';
import { getImagesUploadDir, isSafeUploadFilename } from '@/lib/local-uploads';

export const dynamic = 'force-dynamic';

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

async function resolveImagePath(filename: string): Promise<string | null> {
  const candidates = [
    path.join(getImagesUploadDir(), filename),
    // Legacy path used before API media route
    path.join(process.cwd(), 'public', 'uploads', 'images', filename),
  ];

  for (const filepath of candidates) {
    try {
      await stat(filepath);
      return filepath;
    } catch {
      // try next
    }
  }
  return null;
}

/**
 * GET /api/media/images/[filename]
 * Serves locally uploaded quiz/editor images (no R2 required).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> | { filename: string } }
) {
  const { filename: raw } = await Promise.resolve(params);
  let filename: string;
  try {
    filename = decodeURIComponent(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  if (!isSafeUploadFilename(filename)) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  const filepath = await resolveImagePath(filename);
  if (!filepath) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const ext = path.extname(filename).toLowerCase();
  const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';
  const bytes = await readFile(filepath);

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': String(bytes.length),
    },
  });
}
