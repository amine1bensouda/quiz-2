import LessonForm from '@/components/Admin/LessonForm';

export default function NewLessonPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Create New Lesson
        </h1>
        <p className="text-gray-600">Create an independent lesson</p>
      </div>
      <LessonForm hideModuleField />
    </div>
  );
}
