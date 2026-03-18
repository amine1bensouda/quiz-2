import BlogForm from '@/components/Admin/BlogForm';

export default function NewBlogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Nouvel Article de Blog
        </h1>
        <p className="text-gray-600">Remplissez le formulaire pour créer un nouvel article</p>
      </div>
      <BlogForm />
    </div>
  );
}
