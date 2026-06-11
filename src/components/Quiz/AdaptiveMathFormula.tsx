'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { InlineMath, BlockMath } from 'react-katex';

interface AdaptiveMathFormulaProps {
  formula: string;
  preferBlock?: boolean;
  className?: string;
}

/**
 * Rend une formule inline ou en bloc. Si le rendu inline est coupé sur plusieurs
 * lignes ou déborde, bascule automatiquement en affichage bloc (nouvelle ligne).
 */
export default function AdaptiveMathFormula({
  formula,
  preferBlock = false,
  className = '',
}: AdaptiveMathFormulaProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const [displayBlock, setDisplayBlock] = useState(preferBlock);

  useLayoutEffect(() => {
    setDisplayBlock(preferBlock);
  }, [formula, preferBlock]);

  useLayoutEffect(() => {
    if (preferBlock || displayBlock) return;

    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const katex = wrapper.querySelector('.katex') as HTMLElement | null;
    if (!katex) return;

    const lineHeight = parseFloat(getComputedStyle(wrapper).lineHeight) || 20;
    const brokenAcrossLines = katex.offsetHeight > lineHeight * 1.35;
    const overflows = katex.scrollWidth > katex.clientWidth + 1;

    if (brokenAcrossLines || overflows) {
      setDisplayBlock(true);
    }
  }, [formula, preferBlock, displayBlock]);

  try {
    if (displayBlock) {
      return (
        <span className={`math-block-wrap block w-full max-w-full overflow-x-auto py-0.5 ${className}`.trim()}>
          <BlockMath math={formula} />
        </span>
      );
    }

    return (
      <span ref={wrapperRef} className={`math-inline-atomic ${className}`.trim()}>
        <InlineMath math={formula} />
      </span>
    );
  } catch (error) {
    console.warn('Erreur de rendu mathématique:', formula, error);
    return <span className={className}>{formula}</span>;
  }
}
