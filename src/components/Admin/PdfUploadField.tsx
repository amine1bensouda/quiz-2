'use client';

import { useState } from 'react';

interface PdfUploadFieldProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
}

export default function PdfUploadField({
  label = 'PDF',
  value,
  onChange,
  placeholder = 'or paste a URL (https://...)',
  className = '',
}: PdfUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      const res = await fetch('/api/admin/upload/pdf', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }
      if (data.url) {
        onChange(data.url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      )}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id="pdf-upload-field"
          />
          <label
            htmlFor="pdf-upload-field"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium cursor-pointer hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${uploading ? 'opacity-70' : ''}`}
          >
            {uploading ? (
              <>⏳ Uploading...</>
            ) : (
              <>📄 Import a PDF</>
            )}
          </label>
          <span className="text-xs text-gray-500">PDF — max 50 MB</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">or</span>
        </div>
        <input
          type="url"
          value={value}
          onChange={(e) => { setError(null); onChange(e.target.value); }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder={placeholder}
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
}
