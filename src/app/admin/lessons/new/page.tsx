import LessonForm from '@/components/Admin/LessonForm';

export default function NewLessonPage({
  searchParams,
}: {
  searchParams: { moduleId?: string };
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Create New Lesson
        </h1>
        <p className="text-gray-600">Add a lesson to a module</p>
      </div>
      <LessonForm defaultModuleId={searchParams.moduleId} />
    </div>
  );
}
