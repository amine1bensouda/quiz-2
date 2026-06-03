import BlogForm from '@/components/Admin/BlogForm';

export default function NewBlogPage() {
  return (
    <div className="space-y-6 text-[#eeeaf4]">
      <div>
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-[#eeeaf4]">
          New Blog Post
        </h1>
        <p className="text-[rgba(238,234,244,0.55)]">Fill out the form to create a new blog post</p>
      </div>
      <BlogForm />
    </div>
  );
}
