'use client';

import { useEffect, useState, useRef } from 'react';

interface SafeHtmlRendererProps {
  html: string;
  className?: string;
  renderMath?: boolean; // Option pour rendre les formules LaTeX
}

/**
 * Composant pour rendre du HTML de manière sécurisée
 * Gère correctement les images base64 et préserve leur intégrité
 * Peut aussi rendre les formules LaTeX si renderMath est true
 */
export default function SafeHtmlRenderer({ html, className = '', renderMath = false }: SafeHtmlRendererProps) {
  const [processedHtml, setProcessedHtml] = useState(html);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!html) {
      setProcessedHtml('');
      return;
    }

    // Traiter le HTML pour s'assurer que les images base64 sont correctement préservées
    let processed = html;

    // PROTÉGER les formules mathématiques si renderMath est activé
    const mathPlaceholders: string[] = [];
    let placeholderIndex = 0;
    
    if (renderMath) {
      // Protéger les formules en bloc $$...$$
      processed = processed.replace(/\$\$[\s\S]*?\$\$/g, (match) => {
        const placeholder = `__MATH_BLOCK_${placeholderIndex}__`;
        mathPlaceholders[placeholderIndex] = match;
        placeholderIndex++;
        return placeholder;
      });
      
      // Protéger les formules inline $...$
      processed = processed.replace(/(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g, (match) => {
        const placeholder = `__MATH_INLINE_${placeholderIndex}__`;
        mathPlaceholders[placeholderIndex] = match;
        placeholderIndex++;
        return placeholder;
      });
    }

    // Trouver toutes les images base64 et s'assurer qu'elles sont correctement formatées
    const base64ImageRegex = /<img([^>]+)src=["'](data:image\/[^"']+)["']([^>]*)>/gi;
    
    processed = processed.replace(base64ImageRegex, (match, beforeSrc, src, afterSrc) => {
      // Nettoyer et préserver le src base64
      let cleanSrc = src.trim();
      
      // S'assurer que le src est correctement encodé
      // Ne pas modifier le contenu base64, juste s'assurer qu'il est bien dans les guillemets
      cleanSrc = cleanSrc.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      
      // Ajouter des attributs pour améliorer le chargement
      const loadingAttr = beforeSrc.includes('loading') ? '' : ' loading="lazy"';
      const decodingAttr = beforeSrc.includes('decoding') ? '' : ' decoding="async"';
      
      return `<img${beforeSrc}src="${cleanSrc}"${afterSrc}${loadingAttr}${decodingAttr}>`;
    });

    // RESTAURER les formules mathématiques si renderMath est activé
    if (renderMath) {
      mathPlaceholders.forEach((formula, index) => {
        processed = processed.replace(`__MATH_BLOCK_${index}__`, formula);
        processed = processed.replace(`__MATH_INLINE_${index}__`, formula);
      });
    }

    setProcessedHtml(processed);
  }, [html, renderMath]);

  // Gérer les erreurs de chargement d'image après le rendu
  useEffect(() => {
    if (!containerRef.current) return;

    const images = containerRef.current.querySelectorAll('img');
    
    const handleImageError = (img: HTMLImageElement) => {
      const src = img.src;
      
      // Si c'est une image base64 qui échoue, essayer de la réparer
      if (src.startsWith('data:image/')) {
        console.warn('Erreur de chargement d\'image base64:', src.substring(0, 100));
        
        // Créer un placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'image-error-placeholder';
        placeholder.textContent = '⚠️ Image non disponible';
        placeholder.style.cssText = 'padding: 20px; background: #fef3c7; border: 1px dashed #f59e0b; text-align: center; color: #92400e; border-radius: 8px; margin: 10px 0;';
        
        img.style.display = 'none';
        img.parentNode?.insertBefore(placeholder, img.nextSibling);
      }
    };

    images.forEach((img) => {
      // Vérifier si l'image est déjà chargée
      if (img.complete && img.naturalHeight === 0) {
        handleImageError(img);
      } else {
        img.addEventListener('error', () => handleImageError(img), { once: true });
      }
    });

    return () => {
      images.forEach((img) => {
        img.removeEventListener('error', () => handleImageError(img));
      });
    };
  }, [processedHtml]);

  if (!html) return null;

  // Si renderMath est activé, utiliser MathJax pour rendre les formules après le rendu HTML
  // MathJax peut traiter les formules LaTeX directement dans le HTML rendu
  useEffect(() => {
    if (renderMath && containerRef.current && (window as any).MathJax) {
      const mathJax = (window as any).MathJax;
      if (mathJax.typesetPromise) {
        mathJax.typesetPromise([containerRef.current]).catch((err: any) => {
          console.warn('Erreur MathJax typeset:', err);
        });
      } else if (mathJax.typeset) {
        mathJax.typeset([containerRef.current]);
      }
    }
  }, [processedHtml, renderMath]);

  return (
    <div 
      ref={containerRef}
      className={`safe-html-renderer ${className}`}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
}
