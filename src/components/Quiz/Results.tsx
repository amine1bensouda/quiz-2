'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { QuizResults, Quiz, Question } from '@/lib/types';
import { getAllQuiz } from '@/lib/wordpress';
import { trackSimilarQuizClick } from '@/lib/analytics';
import { getCurrentUser } from '@/lib/auth';

interface ResultsProps {
  results: QuizResults;
  quizTitle: string;
  quizSlug: string;
  minimumScore?: number;
  quizId?: number;
  category?: string;
  questions?: Question[];
}

export default function Results({
  results,
  quizTitle,
  quizSlug,
  minimumScore = 70,
  quizId,
  category,
  questions = [],
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
            {/* Message si le temps est écoulé */}
            {results.timeExpired && (
              <div className="mt-4 bg-orange-50 border-2 border-orange-300 rounded-xl p-4 inline-block">
                <div className="flex items-center gap-2 text-orange-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">Time expired! The quiz was automatically closed.</span>
                </div>
              </div>
            )}
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

          {/* Bouton pour voir la correction */}
          {questions.length > 0 && (
            <div className="mb-8">
              <Link
                href={`/quiz/${quizSlug}/correction`}
                className="w-full px-6 py-4 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-md flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Full Correction
              </Link>
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
