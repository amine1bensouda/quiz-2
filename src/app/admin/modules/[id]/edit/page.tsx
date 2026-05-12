import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import ModuleForm from '@/components/Admin/ModuleForm';
import ModuleQuizzesReorder from '@/components/Admin/ModuleQuizzesReorder';

export default async function EditModulePage({ params }: { params: { id: string } }) {
  const moduleItem = await prisma.module.findUnique({
    where: { id: params.id },
    include: {
      course: true,
      quizzes: {
        select: {
          id: true,
          title: true,
          slug: true,
          order: true,
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      },
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

      <div className="space-y-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quiz order in this module</h2>
          <p className="text-sm text-gray-600 mt-1">
            Use the arrows to set the order quizzes appear on the course page (top to bottom).
          </p>
        </div>
        <ModuleQuizzesReorder moduleId={moduleItem.id} quizzes={moduleItem.quizzes} />
      </div>
    </div>
  );
}
