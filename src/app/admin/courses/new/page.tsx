import CourseForm from '@/components/Admin/CourseForm';

export default function NewCoursePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Créer un nouveau cours
        </h1>
        <p className="text-gray-600">Remplissez le formulaire pour créer un nouveau cours</p>
      </div>
      <CourseForm />
    </div>
  );
}
