'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

interface BlogFormData {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  ctaLink: string;
  ctaText: string;
  status: 'published' | 'draft';
}

interface BlogFormProps {
  initialData?: BlogFormData;
}

export default function BlogForm({ initialData }: BlogFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'html' | 'preview'>('html');
  const [tagsInput, setTagsInput] = useState(initialData?.tags?.join(', ') || '');
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    tags: [],
    ctaLink: '',
    ctaText: '',
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
      slug: prev.id ? prev.slug : generateSlug(title),
    }));
  };

  const handleTagsChange = (value: string) => {
    setTagsInput(value);
    const parsed = value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    setFormData((prev) => ({ ...prev, tags: parsed }));
  };

  const previewDocument = useMemo(() => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${formData.title || 'Blog preview'}</title>
<style>
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #0f172a;
    background: #ffffff;
  }
  article {
    max-width: 840px;
    margin: 0 auto;
    padding: 48px 20px 72px;
    line-height: 1.7;
  }
  h1 { font-size: 2rem; line-height: 1.2; margin-bottom: 8px; }
  .meta { color: #64748b; margin-bottom: 32px; }
  img, video { max-width: 100%; height: auto; border-radius: 8px; }
  blockquote {
    border-left: 4px solid #cbd5e1;
    margin: 20px 0;
    padding: 8px 16px;
    color: #334155;
    background: #f8fafc;
  }
</style>
</head>
<body>
  <article>
    <h1>${formData.title || 'Untitled blog post'}</h1>
    ${formData.excerpt ? `<p class="meta">${formData.excerpt}</p>` : ''}
    ${formData.content || '<p>Start writing your HTML content...</p>'}
  </article>
</body>
</html>`;
  }, [formData.title, formData.excerpt, formData.content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = initialData?.id
        ? `/api/admin/blogs/${initialData.id}`
        : '/api/admin/blogs';
      const method = initialData?.id ? 'PUT' : 'POST';

      const payload = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        content: formData.content,
        category: formData.category,
        tags: formData.tags,
        ctaLink: formData.ctaLink || null,
        ctaText: formData.ctaText || null,
        status: formData.status,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push('/admin/blogs');
        router.refresh();
      } else {
        let errorMessage = 'Error saving';
        try {
          const data = await response.json();
          errorMessage = data.error || data.details || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        alert(errorMessage);
      }
    } catch (error: any) {
      console.error('Blog save error:', error);
      alert(`Error: ${error.message || 'An error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informations principales */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Blog Information</h2>

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
              placeholder="Ex: 10 Tips to Master Algebra"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug (URL) *
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 whitespace-nowrap">/blogs/</span>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="ex: 10-tips-master-algebra"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Ex: Learning Tips, Exam Prep, Mathematics"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: e.target.value as 'published' | 'draft',
                }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Excerpt / Summary
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Brief summary for the blog list and SEO..."
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => handleTagsChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Ex: algebra, math tips, SAT math"
            />
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Blog source</h2>
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['html', 'preview'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition ${
                  activeTab === tab
                    ? 'bg-white shadow text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'html' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              HTML body
            </label>
            <textarea
              spellCheck={false}
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              rows={22}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50"
              placeholder="<section>...</section>"
            />
            <p className="text-xs text-gray-500 mt-2">
              Paste any HTML for your blog content. The title/excerpt are rendered automatically above.
            </p>
          </div>
        )}

        {activeTab === 'preview' && (
          <div>
            <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
              <iframe
                title="Blog preview"
                srcDoc={previewDocument}
                className="w-full"
                style={{ height: '640px', border: 0 }}
                sandbox="allow-same-origin"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Live preview of your title, excerpt and content.
            </p>
          </div>
        )}
      </div>

      {/* CTA (optionnel) */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Call-to-Action <span className="text-sm font-normal text-gray-500">(optional)</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CTA Link
            </label>
            <input
              type="text"
              value={formData.ctaLink}
              onChange={(e) => setFormData((prev) => ({ ...prev, ctaLink: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Ex: /quiz ou /quiz/course/act-math"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CTA Text
            </label>
            <input
              type="text"
              value={formData.ctaText}
              onChange={(e) => setFormData((prev) => ({ ...prev, ctaText: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Ex: Practice algebra quizzes free"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
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
          {loading ? 'Saving...' : initialData?.id ? 'Update' : 'Create Blog Post'}
        </button>
      </div>
    </form>
  );
}
