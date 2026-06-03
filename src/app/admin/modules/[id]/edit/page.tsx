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
    <div className="space-y-6 text-[#eeeaf4]">
      <div>
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-[#eeeaf4]">Edit Module</h1>
        <p className="text-[rgba(238,234,244,0.55)]">Modify module information</p>
      </div>
      <ModuleForm initialData={moduleData} />

      <div className="space-y-3">
        <div>
          <h2 className="text-2xl font-bold text-[#eeeaf4]">Quiz order in this module</h2>
          <p className="mt-1 text-sm text-[rgba(238,234,244,0.55)]">
            Use the arrows to set the order quizzes appear on the course page (top to bottom).
          </p>
        </div>
        <ModuleQuizzesReorder moduleId={moduleItem.id} quizzes={moduleItem.quizzes} />
      </div>
    </div>
  );
}
