import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import BlogForm from '@/components/Admin/BlogForm';

export default async function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const blogId = resolvedParams.id;

  const blog = await prisma.blogPost.findUnique({
    where: { id: blogId },
  });

  if (!blog) {
    notFound();
  }

  const blogData = {
    id: blog.id,
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt || '',
    content: blog.content || '',
    category: blog.category || '',
    tags: blog.tags || [],
    ctaLink: blog.ctaLink || '',
    ctaText: blog.ctaText || '',
    status: (blog.status as 'published' | 'draft') || 'draft',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Modifier l&apos;article
        </h1>
        <p className="text-gray-600">Modifiez les informations de l&apos;article</p>
      </div>
      <BlogForm initialData={blogData} />
    </div>
  );
}
