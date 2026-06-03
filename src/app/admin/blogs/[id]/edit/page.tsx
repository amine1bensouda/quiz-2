import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { normalizeBlogTags } from '@/lib/blog-data';
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
    tags: normalizeBlogTags(blog.tags),
    ctaLink: blog.ctaLink || '',
    ctaText: blog.ctaText || '',
    status: (blog.status as 'published' | 'draft') || 'draft',
  };

  return (
    <div className="space-y-6 text-[#eeeaf4]">
      <div>
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-[#eeeaf4]">
          Edit Blog Post
        </h1>
        <p className="text-[rgba(238,234,244,0.55)]">Modify blog post information</p>
      </div>
      <BlogForm initialData={blogData} />
    </div>
  );
}
