import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/blogs/[id]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const blog = await prisma.blogPost.findUnique({ where: { id } });

    if (!blog) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    return NextResponse.json(blog);
  } catch (error: any) {
    console.error('Erreur récupération blog:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog post', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/blogs/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const body = await request.json();
    const { title, slug, excerpt, content, category, tags, ctaLink, ctaText, status } = body;

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    const wasPublished = existing.status === 'published';
    const isNowPublished = status === 'published';

    const blog = await prisma.blogPost.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(excerpt !== undefined && { excerpt }),
        ...(content !== undefined && { content }),
        ...(category !== undefined && { category }),
        ...(tags !== undefined && { tags }),
        ...(ctaLink !== undefined && { ctaLink: ctaLink || null }),
        ...(ctaText !== undefined && { ctaText: ctaText || null }),
        ...(status !== undefined && { status }),
        ...(!wasPublished && isNowPublished && { publishedAt: new Date() }),
      },
    });

    return NextResponse.json(blog);
  } catch (error: any) {
    console.error('Erreur mise à jour blog:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A blog post with this slug already exists' },
        { status: 409 }
      );
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to update blog post', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/blogs/[id]
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);

    await prisma.blogPost.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur suppression blog:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to delete blog post', details: error.message },
      { status: 500 }
    );
  }
}
