'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RichTextEditor from './RichTextEditor';

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
        let errorMessage = 'Erreur lors de la sauvegarde';
        try {
          const data = await response.json();
          errorMessage = data.error || data.details || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        alert(errorMessage);
      }
    } catch (error: any) {
      console.error('Erreur sauvegarde blog:', error);
      alert(`Erreur: ${error.message || 'Une erreur est survenue'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informations principales */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Informations du blog</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre *
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
              Slug *
            </label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="ex: 10-tips-master-algebra"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie
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
              Statut
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
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Extrait / Résumé
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Bref résumé du blog post pour la liste et le SEO..."
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (séparés par des virgules)
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
        <h2 className="text-2xl font-bold text-gray-900">Contenu</h2>
        <RichTextEditor
          value={formData.content}
          onChange={(value) => setFormData((prev) => ({ ...prev, content: value }))}
          placeholder="Rédigez le contenu du blog..."
        />
      </div>

      {/* CTA (optionnel) */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Call-to-Action <span className="text-sm font-normal text-gray-500">(optionnel)</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lien CTA
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
              Texte CTA
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
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading || !formData.title || !formData.slug}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Enregistrement...' : initialData?.id ? 'Mettre à jour' : 'Créer le blog'}
        </button>
      </div>
    </form>
  );
}
