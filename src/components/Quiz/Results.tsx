'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { QuizResults, Quiz } from '@/lib/types';
import { getAllQuiz } from '@/lib/wordpress';
import { SITE_URL } from '@/lib/constants';
import { trackSocialShare, trackSimilarQuizClick } from '@/lib/analytics';
import { getCurrentUser } from '@/lib/auth';

interface ResultsProps {
  results: QuizResults;
  quizTitle: string;
  quizSlug: string;
  minimumScore?: number;
  quizId?: number;
  category?: string;
}

export default function Results({
  results,
  quizTitle,
  quizSlug,
  minimumScore = 70,
  quizId,
  category,
}: ResultsProps) {
  const [similarQuizs, setSimilarQuizs] = useState<Quiz[]>([]);
  const [user, setUser] = useState<any>(null);
  const percentage = results.percentage;
  const passed = results.passed;
  const minutes = Math.floor(results.timeSpent / 60);
  const seconds = results.timeSpent % 60;

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  // Charger les quiz similaires
  useEffect(() => {
    const loadSimilarQuizs = async () => {
      try {
        const allQuizs = await getAllQuiz();
        // Filter by category if available, exclude current quiz
        const filtered = allQuizs
          .filter((q) => q.id !== quizId && (category ? q.acf?.categorie === category : true))
          .slice(0, 3);
        setSimilarQuizs(filtered);
      } catch (error) {
        console.error('Error loading similar quizzes:', error);
      }
    };

    if (quizId) {
      loadSimilarQuizs();
    }
  }, [quizId, category]);

  // Fonction de partage social
  const shareUrl = `${SITE_URL}/quiz/${quizSlug}`;
  const shareText = `I got ${percentage}% on the quiz "${quizTitle}"! Test your knowledge:`;

  const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin' | 'whatsapp') => {
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
    };

    window.open(urls[platform], '_blank', 'width=600,height=400');
    trackSocialShare(platform, quizTitle);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  // Déterminer le message et l'icône selon le score
  let message = '';
  let icon = '';
  let gradientClass = '';
  let badgeClass = '';

  if (percentage >= 90) {
    message = 'Excellent!';
    icon = '🌟';
    gradientClass = 'from-yellow-400 via-amber-500 to-orange-500';
    badgeClass = 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-300';
  } else if (percentage >= 80) {
    message = 'Very Good!';
    icon = '👏';
    gradientClass = 'from-green-400 via-emerald-500 to-teal-500';
    badgeClass = 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300';
  } else if (percentage >= minimumScore) {
    message = 'Well Done!';
    icon = '🎯';
    gradientClass = 'from-blue-400 via-primary-500 to-indigo-500';
    badgeClass = 'bg-gradient-to-r from-blue-100 to-primary-100 text-blue-800 border-blue-300';
  } else {
    message = 'Keep Up the Effort!';
    icon = '📚';
    gradientClass = 'from-orange-400 via-red-500 to-pink-500';
    badgeClass = 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border-orange-300';
  }

  return (
    <div className="max-w-3xl mx-auto animate-scale-in">
      <div className="card-modern p-8 md:p-12 relative overflow-hidden">
        {/* Effet de fond animé */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-10 blur-3xl -z-0 animate-pulse-glow`}></div>
        
        <div className="relative z-10">
          {/* En-tête avec icône */}
          <div className="text-center mb-10">
            <div className="inline-block text-7xl mb-6 animate-bounce-slow">
              {icon}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 text-shadow">
              {message}
            </h2>
            <p className="text-lg text-gray-600">
              You have completed the quiz
            </p>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              {quizTitle}
            </p>
          </div>

          {/* Score principal avec animation */}
          <div className={`relative mb-10 rounded-2xl p-8 md:p-12 bg-gradient-to-br ${gradientClass} text-white shadow-2xl overflow-hidden`}>
            {/* Effet de brillance */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            
            <div className="relative z-10 text-center">
              <div className="text-7xl md:text-8xl font-black mb-4 text-shadow-lg">
                {percentage}%
              </div>
              <div className="text-xl md:text-2xl opacity-95 font-semibold">
                {results.correctAnswers} out of {results.totalQuestions} correct answers
              </div>
            </div>
          </div>

          {/* Statistiques détaillées */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 text-center border-2 border-green-200 shadow-md transform hover:scale-105 transition-transform">
              <div className="text-4xl font-black text-green-600 mb-2">
                {results.correctAnswers}
              </div>
              <div className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                Correct
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-6 text-center border-2 border-red-200 shadow-md transform hover:scale-105 transition-transform">
              <div className="text-4xl font-black text-red-600 mb-2">
                {results.incorrectAnswers}
              </div>
              <div className="text-sm font-semibold text-red-700 uppercase tracking-wide">
                Incorrect
              </div>
            </div>
          </div>

          {/* Temps passé */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 mb-8 text-center border border-gray-200 shadow-md">
            <div className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              ⏱️ Time Spent
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {minutes > 0 && `${minutes} min `}
              {seconds} sec
            </div>
          </div>

          {/* Résultat (réussi/échoué) */}
          <div className={`rounded-xl p-5 mb-8 text-center font-bold text-lg border-2 ${badgeClass} shadow-md animate-fade-in`}>
            {passed ? (
              <span className="flex items-center justify-center gap-2">
                <span className="text-2xl">✅</span>
                Quiz Passed! Minimum score required: {minimumScore}%
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span className="text-2xl">⚠️</span>
                Insufficient Score. Minimum score required: {minimumScore}%
              </span>
            )}
          </div>

          {/* Partage social */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Share Your Results</h3>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => handleShare('twitter')}
                className="px-6 py-3 rounded-xl bg-[#1DA1F2] text-white font-semibold hover:bg-[#1a8cd8] transition-all transform hover:scale-105 shadow-md flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                Twitter
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="px-6 py-3 rounded-xl bg-[#1877F2] text-white font-semibold hover:bg-[#166fe5] transition-all transform hover:scale-105 shadow-md flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </button>
              <button
                onClick={() => handleShare('whatsapp')}
                className="px-6 py-3 rounded-xl bg-[#25D366] text-white font-semibold hover:bg-[#20ba5a] transition-all transform hover:scale-105 shadow-md flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp
              </button>
              <button
                onClick={handleCopyLink}
                className="px-6 py-3 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-800 transition-all transform hover:scale-105 shadow-md flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Link
              </button>
            </div>
          </div>

          {/* Quiz similaires */}
          {similarQuizs.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Similar Quizzes</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {similarQuizs.map((quiz) => (
                  <Link
                    key={quiz.id}
                    href={`/quiz/${quiz.slug}`}
                    onClick={() => trackSimilarQuizClick(quiz.id, quiz.title.rendered.replace(/<[^>]*>/g, ''))}
                    className="card-modern p-4 hover:scale-105 transition-transform"
                  >
                    <h4 className="font-bold text-gray-900 mb-2 line-clamp-2">
                      {quiz.title.rendered.replace(/<[^>]*>/g, '')}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {quiz.acf?.nombre_questions || 0} questions
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={`/quiz/${quizSlug}?reset=true`}
              onClick={(e) => {
                // Nettoyer la progression sauvegardée avant de refaire le quiz
                if (quizId) {
                  localStorage.removeItem(`quiz-progress-${quizId}`);
                }
              }}
              className="flex-1 btn-primary text-center py-4 text-lg"
            >
              🔄 Retake Quiz
            </Link>
            {user && (
              <Link
                href="/dashboard"
                className="flex-1 btn-secondary text-center py-4 text-lg"
              >
                📊 View Dashboard
              </Link>
            )}
            <Link
              href="/quiz"
              className="flex-1 btn-secondary text-center py-4 text-lg"
            >
              📚 View Other Quizzes
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
