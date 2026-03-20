'use client';

import { useState, useEffect, useRef } from 'react';
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

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter text...',
  className = '',
  compact = false,
}: RichTextEditorProps) {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Synchroniser localValue avec la prop value si elle change de l'extérieur
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce onChange pour éviter trop d'appels
  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    
    // Annuler le timeout précédent
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Appeler onChange après 300ms de délai
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, 300);
  };

  // Nettoyer le timeout au démontage
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Configuration des modules Quill
  const modules = {
    toolbar: [
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
    clipboard: {
      matchVisual: false,
    },
  };

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
          border-top: 1px solid #d1d5db;
          border-left: 1px solid #d1d5db;
          border-right: 1px solid #d1d5db;
          border-radius: 8px 8px 0 0;
          background-color: #f9fafb;
        }
        .rich-text-editor .ql-container {
          border-bottom: 1px solid #d1d5db;
          border-left: 1px solid #d1d5db;
          border-right: 1px solid #d1d5db;
          border-radius: 0 0 8px 8px;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
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
