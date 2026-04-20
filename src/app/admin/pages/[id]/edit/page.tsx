import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import CustomPageForm from '@/components/Admin/CustomPageForm';

export default async function EditCustomPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const pageId = resolvedParams.id;

  const page = await prisma.customPage.findUnique({
    where: { id: pageId },
  });

  if (!page) {
    notFound();
  }

  const data = {
    id: page.id,
    title: page.title,
    slug: page.slug,
    metaTitle: page.metaTitle || '',
    metaDescription: page.metaDescription || '',
    html: page.html || '',
    css: page.css || '',
    status: (page.status as 'published' | 'draft') || 'draft',
    noIndex: Boolean(page.noIndex),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Edit Page
        </h1>
        <p className="text-gray-600">Update your custom page</p>
      </div>
      <CustomPageForm initialData={data} />
    </div>
  );
}
