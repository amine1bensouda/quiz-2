'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RichTextEditor from './RichTextEditor';

interface CourseFormData {
  id?: string;
  title: string;
  slug: string;
  description: string;
  status: 'published' | 'draft';
}

interface CourseFormProps {
  initialData?: CourseFormData;
}

export default function CourseForm({ initialData }: CourseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    slug: '',
    description: '',
    status: 'draft',
    ...initialData,
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = initialData
        ? `/api/admin/courses/${initialData.id}`
        : '/api/admin/courses';
      const method = initialData ? 'PUT' : 'POST';

      // S'assurer que tous les champs sont inclus
      const payload = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description || '',
        ...(formData.status && { status: formData.status }),
      };

      console.log('📤 Sending data:', { url, method, payload });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push('/admin/courses');
        router.refresh();
      } else {
        let errorMessage = 'Error saving';
        try {
          const data = await response.json();
          errorMessage = data.error || data.details || errorMessage;
          console.error('API Error:', data);
        } catch (e) {
          errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
        }
        alert(errorMessage);
      }
    } catch (error: any) {
      console.error('Save error:', error);
      alert(`Error: ${error.message || 'An error occurred while saving'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Ex: ACT Math Course"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="ex: act-math-course"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
                placeholder="Enter course description..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as 'published' | 'draft' }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="draft">📝 Draft</option>
                <option value="published">✅ Published</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Draft courses are not publicly visible
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !formData.title || !formData.slug}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : initialData ? 'Update' : 'Create Course'}
        </button>
      </div>
    </form>
  );
}
