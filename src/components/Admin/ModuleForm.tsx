'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RichTextEditor from './RichTextEditor';

interface Course {
  id: string;
  title: string;
  slug: string;
  status?: string;
}

interface ModuleFormData {
  id?: string;
  title: string;
  slug: string;
  courseId: string;
  description: string;
  order: number;
}

interface ModuleFormProps {
  initialData?: ModuleFormData;
  defaultCourseId?: string;
}

export default function ModuleForm({ initialData, defaultCourseId }: ModuleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [formData, setFormData] = useState<ModuleFormData>({
    title: '',
    slug: '',
    courseId: defaultCourseId || '',
    description: '',
    order: 0,
    ...initialData,
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

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
        ? `/api/admin/modules/${initialData.id}`
        : '/api/admin/modules';
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/admin/modules');
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Error saving');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Error saving');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-[#0e0e1a] px-4 py-2.5 text-[#eeeaf4] placeholder:text-[rgba(238,234,244,0.35)] focus:border-[#f5c14a]/60 focus:outline-none focus:ring-2 focus:ring-[#f5c14a]/20';
  const labelClass = 'mb-2 block text-sm font-medium text-[rgba(238,234,244,0.9)]';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="admin-surface space-y-6 rounded-2xl border border-white/10 bg-[#12121f] p-6 shadow-lg">
        <div>
          <h2 className="mb-4 text-2xl font-bold text-[#eeeaf4]">Module Information</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className={labelClass}>Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className={inputClass}
                placeholder="Ex: MODULE 1: FUNDAMENTAL QUIZZES"
              />
            </div>
            <div>
              <label className={labelClass}>Slug *</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                className={inputClass}
                placeholder="ex: module-1-fundamental"
              />
            </div>
            <div>
              <label className={labelClass}>Course *</label>
              <select
                required
                value={formData.courseId}
                onChange={(e) => setFormData((prev) => ({ ...prev, courseId: e.target.value }))}
                className={inputClass}
              >
                <option value="" className="bg-[#0e0e1a]">
                  Select a course
                </option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id} className="bg-[#0e0e1a]">
                    {course.title}
                    {course.status !== 'published' ? ' (draft)' : ''}
                  </option>
                ))}
              </select>
              {courses.length === 0 && (
                <p className="mt-1 text-sm text-[rgba(238,234,244,0.5)]">
                  No courses available.{' '}
                  <a href="/admin/courses/new" className="text-[#f5c14a] hover:underline">
                    Create a course
                  </a>
                </p>
              )}
            </div>
            <div>
              <label className={labelClass}>Order</label>
              <input
                type="number"
                min="0"
                value={formData.order}
                onChange={(e) => setFormData((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Description</label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
                placeholder="Enter module description..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-white/15 px-6 py-3 text-sm font-medium text-[#eeeaf4] transition-colors hover:border-white/25 hover:bg-white/5"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !formData.title || !formData.slug || !formData.courseId}
          className="rounded-full bg-[#f5c14a] px-6 py-3 text-sm font-semibold text-[#0c0a00] shadow-[0_4px_20px_rgba(245,193,74,0.2)] transition-colors hover:bg-[#f9d06a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Saving...' : initialData ? 'Update' : 'Create Module'}
        </button>
      </div>
    </form>
  );
}
