import { NextRequest, NextResponse } from 'next/server';
import { invalidatePublishedPagesCache } from '@/lib/cache';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/pages/[id]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const page = await prisma.customPage.findUnique({ where: { id } });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error: any) {
    console.error('Erreur récupération page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/pages/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const body = await request.json();
    const {
      title,
      slug,
      metaTitle,
      metaDescription,
      html,
      css,
      status,
      noIndex,
    } = body;

    const existing = await prisma.customPage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const wasPublished = existing.status === 'published';
    const isNowPublished = status === 'published';

    const page = await prisma.customPage.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(metaTitle !== undefined && { metaTitle: metaTitle || null }),
        ...(metaDescription !== undefined && {
          metaDescription: metaDescription || null,
        }),
        ...(html !== undefined && { html: html || '' }),
        ...(css !== undefined && { css: css || '' }),
        ...(status !== undefined && { status }),
        ...(noIndex !== undefined && { noIndex: Boolean(noIndex) }),
        ...(!wasPublished && isNowPublished && { publishedAt: new Date() }),
      },
    });

    invalidatePublishedPagesCache();

    return NextResponse.json(page);
  } catch (error: any) {
    console.error('Erreur mise à jour page:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A page with this slug already exists' },
        { status: 409 }
      );
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to update page', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/pages/[id]
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);

    await prisma.customPage.delete({ where: { id } });
    invalidatePublishedPagesCache();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur suppression page:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to delete page', details: error.message },
      { status: 500 }
    );
  }
}
