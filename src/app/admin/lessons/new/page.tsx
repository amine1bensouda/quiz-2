import LessonForm from '@/components/Admin/LessonForm';

export default function NewLessonPage() {
  return (
    <div className="space-y-6 text-[#eeeaf4]">
      <div>
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-[#eeeaf4]">
          Create New Lesson
        </h1>
        <p className="text-[rgba(238,234,244,0.55)]">Create an independent lesson</p>
      </div>
      <LessonForm hideModuleField />
    </div>
  );
}
