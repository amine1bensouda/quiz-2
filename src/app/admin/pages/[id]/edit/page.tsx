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
    <div className="space-y-6 text-[#eeeaf4]">
      <div>
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-[#eeeaf4]">
          Edit Page
        </h1>
        <p className="text-[rgba(238,234,244,0.55)]">Update your custom page</p>
      </div>
      <CustomPageForm initialData={data} />
    </div>
  );
}
