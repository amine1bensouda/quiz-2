import Image from 'next/image';
import Link from 'next/link';
import type { Quiz } from '@/lib/types';
import { DIFFICULTY_LEVELS } from '@/lib/constants';
import { formatDuration, stripHtml } from '@/lib/utils';

interface QuizCardProps {
  quiz: Quiz;
  index?: number;
}

export default function QuizCard({ quiz, index = 0 }: QuizCardProps) {
  const difficulty = quiz.acf?.niveau_difficulte;
  const difficultyConfig = difficulty ? (DIFFICULTY_LEVELS[difficulty as keyof typeof DIFFICULTY_LEVELS] || DIFFICULTY_LEVELS.Medium) : null;
  const duration = quiz.acf?.duree_estimee;
  const questionCount = quiz.acf?.nombre_questions || 0;

  const getDifficultyStyles = () => {
    if (!difficultyConfig) return '';
    switch (difficultyConfig.color) {
      case 'green':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200';
      case 'yellow':
        return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200';
      case 'orange':
        return 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-200';
    }
  };

  return (
    <Link
      href={`/quiz/${quiz.slug}`}
      prefetch={true}
      className="group block card-modern animate-fade-in relative hover:-translate-y-2"
      style={{ animationDelay: index !== undefined ? `${index * 0.1}s` : '0s' }}
    >
      {quiz.featured_media_url && (
        <div className="relative w-full h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          <Image
            src={quiz.featured_media_url}
            alt={quiz.title.rendered}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Badge catégorie sur image */}
          {quiz.acf?.categorie && (
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold text-gray-900 border border-gray-200">
              {quiz.acf.categorie}
            </div>
          )}
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          {difficultyConfig && (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${getDifficultyStyles()}`}
            >
              <span className="text-base">{difficultyConfig.icon}</span>
              {difficultyConfig.label}
            </span>
          )}
          
          {!quiz.featured_media_url && quiz.acf?.categorie && (
            <span className="text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg font-medium">
              {quiz.acf.categorie}
            </span>
          )}
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors duration-200 line-clamp-2">
          {stripHtml(quiz.title.rendered)}
        </h3>

        {quiz.excerpt?.rendered && (
          <div 
            className="text-gray-600 text-sm mb-5 line-clamp-2 leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: quiz.excerpt.rendered }}
          />
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-5 text-sm text-gray-600">
            {questionCount > 0 && (
              <span className="flex items-center gap-1.5 font-medium">
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-3 h-3 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                {questionCount}
              </span>
            )}
            {duration && duration > 0 && (
              <span className="flex items-center gap-1.5 font-medium">
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-3 h-3 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                {formatDuration(duration)}
              </span>
            )}
          </div>
          
          <span className="inline-flex items-center gap-2 text-gray-900 font-semibold group-hover:text-black group-hover:gap-3 transition-all duration-300">
            Start Quiz
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

