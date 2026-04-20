import { NextRequest, NextResponse } from 'next/server';
import { invalidatePublishedPagesCache } from '@/lib/cache';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/pages
 */
export async function GET() {
  try {
    const pages = await prisma.customPage.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        noIndex: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json(pages);
  } catch (error: any) {
    console.error('Erreur récupération pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pages', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/pages
 */
export async function POST(request: NextRequest) {
  try {
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

    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      );
    }

    const normalizedStatus = status === 'published' ? 'published' : 'draft';

    const page = await prisma.customPage.create({
      data: {
        title,
        slug,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        html: html || '',
        css: css || '',
        status: normalizedStatus,
        noIndex: Boolean(noIndex),
        publishedAt: normalizedStatus === 'published' ? new Date() : null,
      },
    });

    invalidatePublishedPagesCache();

    return NextResponse.json(page, { status: 201 });
  } catch (error: any) {
    console.error('Erreur création page:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A page with this slug already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create page', details: error.message },
      { status: 500 }
    );
  }
}
