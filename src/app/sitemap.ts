import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';
import { getAllQuizSlugs } from '@/lib/quiz-service';
import { getCourses, getAllPublishedPagesData } from '@/lib/cache';
import { getAllCategories } from '@/lib/quiz-service';
import { getAllBlogPostsFromDB } from '@/lib/blog-data';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;
  const currentDate = new Date();
  const blogPosts = await getAllBlogPostsFromDB();
  const hasBlogPosts = blogPosts.length > 0;

  // Pages statiques
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about-us`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact-us`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/quiz`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  if (hasBlogPosts) {
    staticPages.push({
      url: `${baseUrl}/blogs`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  // Récupérer tous les quiz
  let quizPages: MetadataRoute.Sitemap = [];
  try {
    const quizSlugs = await getAllQuizSlugs();
    quizPages = quizSlugs.map((slug) => ({
      url: `${baseUrl}/quiz/${encodeURIComponent(slug)}`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Erreur récupération slugs quiz pour sitemap:', error);
  }

  // Récupérer tous les cours publiés
  let coursePages: MetadataRoute.Sitemap = [];
  try {
    const courses = await getCourses();
    coursePages = courses.map((course) => ({
      url: `${baseUrl}/quiz/course/${encodeURIComponent(course.slug)}`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Erreur récupération cours pour sitemap:', error);
  }

  // Récupérer toutes les catégories
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const categories = await getAllCategories();
    categoryPages = categories.map((category) => ({
      url: `${baseUrl}/categorie/${encodeURIComponent(category.slug)}`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Erreur récupération catégories pour sitemap:', error);
  }

  // Pages d'articles de blog
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blogs/${encodeURIComponent(post.slug)}`,
    lastModified: post.date ? new Date(post.date) : currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Pages custom publiées (HTML/CSS depuis le panel admin), indexables uniquement
  let customPages: MetadataRoute.Sitemap = [];
  try {
    const pages = await getAllPublishedPagesData();
    customPages = pages
      .filter((p) => !p.noIndex)
      .map((p) => ({
        url: `${baseUrl}/pages/${encodeURIComponent(p.slug)}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : currentDate,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
  } catch (error) {
    console.error('Erreur récupération pages custom pour sitemap:', error);
  }

  // Combiner toutes les pages
  return [
    ...staticPages,
    ...quizPages,
    ...coursePages,
    ...categoryPages,
    ...blogPages,
    ...customPages,
  ];
}
