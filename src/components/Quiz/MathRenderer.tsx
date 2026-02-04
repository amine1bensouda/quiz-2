'use client';

import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  text: string;
  className?: string;
}

/**
 * Nettoie le HTML d'une chaîne de caractères
 * Préserve les sauts de ligne et les espaces pour un meilleur formatage
 */
function stripHtml(html: string): string {
  if (!html) return '';
  return html
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
    // Normaliser les espaces multiples (mais pas les supprimer complètement)
    .replace(/[ \t]+/g, ' ')
    // Nettoyer les sauts de ligne multiples
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Composant pour rendre du texte avec support des formules mathématiques
 * Supporte les formules inline avec $...$ et les formules en bloc avec $$...$$
 * Gère correctement les backslashes échappés (\\$ devient \$)
 */
export default function MathRenderer({ text, className = '' }: MathRendererProps) {
  if (!text) return null;

  // Nettoyer le HTML du texte avant de traiter les formules mathématiques
  let cleanText = stripHtml(text);

  if (!cleanText) return null;

  // IMPORTANT: Déséchapper les backslashes échappés AVANT de chercher les formules
  // WordPress/JSON peut envoyer \\$ qui doit devenir \$ pour LaTeX
  // Mais on doit faire attention à ne pas casser les vraies formules
  cleanText = cleanText.replace(/\\\\/g, '\\');

  // Pattern pour détecter les formules mathématiques
  // $$...$$ pour les formules en bloc (tableaux, arrays, etc.)
  // $...$ pour les formules inline
  const blockMathRegex = /\$\$([^$]+)\$\$/g;
  const inlineMathRegex = /(?<!\$)\$(?!\$)([^$]+)\$(?!\$)/g;

  // Vérifier s'il y a des formules mathématiques
  const hasBlockMath = blockMathRegex.test(cleanText);
  const hasInlineMath = inlineMathRegex.test(cleanText);

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

