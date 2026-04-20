import CustomPageForm from '@/components/Admin/CustomPageForm';

export default function NewCustomPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          New Page
        </h1>
        <p className="text-gray-600">
          Build a custom page with your own HTML and CSS. Published pages are
          indexable by Google.
        </p>
      </div>
      <CustomPageForm />
    </div>
  );
}
