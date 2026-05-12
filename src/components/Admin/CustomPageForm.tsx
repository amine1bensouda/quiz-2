'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

interface CustomPageFormData {
  id?: string;
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  html: string;
  css: string;
  status: 'published' | 'draft';
  noIndex: boolean;
}

interface CustomPageFormProps {
  initialData?: CustomPageFormData;
}

const DEFAULT_HTML = `<section class="page-hero">
  <h1>Page title</h1>
  <p>Short introduction for this page.</p>
  <a href="/quiz" class="btn-primary">Explore quizzes</a>
</section>

<section class="page-content">
  <h2>Subheading</h2>
  <p>Write your content here. You can use any HTML you want.</p>
</section>
`;

const DEFAULT_CSS = `.page-hero {
  padding: 64px 24px;
  text-align: center;
  background: linear-gradient(135deg, #eef2ff, #ffffff);
  border-radius: 24px;
}

.page-hero h1 {
  font-size: 2.5rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 12px;
}

.page-hero p {
  color: #475569;
  max-width: 640px;
  margin: 0 auto 24px;
}

.btn-primary {
  display: inline-block;
  padding: 12px 24px;
  background: #f5c14a;
  color: white;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
}

.page-content {
  padding: 48px 24px;
  max-width: 880px;
  margin: 0 auto;
}

.page-content h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 12px;
  color: #0f172a;
}
`;

export default function CustomPageForm({ initialData }: CustomPageFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'preview'>('html');

  const [formData, setFormData] = useState<CustomPageFormData>({
    title: '',
    slug: '',
    metaTitle: '',
    metaDescription: '',
    html: DEFAULT_HTML,
    css: DEFAULT_CSS,
    status: 'draft',
    noIndex: false,
    ...initialData,
  });

  const generateSlug = (title: string) =>
    title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.id ? prev.slug : generateSlug(title),
    }));
  };

  const previewDocument = useMemo(() => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${formData.metaTitle || formData.title || 'Preview'}</title>
<style>
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; background: #ffffff; }
${formData.css}
</style>
</head>
<body>
${formData.html}
</body>
</html>`;
  }, [formData.html, formData.css, formData.title, formData.metaTitle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = initialData?.id
        ? `/api/admin/pages/${initialData.id}`
        : '/api/admin/pages';
      const method = initialData?.id ? 'PUT' : 'POST';

      const payload = {
        title: formData.title,
        slug: formData.slug,
        metaTitle: formData.metaTitle || null,
        metaDescription: formData.metaDescription || null,
        html: formData.html,
        css: formData.css,
        status: formData.status,
        noIndex: formData.noIndex,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push('/admin/pages');
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
      console.error('Page save error:', error);
      alert(`Error: ${error.message || 'An error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Infos principales */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Page Information</h2>

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
              placeholder="Ex: Free ACT Math Practice"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug (URL) *
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 whitespace-nowrap">/pages/</span>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, slug: e.target.value }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="ex: free-act-math-practice"
              />
            </div>
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
              <option value="draft">Draft (not visible)</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-8">
            <input
              id="noIndex"
              type="checkbox"
              checked={formData.noIndex}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, noIndex: e.target.checked }))
              }
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="noIndex" className="text-sm text-gray-700">
              <span className="font-medium">Hide from Google</span> (noindex,
              nofollow)
            </label>
          </div>
        </div>
      </div>

      {/* SEO */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">SEO</h2>
          <p className="text-sm text-gray-500">
            Shown in Google search results and social previews.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta title
            </label>
            <input
              type="text"
              value={formData.metaTitle}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, metaTitle: e.target.value }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Defaults to page title if empty (max ~60 chars)"
              maxLength={120}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta description
            </label>
            <textarea
              rows={3}
              value={formData.metaDescription}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  metaDescription: e.target.value,
                }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Short summary shown in search results (max ~160 chars)"
              maxLength={320}
            />
          </div>
        </div>
      </div>

      {/* Éditeurs HTML / CSS / Preview */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Page source</h2>
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['html', 'css', 'preview'] as const).map((tab) => (
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
              value={formData.html}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, html: e.target.value }))
              }
              rows={22}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50"
              placeholder="<section>...</section>"
            />
            <p className="text-xs text-gray-500 mt-2">
              Paste any HTML. No need to write &lt;html&gt;, &lt;head&gt; or
              &lt;body&gt; — they are added for you. CSS goes in the CSS tab.
            </p>
          </div>
        )}

        {activeTab === 'css' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSS styles
            </label>
            <textarea
              spellCheck={false}
              value={formData.css}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, css: e.target.value }))
              }
              rows={22}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50"
              placeholder=".my-class { color: #111; }"
            />
            <p className="text-xs text-gray-500 mt-2">
              These styles are scoped to this page only.
            </p>
          </div>
        )}

        {activeTab === 'preview' && (
          <div>
            <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
              <iframe
                title="Preview"
                srcDoc={previewDocument}
                className="w-full"
                style={{ height: '640px', border: 0 }}
                sandbox="allow-same-origin"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Live preview of your HTML + CSS. This is how Google will see your
              page.
            </p>
          </div>
        )}
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
          {loading
            ? 'Saving...'
            : initialData?.id
            ? 'Update page'
            : 'Create page'}
        </button>
      </div>
    </form>
  );
}
