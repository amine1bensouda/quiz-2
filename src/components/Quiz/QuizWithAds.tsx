'use client';

import { useState } from 'react';
import QuizPlayer from './QuizPlayer';
import DisplayAd from '@/components/Ads/DisplayAd';
import InArticleAd from '@/components/Ads/InArticleAd';
import type { Quiz } from '@/lib/types';

interface QuizWithAdsProps {
  quiz: Quiz;
}

/** Wrapper qui affiche les pubs et le quiz ; remonte les pubs quand l'utilisateur clique "Skip Question". */
export default function QuizWithAds({ quiz }: QuizWithAdsProps) {
  const [adKey, setAdKey] = useState(0);

  const handleSkipQuestion = () => {
    setAdKey((k) => k + 1);
  };

  return (
    <>
      <DisplayAd key={`display-${adKey}`} />
      <QuizPlayer quiz={quiz} onSkipQuestion={handleSkipQuestion} />
      <InArticleAd key={`inarticle-${adKey}`} />
    </>
  );
}
