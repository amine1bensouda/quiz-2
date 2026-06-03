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
    moduleId: lesson.moduleId ?? '',
    content: lesson.content ?? '',
    ctaLink: lesson.ctaLink ?? '',
    ctaText: lesson.ctaText ?? '',
    featuredImageUrl: lesson.featuredImageUrl ?? '',
    videoUrl: lesson.videoUrl ?? '',
    videoPlaybackSeconds: (lesson.videoPlaybackSeconds ?? '') as number | '',
    pdfUrl: lesson.pdfUrl ?? '',
    allowPreview: lesson.allowPreview,
    order: lesson.order,
  };

  return (
    <div className="space-y-6 text-[#eeeaf4]">
      <div>
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-[#eeeaf4]">
          Edit Lesson
        </h1>
        <p className="text-[rgba(238,234,244,0.55)]">Modify lesson: {lesson.title}</p>
      </div>
      <LessonForm initialData={initialData} />
    </div>
  );
}
