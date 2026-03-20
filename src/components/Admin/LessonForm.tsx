'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RichTextEditor from './RichTextEditor';
import ImageUploadField from './ImageUploadField';
import VideoUploadField from './VideoUploadField';
import PdfUploadField from './PdfUploadField';

interface Module {
  id: string;
  title: string;
  slug: string;
}

interface Course {
  id: string;
  title: string;
  slug: string;
  modules: Module[];
}

interface LessonFormData {
  id?: string;
  title: string;
  slug: string;
  moduleId: string;
  content: string;
  featuredImageUrl: string;
  videoUrl: string;
  videoPlaybackSeconds: number | '';
  pdfUrl: string;
  allowPreview: boolean;
  order: number;
}

interface LessonFormProps {
  initialData?: LessonFormData;
  defaultModuleId?: string;
}

export default function LessonForm({ initialData, defaultModuleId }: LessonFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [formData, setFormData] = useState<LessonFormData>({
    title: '',
    slug: '',
    moduleId: defaultModuleId || '',
    content: '',
    featuredImageUrl: '',
    videoUrl: '',
    videoPlaybackSeconds: '',
    pdfUrl: '',
    allowPreview: false,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = initialData?.id
        ? `/api/admin/lessons/${initialData.id}`
        : '/api/admin/lessons';
      const method = initialData?.id ? 'PUT' : 'POST';
      const payload = {
        ...formData,
        videoPlaybackSeconds: formData.videoPlaybackSeconds === '' ? undefined : Number(formData.videoPlaybackSeconds),
      };
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        router.push('/admin/lessons');
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.details || data.error || 'Error saving');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Error saving');
    } finally {
      setLoading(false);
    }
  };

  const modules = formData.moduleId
    ? courses.flatMap((c) => c.modules).filter((m) => m.id === formData.moduleId)
    : courses.flatMap((c) => c.modules);
  const selectedCourse = courses.find((c) => c.modules.some((m) => m.id === formData.moduleId));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Lesson</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Course *</label>
            <select
              required
              value={selectedCourse?.id ?? ''}
              onChange={(e) => {
                const course = courses.find((c) => c.id === e.target.value);
                setFormData((prev) => ({
                  ...prev,
                  moduleId: course?.modules?.[0]?.id ?? '',
                }));
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Module *</label>
            <select
              required
              value={formData.moduleId}
              onChange={(e) => setFormData((prev) => ({ ...prev, moduleId: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a module</option>
              {courses.map((course) => (
                <optgroup key={course.id} label={course.title}>
                  {course.modules.map((mod) => (
                    <option key={mod.id} value={mod.id}>
                      {mod.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter Lesson Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Slug (optional)</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="auto from name if empty"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <RichTextEditor
              value={formData.content}
              onChange={(value) => setFormData((prev) => ({ ...prev, content: value }))}
              placeholder="Enter lesson content..."
            />
          </div>
          <div>
            <ImageUploadField
              label="Featured Image"
              value={formData.featuredImageUrl}
              onChange={(url) => setFormData((prev) => ({ ...prev, featuredImageUrl: url }))}
              placeholder="or paste a URL (https://...)"
            />
          </div>
          <div>
            <VideoUploadField
              label="Video"
              value={formData.videoUrl}
              onChange={(url) => setFormData((prev) => ({ ...prev, videoUrl: url }))}
              placeholder="or paste a URL (https://...)"
            />
          </div>
          <div>
            <PdfUploadField
              label="PDF"
              value={formData.pdfUrl}
              onChange={(url) => setFormData((prev) => ({ ...prev, pdfUrl: url }))}
              placeholder="or paste a URL (https://...)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Video Playback Time (seconds)</label>
            <input
              type="number"
              min={0}
              value={formData.videoPlaybackSeconds}
              onChange={(e) => setFormData((prev) => ({ ...prev, videoPlaybackSeconds: e.target.value === '' ? '' : parseInt(e.target.value) || 0 }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
            <input
              type="number"
              min={0}
              value={formData.order}
              onChange={(e) => setFormData((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allowPreview"
              checked={formData.allowPreview}
              onChange={(e) => setFormData((prev) => ({ ...prev, allowPreview: e.target.checked }))}
              className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
            />
            <label htmlFor="allowPreview" className="text-sm font-medium text-gray-700">Lesson Preview (free preview)</label>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !formData.title || !formData.moduleId}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium shadow-lg disabled:opacity-50"
        >
          {loading ? 'Saving...' : initialData?.id ? 'Update' : 'Create Lesson'}
        </button>
      </div>
    </form>
  );
}
