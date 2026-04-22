/**
 * Données des articles de blog — partagées entre liste et détail.
 * Les articles proviennent exclusivement de la base de données (Prisma) via le cache.
 */

import { getAllPublishedBlogsData, getPublishedBlogByIdOrSlugData } from '@/lib/cache';

export interface BlogPost {
  id: number | string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  category: string;
  slug: string;
  ctaLink?: string;
  ctaText?: string;
  tags?: string[];
}

/** Normalise les tags (MySQL : champ JSON ; PostgreSQL ancien : string[]). */
export function normalizeBlogTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags.filter((t): t is string => typeof t === 'string');
}

/** Convertit date Prisma (Date|string|number) en YYYY-MM-DD. */
function toDateOnly(value: unknown): string {
  if (value instanceof Date) return value.toISOString().split('T')[0];
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  }
  return new Date(0).toISOString().split('T')[0];
}

/** Convertit un blog Prisma en BlogPost. */
function fromPrisma(b: any): BlogPost {
  return {
    id: b.id,
    title: b.title,
    slug: b.slug,
    excerpt: b.excerpt || '',
    content: b.content || '',
    date: toDateOnly(b.publishedAt || b.createdAt),
    category: b.category || '',
    ctaLink: b.ctaLink || undefined,
    ctaText: b.ctaText || undefined,
    tags: normalizeBlogTags(b.tags),
  };
}

/** Récupère tous les posts publiés (DB uniquement). */
export async function getAllBlogPostsFromDB(): Promise<BlogPost[]> {
  try {
    const dbPosts = await getAllPublishedBlogsData();
    const normalizedDbPosts = dbPosts.map(fromPrisma);
    return normalizedDbPosts.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch {
    // DB indisponible: on renvoie vide pour éviter le fallback statique.
    return [];
  }
}

/** Récupère un post publié par id ou slug (DB uniquement). */
export async function getBlogPostFromDB(idOrSlug: string): Promise<BlogPost | undefined> {
  const normalized = decodeURIComponent(String(idOrSlug)).trim().toLowerCase();
  try {
    const blog = await getPublishedBlogByIdOrSlugData(idOrSlug);
    if (blog) return fromPrisma(blog);

    // Fallback robuste DB-only: certains slugs peuvent différer en casse/encodage.
    const allDbPosts = await getAllPublishedBlogsData();
    const matched = allDbPosts.find((p) => {
      const dbSlug = String(p.slug || '').trim().toLowerCase();
      return dbSlug === normalized;
    });
    if (matched) return fromPrisma(matched);
  } catch {
    // DB indisponible
    return undefined;
  }
  return undefined;
}
