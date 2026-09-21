'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';

// Import dynamique pour éviter les erreurs SSR
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Hauteur réduite pour réponses / explications */
  compact?: boolean;
}

async function uploadImageFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch('/api/admin/upload/image', {
    method: 'POST',
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) {
    throw new Error(data.error || 'Image upload failed');
  }
  return data.url as string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter text...',
  className = '',
  compact = false,
}: RichTextEditorProps) {
  const [localValue, setLocalValue] = useState(value);
  const [uploading, setUploading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uploadingRef = useRef(setUploading);
  uploadingRef.current = setUploading;

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Flush pending debounce so parent state is current before form submit
  useEffect(() => {
    const flush = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        onChange(localValue);
      }
    };
    window.addEventListener('richtext-flush', flush);
    return () => window.removeEventListener('richtext-flush', flush);
  }, [localValue, onChange]);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          [{ font: [] }],
          [{ size: [] }],
          ['bold', 'italic', 'underline', 'strike', 'blockquote'],
          [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          ['link', 'image', 'video'],
          ['clean'],
        ],
        handlers: {
          // Classic function: Quill binds `this` to the toolbar (has `.quill`)
          image: function (this: { quill: {
            getSelection: (focus?: boolean) => { index: number } | null;
            insertEmbed: (index: number, type: string, value: string, source?: string) => void;
            setSelection: (index: number) => void;
          } }) {
            const quill = this.quill;
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/jpeg,image/png,image/gif,image/webp';
            input.click();

            input.onchange = async () => {
              const file = input.files?.[0];
              if (!file) return;

              uploadingRef.current(true);
              try {
                const url = await uploadImageFile(file);
                const range = quill.getSelection(true);
                const index = range?.index ?? 0;
                quill.insertEmbed(index, 'image', url, 'user');
                quill.setSelection(index + 1);
              } catch (err) {
                console.error('Rich text image upload failed:', err);
                alert(err instanceof Error ? err.message : 'Image upload failed');
              } finally {
                uploadingRef.current(false);
              }
            };
          },
        },
      },
      clipboard: {
        matchVisual: false,
      },
    }),
    []
  );

  const formats = [
    'header',
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'list',
    'bullet',
    'indent',
    'color',
    'background',
    'align',
    'link',
    'image',
    'video',
  ];

  const minHeight = compact ? 100 : 200;
  return (
    <div className={`rich-text-editor ${compact ? 'rich-text-editor-compact' : ''} ${className}`}>
      {uploading && (
        <p className="mb-2 text-xs font-medium text-amber-200">Uploading image…</p>
      )}
      <style jsx global>{`
        .rich-text-editor .ql-container {
          min-height: ${minHeight}px;
          font-size: 14px;
        }
        .rich-text-editor .ql-editor {
          min-height: ${minHeight}px;
        }
        .rich-text-editor-compact .ql-container,
        .rich-text-editor-compact .ql-editor {
          min-height: 100px;
        }
        .rich-text-editor .ql-toolbar {
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          border-left: 1px solid rgba(255, 255, 255, 0.12);
          border-right: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px 12px 0 0;
          background-color: #16162a;
        }
        .rich-text-editor .ql-container {
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          border-left: 1px solid rgba(255, 255, 255, 0.12);
          border-right: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 0 0 12px 12px;
          background: #0e0e1a;
        }
        .rich-text-editor .ql-editor {
          color: #eeeaf4;
          background: #0e0e1a;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: rgba(238, 234, 244, 0.35);
          font-style: normal;
        }
        .rich-text-editor .ql-stroke {
          stroke: rgba(238, 234, 244, 0.65);
        }
        .rich-text-editor .ql-fill {
          fill: rgba(238, 234, 244, 0.65);
        }
        .rich-text-editor .ql-picker-label {
          color: rgba(238, 234, 244, 0.75);
        }
        .rich-text-editor .ql-editor strong,
        .rich-text-editor .ql-editor b {
          font-weight: 700 !important;
        }
        .rich-text-editor .ql-editor u {
          text-decoration: underline;
        }
        .rich-text-editor .ql-editor u strong,
        .rich-text-editor .ql-editor strong u,
        .rich-text-editor .ql-editor u b,
        .rich-text-editor .ql-editor b u {
          font-weight: 700 !important;
          text-decoration: underline;
        }
        .rich-text-editor .ql-editor img {
          max-width: 100%;
          height: auto;
        }
      `}</style>
      <ReactQuill
        theme="snow"
        value={localValue}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
}
