'use client';

import { useEffect, useRef, useState } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  text: string;
  className?: string;
  useMathJax?: boolean; // Option pour utiliser MathJax au lieu de KaTeX
}

/**
 * Nettoie le HTML d'une chaîne de caractères
 * Préserve les sauts de ligne et les espaces pour un meilleur formatage
 */
function stripHtml(html: string): string {
  if (!html) return '';
  
  // PROTÉGER les formules mathématiques avant de nettoyer le HTML
  // Remplacer temporairement les formules par des placeholders
  const mathPlaceholders: string[] = [];
  let placeholderIndex = 0;
  
  // Protéger les formules en bloc $$...$$
  let protectedHtml = html.replace(/\$\$[\s\S]*?\$\$/g, (match) => {
    const placeholder = `__MATH_BLOCK_${placeholderIndex}__`;
    mathPlaceholders[placeholderIndex] = match;
    placeholderIndex++;
    return placeholder;
  });
  
  // Protéger les formules inline $...$ (mais pas celles déjà protégées)
  protectedHtml = protectedHtml.replace(/(?<!__MATH_BLOCK_\d+__)(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g, (match) => {
    const placeholder = `__MATH_INLINE_${placeholderIndex}__`;
    mathPlaceholders[placeholderIndex] = match;
    placeholderIndex++;
    return placeholder;
  });
  
  // Maintenant nettoyer le HTML
  let cleaned = protectedHtml
    // Remplacer les balises de paragraphe par des sauts de ligne
    .replace(/<p[^>]*>/gi, ' ')
    .replace(/<\/p>/gi, '\n\n')
    // Remplacer les balises de saut de ligne
    .replace(/<br\s*\/?>/gi, '\n')
    // Remplacer les divs
    .replace(/<div[^>]*>/gi, ' ')
    .replace(/<\/div>/gi, '\n')
    // Supprimer toutes les autres balises HTML
    .replace(/<[^>]*>/g, ' ')
    // Décoder les entités HTML (IMPORTANT: préserver les espaces)
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#36;/g, '$') // Décoder les dollars échappés
    .replace(/&dollar;/g, '$')
    // Normaliser les espaces multiples (mais pas les supprimer complètement)
    .replace(/[ \t]+/g, ' ')
    // Nettoyer les sauts de ligne multiples
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  // RESTAURER les formules mathématiques
  mathPlaceholders.forEach((formula, index) => {
    cleaned = cleaned.replace(`__MATH_BLOCK_${index}__`, formula);
    cleaned = cleaned.replace(`__MATH_INLINE_${index}__`, formula);
  });
  
  return cleaned;
}

/**
 * Hook pour charger MathJax depuis CDN
 */
function useMathJax() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Vérifier si MathJax est déjà chargé
    if ((window as any).MathJax) {
      setLoaded(true);
      return;
    }

    // Charger MathJax depuis CDN
    const script = document.createElement('script');
    script.src = 'https://polyfill.io/v3/polyfill.min.js?features=es6';
    script.async = true;
    document.head.appendChild(script);

    const mathJaxScript = document.createElement('script');
    mathJaxScript.id = 'MathJax-script';
    mathJaxScript.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
    mathJaxScript.async = true;
    
    mathJaxScript.onload = () => {
      // MathJax se configure automatiquement via window.MathJax
      // Attendre que MathJax soit prêt
      if ((window as any).MathJax && (window as any).MathJax.startup) {
        (window as any).MathJax.startup.promise.then(() => {
          setLoaded(true);
        });
      } else {
        // Fallback: attendre un peu si MathJax n'est pas encore prêt
        setTimeout(() => {
          setLoaded(true);
        }, 500);
      }
    };

    mathJaxScript.onerror = () => {
      setError(true);
    };

    document.head.appendChild(mathJaxScript);

    return () => {
      // Nettoyer si nécessaire
    };
  }, []);

  return { loaded, error };
}

/**
 * Composant pour rendre du texte avec MathJax
 */
function MathJaxRenderer({ text, className = '' }: { text: string; className: string }) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const { loaded } = useMathJax();
  const [processedText, setProcessedText] = useState(text);

  useEffect(() => {
    // Préparer le texte pour MathJax en préservant les formules
    let cleanText = stripHtml(text);
    if (!cleanText) {
      setProcessedText('');
      return;
    }

    // Déséchapper les backslashes
    cleanText = cleanText.replace(/\\\\/g, '\\');
    
    // Préserver les sauts de ligne en les convertissant en <br>
    const lines = cleanText.split('\n');
    const htmlText = lines.map((line, index) => {
      if (index < lines.length - 1) {
        return line + '<br>';
      }
      return line;
    }).join('');

    setProcessedText(htmlText);
  }, [text]);

  useEffect(() => {
    if (loaded && containerRef.current && (window as any).MathJax && processedText) {
      // Typeset le contenu avec MathJax
      const mathJax = (window as any).MathJax;
      if (mathJax.typesetPromise) {
        mathJax.typesetPromise([containerRef.current]).catch((err: any) => {
          console.warn('Erreur MathJax typeset:', err);
        });
      } else if (mathJax.typeset) {
        // Fallback pour versions antérieures de MathJax
        mathJax.typeset([containerRef.current]);
      }
    }
  }, [processedText, loaded]);

  if (!loaded) {
    // Pendant le chargement, afficher le texte brut avec préservation des sauts de ligne
    const lines = processedText.split('<br>');
    return (
      <span className={className}>
        {lines.map((line, index) => (
          <span key={index}>
            {line}
            {index < lines.length - 1 && <br />}
          </span>
        ))}
      </span>
    );
  }

  return (
    <span 
      ref={containerRef} 
      className={className}
      dangerouslySetInnerHTML={{ __html: processedText }}
    />
  );
}

/**
 * Composant pour rendre du texte avec support des formules mathématiques
 * Supporte les formules inline avec $...$ et les formules en bloc avec $$...$$
 * Gère correctement les backslashes échappés (\\$ devient \$)
 * 
 * Options:
 * - useMathJax: true pour utiliser MathJax (meilleur support LaTeX), false pour KaTeX (plus rapide)
 */
export default function MathRenderer({ text, className = '', useMathJax = false }: MathRendererProps) {
  if (!text) return null;

  // Si MathJax est demandé, utiliser le rendu MathJax
  if (useMathJax) {
    return <MathJaxRenderer text={text} className={className} />;
  }

  // Sinon, utiliser KaTeX (comportement par défaut)
  // Nettoyer le HTML du texte avant de traiter les formules mathématiques
  let cleanText = stripHtml(text);

  if (!cleanText) return null;

  // IMPORTANT: Déséchapper les backslashes échappés AVANT de chercher les formules
  // WordPress/JSON peut envoyer \\$ qui doit devenir \$ pour LaTeX
  // Mais on doit faire attention à ne pas casser les vraies formules
  cleanText = cleanText.replace(/\\\\/g, '\\');
  
  // Décoder les entités HTML pour les dollars (si présentes)
  cleanText = cleanText.replace(/&#36;/g, '$');
  cleanText = cleanText.replace(/&dollar;/g, '$');

  // Pattern pour détecter les formules mathématiques
  // $$...$$ pour les formules en bloc (tableaux, arrays, etc.)
  // $...$ pour les formules inline
  // Utiliser une regex plus permissive pour capturer les formules même avec espaces
  const blockMathRegex = /\$\$([\s\S]*?)\$\$/g;
  const inlineMathRegex = /(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g;

  // Debug: logger le texte nettoyé pour voir ce qui se passe
  if (process.env.NODE_ENV === 'development' && cleanText.includes('$$')) {
    console.log('🔍 Texte avec formules détectées:', cleanText.substring(0, 200));
  }

  // Vérifier s'il y a des formules mathématiques
  const hasBlockMath = blockMathRegex.test(cleanText);
  const hasInlineMath = inlineMathRegex.test(cleanText);
  
  // Debug
  if (process.env.NODE_ENV === 'development') {
    if (cleanText.includes('$$') && !hasBlockMath) {
      console.warn('⚠️ Formules $$ détectées dans le texte mais non reconnues par la regex');
    }
  }

  // Si pas de formules mathématiques, retourner le texte nettoyé avec préservation des sauts de ligne
  if (!hasBlockMath && !hasInlineMath) {
    // Préserver les sauts de ligne en les convertissant en <br />
    const lines = cleanText.split('\n');
    if (lines.length > 1) {
      return (
        <span className={className}>
          {lines.map((line, index) => (
            <span key={index}>
              {line}
              {index < lines.length - 1 && <br />}
            </span>
          ))}
        </span>
      );
    }
    return <span className={className}>{cleanText}</span>;
  }

  // Réinitialiser les regex
  blockMathRegex.lastIndex = 0;
  inlineMathRegex.lastIndex = 0;

  const parts: (string | { formula: string; isBlock: boolean })[] = [];
  let processedIndex = 0;
  const allMatches: Array<{ start: number; end: number; formula: string; isBlock: boolean }> = [];

  // Traiter d'abord les formules en bloc ($$...$$)
  let match;
  while ((match = blockMathRegex.exec(cleanText)) !== null) {
    // Déséchapper les backslashes dans la formule
    let formula = match[1].trim().replace(/\\\\/g, '\\');
    allMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      formula: formula,
      isBlock: true,
    });
  }

  // Traiter les formules inline ($...$)
  inlineMathRegex.lastIndex = 0;
  while ((match = inlineMathRegex.exec(cleanText)) !== null) {
    // Vérifier que cette formule inline n'est pas déjà couverte par une formule en bloc
    const isInBlock = allMatches.some(
      bm => match!.index >= bm.start && match!.index < bm.end
    );
    if (!isInBlock) {
      // Déséchapper les backslashes dans la formule
      let formula = match[1].trim().replace(/\\\\/g, '\\');
      allMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        formula: formula,
        isBlock: false,
      });
    }
  }

  // Trier par position
  allMatches.sort((a, b) => a.start - b.start);

  // Construire les parties
  allMatches.forEach((mathMatch) => {
    // Ajouter le texte avant la formule
    if (mathMatch.start > processedIndex) {
      const beforeText = cleanText.substring(processedIndex, mathMatch.start);
      if (beforeText) {
        parts.push(beforeText);
      }
    }

    // Ajouter la formule avec son type (bloc ou inline)
    parts.push({
      formula: mathMatch.formula,
      isBlock: mathMatch.isBlock,
    });

    processedIndex = mathMatch.end;
  });

  // Ajouter le texte restant
  if (processedIndex < cleanText.length) {
    const remainingText = cleanText.substring(processedIndex);
    if (remainingText) {
      parts.push(remainingText);
    }
  }

  // Si aucune formule trouvée, retourner le texte nettoyé
  if (parts.length === 0) {
    return <span className={className}>{cleanText}</span>;
  }

  // Rendre les parties en préservant les sauts de ligne
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          // Préserver les sauts de ligne dans le texte
          const lines = part.split('\n');
          if (lines.length > 1) {
            return (
              <span key={index}>
                {lines.map((line, lineIndex) => (
                  <span key={lineIndex}>
                    {line}
                    {lineIndex < lines.length - 1 && <br />}
                  </span>
                ))}
              </span>
            );
          }
          return <span key={index}>{part}</span>;
        }
        try {
          // Utiliser BlockMath pour les formules en bloc ($$...$$) et InlineMath pour les autres
          if (part.isBlock) {
            return <BlockMath key={index} math={part.formula} />;
          }
          return <InlineMath key={index} math={part.formula} />;
        } catch (error) {
          // En cas d'erreur de parsing, afficher la formule brute
          console.warn('Erreur de rendu mathématique:', part.formula, error);
          return (
            <span key={index}>
              {part.isBlock ? '$$' : '$'}
              {part.formula}
              {part.isBlock ? '$$' : '$'}
            </span>
          );
        }
      })}
    </span>
  );
}

