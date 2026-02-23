'use client';

import { useState, useRef } from 'react';

interface ImageUploadFieldProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
}

export default function ImageUploadField({
  label = 'Image',
  value,
  onChange,
  placeholder = 'https://...',
  className = '',
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/admin/upload/image', {
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
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'import');
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
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id="image-upload-field"
          />
          <label
            htmlFor="image-upload-field"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium cursor-pointer hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${uploading ? 'opacity-70' : ''}`}
          >
            {uploading ? (
              <>⏳ Import en cours...</>
            ) : (
              <>📁 Importer une image</>
            )}
          </label>
          <span className="text-xs text-gray-500">JPEG, PNG, GIF, WebP — max 5 Mo</span>
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
        {value && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-1">Preview:</p>
            <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt=""
                className="object-cover w-full h-full"
                onError={() => setError('Image not accessible')}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
