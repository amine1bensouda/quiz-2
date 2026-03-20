import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import ModuleForm from '@/components/Admin/ModuleForm';

export default async function EditModulePage({ params }: { params: { id: string } }) {
  const moduleItem = await prisma.module.findUnique({
    where: { id: params.id },
    include: {
      course: true,
    },
  });

  if (!moduleItem) {
    notFound();
  }

  const moduleData = {
    id: moduleItem.id,
    title: moduleItem.title,
    slug: moduleItem.slug,
    courseId: moduleItem.courseId,
    description: moduleItem.description || '',
    order: moduleItem.order,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Edit Module
        </h1>
        <p className="text-gray-600">Modify module information</p>
      </div>
      <ModuleForm initialData={moduleData} />
    </div>
  );
}
