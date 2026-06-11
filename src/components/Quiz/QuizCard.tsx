import Image from 'next/image';
import Link from 'next/link';
import type { Quiz } from '@/lib/types';
import { DIFFICULTY_LEVELS } from '@/lib/constants';
import { formatDuration, stripHtml, categoryToEnglish, shouldDisplayDifficulty } from '@/lib/utils';

interface QuizCardProps {
  quiz: Quiz;
  index?: number;
}

export default function QuizCard({ quiz, index = 0 }: QuizCardProps) {
  const difficulty = quiz.acf?.niveau_difficulte;
  const showDifficulty = shouldDisplayDifficulty(difficulty);
  const difficultyConfig = showDifficulty ? (DIFFICULTY_LEVELS[difficulty as keyof typeof DIFFICULTY_LEVELS] || DIFFICULTY_LEVELS.Intermediate) : null;
  const duration = quiz.acf?.duree_estimee;
  const questionCount = quiz.acf?.nombre_questions || 0;
  const isLocked = quiz.isLocked === true;

  const getDifficultyStyles = () => {
    if (!difficultyConfig) return '';
    switch (difficultyConfig.color) {
      case 'green':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'yellow':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'orange':
        return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
      default:
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    }
  };

  return (
    <Link
      href={`/quiz/${quiz.slug}`}
      prefetch={true}
      className="course-quiz-card group relative block h-full animate-fade-in overflow-hidden rounded-2xl border border-white/10 bg-[#141424] shadow-md shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-[#f5c14a]/40 hover:shadow-xl hover:shadow-black/30"
      style={{ animationDelay: index !== undefined ? `${index * 0.1}s` : '0s' }}
    >
      {quiz.featured_media_url && (
        <div className="relative h-48 w-full overflow-hidden bg-[#0c0c18]">
          <Image
            src={quiz.featured_media_url}
            alt={quiz.title.rendered}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {quiz.acf?.categorie && (
            <div className="absolute right-4 top-4 rounded-full border border-white/15 bg-[#111121]/90 px-3 py-1.5 text-xs font-semibold text-[#eeeaf4] backdrop-blur-sm">
              {quiz.acf.categorie}
            </div>
          )}
          {isLocked && (
            <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[#080810]/90 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-sm">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a4 4 0 014 4v2h1a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2h1V6a4 4 0 014-4zm0 2a2 2 0 00-2 2v2h4V6a2 2 0 00-2-2z" />
              </svg>
              Locked
            </div>
          )}
        </div>
      )}

      <div className="flex h-full flex-col p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {difficultyConfig && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${getDifficultyStyles()}`}
              >
                <span className="text-base">{difficultyConfig.icon}</span>
                {difficultyConfig.label}
              </span>
            )}

            {!quiz.featured_media_url && quiz.acf?.categorie && (
              <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-[#a29cb0]">
                {categoryToEnglish(quiz.acf.categorie)}
              </span>
            )}
          </div>

          {isLocked && !quiz.featured_media_url && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#080810] px-3 py-1.5 text-xs font-bold text-white">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a4 4 0 014 4v2h1a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2h1V6a4 4 0 014-4zm0 2a2 2 0 00-2 2v2h4V6a2 2 0 00-2-2z" />
              </svg>
              Locked
            </span>
          )}
        </div>

        <h3 className="mb-2 line-clamp-2 text-lg font-bold text-[#f5f2ff] transition-colors duration-200 group-hover:text-[#f5c14a] sm:mb-3 sm:text-xl">
          {stripHtml(quiz.title.rendered)}
        </h3>

        {quiz.excerpt?.rendered && (
          <div
            className="prose prose-sm prose-invert mb-4 line-clamp-2 hidden max-w-none text-sm leading-relaxed text-[#a29cb0] sm:mb-5 sm:block"
            dangerouslySetInnerHTML={{ __html: quiz.excerpt.rendered }}
          />
        )}

        <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
          <div className="flex items-center gap-5 text-sm text-[#9d98ab]">
            {questionCount > 0 && (
              <span className="flex items-center gap-1.5 font-medium">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/5">
                  <svg className="h-3 w-3 text-[#b388ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                {questionCount}
              </span>
            )}
            {duration && duration > 0 && (
              <span className="flex items-center gap-1.5 font-medium">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/5">
                  <svg className="h-3 w-3 text-[#2be4c8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                {formatDuration(duration)}
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-2 font-semibold text-[#f5c14a] transition-all duration-300 group-hover:gap-3">
            {isLocked ? 'Unlock' : 'Start Quiz'}
            <svg className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
