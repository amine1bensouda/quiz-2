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
  status?: string;
  modules: Module[];
}

interface LessonFormData {
  id?: string;
  title: string;
  slug: string;
  moduleId: string;
  content: string;
  ctaLink: string;
  ctaText: string;
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
  hideModuleField?: boolean;
}

export default function LessonForm({ initialData, defaultModuleId, hideModuleField = false }: LessonFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [formData, setFormData] = useState<LessonFormData>({
    title: '',
    slug: '',
    moduleId: defaultModuleId || '',
    content: '',
    ctaLink: '',
    ctaText: '',
    featuredImageUrl: '',
    videoUrl: '',
    videoPlaybackSeconds: '',
    pdfUrl: '',
    allowPreview: false,
    order: 0,
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
      slug: prev.id ? prev.slug : generateSlug(title),
    }));
  };

  useEffect(() => {
    if (!hideModuleField) {
      fetchCourses();
    }
  }, [hideModuleField]);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/courses?full=1');
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Lesson Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {!hideModuleField && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Module (optional)</label>
              <select
                value={formData.moduleId}
                onChange={(e) => setFormData((prev) => ({ ...prev, moduleId: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Independent lesson (no module)</option>
                {courses.map((course) => (
                  <optgroup
                    key={course.id}
                    label={`${course.title}${course.status !== 'published' ? ' (draft)' : ''}`}
                  >
                    {course.modules.map((mod) => (
                      <option key={mod.id} value={mod.id}>
                        {mod.title}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter Lesson Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Slug (optional)</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="auto from name if empty"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Content</h2>
        <RichTextEditor
          value={formData.content}
          onChange={(value) => setFormData((prev) => ({ ...prev, content: value }))}
          placeholder="Write the lesson content..."
        />
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Call-to-Action <span className="text-sm font-normal text-gray-500">(optional)</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CTA Link</label>
            <input
              type="text"
              value={formData.ctaLink}
              onChange={(e) => setFormData((prev) => ({ ...prev, ctaLink: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Ex: /quiz or /quiz/course/act-math"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CTA Text</label>
            <input
              type="text"
              value={formData.ctaText}
              onChange={(e) => setFormData((prev) => ({ ...prev, ctaText: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Ex: Practice this chapter quiz"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Media</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
            <input
              type="number"
              min={0}
              value={formData.order}
              onChange={(e) => setFormData((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center md:pt-8 gap-2">
            <input
              type="checkbox"
              id="allowPreview"
              checked={formData.allowPreview}
              onChange={(e) => setFormData((prev) => ({ ...prev, allowPreview: e.target.checked }))}
              className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
            />
            <label htmlFor="allowPreview" className="text-sm font-medium text-gray-700">
              Lesson Preview (free preview)
            </label>
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
          disabled={loading || !formData.title}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : initialData?.id ? 'Update' : 'Create Lesson'}
        </button>
      </div>
    </form>
  );
}
