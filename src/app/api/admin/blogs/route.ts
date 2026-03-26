import { NextRequest, NextResponse } from 'next/server';
import { isFullRequest } from '@/lib/request-utils';
import { prisma } from '@/lib/db';


export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/blogs
 */
export async function GET(request: NextRequest) {
  try {
    const full = isFullRequest(request);
    const blogs = full
      ? await prisma.blogPost.findMany({
          orderBy: { createdAt: 'desc' },
        })
      : await prisma.blogPost.findMany({
          select: {
            id: true,
            title: true,
            slug: true,
            category: true,
            status: true,
            publishedAt: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        });
    return NextResponse.json(blogs);
  } catch (error: any) {
    console.error('Erreur récupération blogs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blogs', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/blogs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, slug, excerpt, content, category, tags, ctaLink, ctaText, status } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      );
    }

    const blog = await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt: excerpt || '',
        content: content || '',
        category: category || '',
        tags: tags || [],
        ctaLink: ctaLink || null,
        ctaText: ctaText || null,
        status: status || 'draft',
        publishedAt: status === 'published' ? new Date() : null,
      },
    });

    return NextResponse.json(blog, { status: 201 });
  } catch (error: any) {
    console.error('Erreur création blog:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A blog post with this slug already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create blog post', details: error.message },
      { status: 500 }
    );
  }
}
