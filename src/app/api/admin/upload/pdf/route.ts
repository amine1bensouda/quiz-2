import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const ALLOWED_TYPE = 'application/pdf';
const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No PDF file provided. Use field name "pdf".' },
        { status: 400 }
      );
    }
    if (file.type !== ALLOWED_TYPE) {
      return NextResponse.json(
        { error: 'Invalid file type. Use PDF only.' },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Max 50 MB.' },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name) || '.pdf';
    const filename = `${randomUUID()}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'pdfs');
    await mkdir(uploadDir, { recursive: true });
    const filepath = path.join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    const url = baseUrl ? `${baseUrl}/uploads/pdfs/${filename}` : `/uploads/pdfs/${filename}`;
    return NextResponse.json({ url });
  } catch (error: unknown) {
    console.error('Upload PDF error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
