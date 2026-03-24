import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateSlug } from '@/lib/utils';

type Params = Promise<{ id: string }> | { id: string };

/**
 * GET /api/admin/lessons/[id]
 */
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const resolved = await Promise.resolve(params);
    const lesson = await prisma.lesson.findUnique({
      where: { id: resolved.id },
      include: {
        module: { include: { course: true } },
      },
    });
    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }
    return NextResponse.json(lesson);
  } catch (error: any) {
    console.error('GET /api/admin/lessons/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/lessons/[id]
 */
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const resolved = await Promise.resolve(params);
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

    const existing = await prisma.lesson.findUnique({
      where: { id: resolved.id },
      include: { module: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    const updateData: {
      title?: string;
      slug?: string;
      moduleId?: string;
      content?: string;
      featuredImageUrl?: string | null;
      videoUrl?: string | null;
      videoPlaybackSeconds?: number | null;
      pdfUrl?: string | null;
      allowPreview?: boolean;
      order?: number;
    } = {};

    if (title !== undefined) updateData.title = String(title).trim();
    if (moduleId !== undefined) {
      const moduleExists = await prisma.module.findUnique({ where: { id: String(moduleId).trim() }, select: { id: true } });
      if (!moduleExists) {
        return NextResponse.json({ error: 'Invalid module' }, { status: 400 });
      }
      updateData.moduleId = String(moduleId).trim();
    }
    if (slug !== undefined) {
      const raw = String(slug).trim() || updateData.title || existing.title;
      updateData.slug = generateSlug(raw);
    }
    if (content !== undefined) updateData.content = typeof content === 'string' ? content : '';
    if (featuredImageUrl !== undefined) updateData.featuredImageUrl = (featuredImageUrl != null && String(featuredImageUrl).trim()) ? String(featuredImageUrl).trim() : null;
    if (videoUrl !== undefined) updateData.videoUrl = (videoUrl != null && String(videoUrl).trim()) ? String(videoUrl).trim() : null;
    if (videoPlaybackSeconds !== undefined) {
      const sec = (videoPlaybackSeconds != null && videoPlaybackSeconds !== '') ? Number(videoPlaybackSeconds) : null;
      updateData.videoPlaybackSeconds = sec != null && !Number.isNaN(sec) ? Math.max(0, Math.floor(sec)) : null;
    }
    if (pdfUrl !== undefined) updateData.pdfUrl = (pdfUrl != null && String(pdfUrl).trim()) ? String(pdfUrl).trim() : null;
    if (allowPreview !== undefined) updateData.allowPreview = allowPreview === true || allowPreview === 'true';
    if (order !== undefined) {
      const num = Number(order);
      updateData.order = !Number.isNaN(num) ? Math.max(0, Math.floor(num)) : 0;
    }

    const lesson = await prisma.lesson.update({
      where: { id: resolved.id },
      data: updateData,
      include: {
        module: { include: { course: true } },
      },
    });
    return NextResponse.json(lesson);
  } catch (error: any) {
    console.error('PUT /api/admin/lessons/[id]:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to update lesson', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/lessons/[id]
 */
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const resolved = await Promise.resolve(params);
    await prisma.lesson.delete({
      where: { id: resolved.id },
    });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('DELETE /api/admin/lessons/[id]:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to delete lesson', details: error.message },
      { status: 500 }
    );
  }
}
