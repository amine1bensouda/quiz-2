import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import CourseForm from '@/components/Admin/CourseForm';

export default async function EditCoursePage({ 
  params 
}: { 
  params: Promise<{ id: string }> | { id: string } 
}) {
  // Gérer les params synchrones et asynchrones (Next.js 14+)
  const resolvedParams = await Promise.resolve(params);
  const courseId = resolvedParams.id;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    notFound();
  }

  const courseData = {
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description || '',
    status: (course.status as 'published' | 'draft') || 'draft',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Edit Course
        </h1>
        <p className="text-gray-600">Modify course information</p>
      </div>
      <CourseForm initialData={courseData} />
    </div>
  );
}
