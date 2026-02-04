import ModuleForm from '@/components/Admin/ModuleForm';

export default function NewModulePage({
  searchParams,
}: {
  searchParams: { courseId?: string };
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Créer un nouveau module
        </h1>
        <p className="text-gray-600">Remplissez le formulaire pour créer un nouveau module</p>
      </div>
      <ModuleForm defaultCourseId={searchParams.courseId} />
    </div>
  );
}
