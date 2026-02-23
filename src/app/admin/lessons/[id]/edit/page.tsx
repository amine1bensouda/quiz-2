import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import LessonForm from '@/components/Admin/LessonForm';

export default async function EditLessonPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved = await Promise.resolve(params);
  const lesson = await prisma.lesson.findUnique({
    where: { id: resolved.id },
    include: { module: true },
  });

  if (!lesson) {
    notFound();
  }

  const initialData = {
    id: lesson.id,
    title: lesson.title,
    slug: lesson.slug,
    moduleId: lesson.moduleId,
    content: lesson.content ?? '',
    featuredImageUrl: lesson.featuredImageUrl ?? '',
    videoUrl: lesson.videoUrl ?? '',
    videoPlaybackSeconds: (lesson.videoPlaybackSeconds ?? '') as number | '',
    pdfUrl: lesson.pdfUrl ?? '',
    allowPreview: lesson.allowPreview,
    order: lesson.order,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Edit Lesson
        </h1>
        <p className="text-gray-600">Modify lesson: {lesson.title}</p>
      </div>
      <LessonForm initialData={initialData} />
    </div>
  );
}
