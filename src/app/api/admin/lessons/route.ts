import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateSlug } from '@/lib/utils';

/**
 * GET /api/admin/lessons?moduleId=xxx
 * Liste les leçons (optionnel: filtrer par moduleId)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');

    const where = moduleId && moduleId.trim() ? { moduleId: moduleId.trim() } : {};
    const lessons = await prisma.lesson.findMany({
      where,
      include: {
        module: { select: { id: true, title: true, course: true } },
      },
      orderBy: [{ moduleId: 'asc' }, { order: 'asc' }],
    });
    return NextResponse.json(lessons);
  } catch (error: any) {
    console.error('GET /api/admin/lessons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lessons', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/lessons
 * Crée une nouvelle leçon
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      slug,
      moduleId,
      content,
      featuredImageUrl,
      videoUrl,
      videoPlaybackSeconds,
      pdfUrl,
      allowPreview,
      order,
    } = body;

    if (!title || typeof title !== 'string' || !moduleId || typeof moduleId !== 'string') {
      return NextResponse.json(
        { error: 'Title and moduleId are required' },
        { status: 400 }
      );
    }

    const moduleExists = await prisma.module.findUnique({
      where: { id: moduleId.trim() },
      select: { id: true },
    });
    if (!moduleExists) {
      return NextResponse.json(
        { error: 'Invalid module', details: 'The selected module does not exist' },
        { status: 400 }
      );
    }

    const baseSlug = (slug && String(slug).trim()) || generateSlug(title);
    let finalSlug = baseSlug;
    let counter = 0;
    while (true) {
      const existing = await prisma.lesson.findUnique({
        where: { moduleId_slug: { moduleId: moduleId.trim(), slug: finalSlug } },
      });
      if (!existing) break;
      counter++;
      finalSlug = `${baseSlug}-${counter}`;
    }

    const lesson = await prisma.lesson.create({
      data: {
        moduleId: moduleId.trim(),
        title: title.trim(),
        slug: finalSlug,
        content: (content != null && typeof content === 'string') ? content : '',
        featuredImageUrl: (featuredImageUrl != null && String(featuredImageUrl).trim()) ? String(featuredImageUrl).trim() : null,
        videoUrl: (videoUrl != null && String(videoUrl).trim()) ? String(videoUrl).trim() : null,
        videoPlaybackSeconds: (videoPlaybackSeconds != null && videoPlaybackSeconds !== '') ? Math.max(0, Math.floor(Number(videoPlaybackSeconds))) : null,
        pdfUrl: (pdfUrl != null && String(pdfUrl).trim()) ? String(pdfUrl).trim() : null,
        allowPreview: allowPreview === true || allowPreview === 'true',
        order: (order != null && order !== '') ? Math.max(0, Math.floor(Number(order))) : 0,
      },
      include: {
        module: { include: { course: true } },
      },
    });
    return NextResponse.json(lesson);
  } catch (error: any) {
    console.error('POST /api/admin/lessons:', error);
    return NextResponse.json(
      { error: 'Failed to create lesson', details: error.message },
      { status: 500 }
    );
  }
}
