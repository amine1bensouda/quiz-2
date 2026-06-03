'use client';

import { useState, useRef } from 'react';

interface VideoUploadFieldProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
}

export default function VideoUploadField({
  label = 'Video',
  value,
  onChange,
  placeholder = 'or paste a URL (https://...)',
  className = '',
}: VideoUploadFieldProps) {
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
      formData.append('video', file);
      const res = await fetch('/api/admin/upload/video', {
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
            ref={inputRef}
            type="file"
            accept="video/mp4,video/webm"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id="video-upload-field"
          />
          <label
            htmlFor="video-upload-field"
            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/15 bg-[#0e0e1a] px-4 py-2 text-sm font-medium text-[#eeeaf4] transition-colors hover:border-[#f5c14a]/40 hover:text-[#f5c14a] disabled:cursor-not-allowed disabled:opacity-50 ${uploading ? 'opacity-70' : ''}`}
          >
            {uploading ? (
              <>⏳ Uploading...</>
            ) : (
              <>📁 Import a video</>
            )}
          </label>
          <span className="text-xs text-gray-500">MP4, WebM — max 200 MB</span>
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
