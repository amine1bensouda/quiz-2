'use client';

import Link from 'next/link';
import { formatNumber } from '@/lib/utils';

interface CourseUnlockHeroProps {
  courseId: string;
  courseTitle: string;
  priceLabel: string;
  trialEligible: boolean;
  trialShortLabel: string;
  trialLongLabel: string;
  highlights: string[];
  questionCount: number;
  totalQuizzes: number;
  totalModules: number;
  totalLessons: number;
}

function CheckIcon() {
  return (
    <svg className="mt-0.5 h-5 w-5 shrink-0 text-[#f5c14a]" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function trialBadgeLabel(trialEligible: boolean, trialShortLabel: string): string {
  if (!trialEligible) return 'FULL ACCESS';
  const minutesMatch = trialShortLabel.match(/^(\d+)\s*min/i);
  if (minutesMatch) return `${minutesMatch[1]}-MINUTE FREE TRIAL`;
  const hoursMatch = trialShortLabel.match(/^(\d+)\s*h/i);
  if (hoursMatch) return `${hoursMatch[1]}-HOUR FREE TRIAL`;
  const daysMatch = trialShortLabel.match(/^(\d+)\s*d/i);
  if (daysMatch) return `${daysMatch[1]}-DAY FREE TRIAL`;
  return 'FREE TRIAL';
}

function ctaLabel(trialEligible: boolean, trialShortLabel: string): string {
  if (!trialEligible) return 'Continue to checkout →';
  const minutesMatch = trialShortLabel.match(/^(\d+)\s*min/i);
  if (minutesMatch) return `Start My Free ${minutesMatch[1]}-Minute Trial →`;
  const hoursMatch = trialShortLabel.match(/^(\d+)\s*h/i);
  if (hoursMatch) return `Start My Free ${hoursMatch[1]}-Hour Trial →`;
  const daysMatch = trialShortLabel.match(/^(\d+)\s*d/i);
  if (daysMatch) return `Start My Free ${daysMatch[1]}-Day Trial →`;
  return 'Start My Free Trial →';
}

function footerCopy(trialEligible: boolean, trialShortLabel: string): string {
  if (!trialEligible) {
    return 'Billed immediately. Manage or cancel from your dashboard.';
  }
  const minutesMatch = trialShortLabel.match(/^(\d+)\s*min/i);
  if (minutesMatch) return `No charge for the first ${minutesMatch[1]} minutes. Cancel anytime.`;
  const hoursMatch = trialShortLabel.match(/^(\d+)\s*h/i);
  if (hoursMatch) return `No charge for the first ${hoursMatch[1]} hours. Cancel anytime.`;
  const daysMatch = trialShortLabel.match(/^(\d+)\s*d/i);
  if (daysMatch) return `No charge for the first ${daysMatch[1]} days. Cancel anytime.`;
  return 'No charge during the free trial. Cancel anytime.';
}

function shortSubject(courseTitle: string): string {
  return courseTitle
    .replace(/\s*Q-?bank\s*/gi, ' ')
    .replace(/\s*Question\s*Bank\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function CourseUnlockHero({
  courseId,
  courseTitle,
  priceLabel,
  trialEligible,
  trialShortLabel,
  highlights,
  questionCount,
  totalQuizzes,
}: CourseUnlockHeroProps) {
  const subject = shortSubject(courseTitle) || 'exam';
  const coverageTitle = `Comprehensive ${subject} Coverage`;

  const featureList =
    highlights.length > 0
      ? highlights
      : [
          `Full access to all ${subject} modules`,
          `Coverage across every major ${subject} problem type`,
          'Track your progress and identify weak areas',
          'Practice at your own pace, anytime',
          'Cancel anytime',
        ];

  const mid = Math.ceil(featureList.length / 2);
  const leftFeatures = featureList.slice(0, mid);
  const rightFeatures = featureList.slice(mid);

  const [priceMain, priceSuffix] = priceLabel.includes('/')
    ? [priceLabel.split('/')[0], `/${priceLabel.split('/').slice(1).join('/')}`]
    : [priceLabel, ''];

  return (
    <div className="course-unlock-hero mt-8 animate-fade-in md:mt-10">
      <div className="course-unlock-hero__shell relative overflow-hidden rounded-[1.6rem] border border-[#8b6cff]/45 bg-[#0c0c1c]/95 p-5 sm:rounded-[1.85rem] sm:p-7 md:p-8 lg:p-9">
        <div className="pointer-events-none absolute -right-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[#7c5cff]/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-[#2be4c8]/10 blur-3xl" />

        <div className="relative grid items-stretch gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.78fr)] lg:gap-10">
          <div className="min-w-0">
            <div className="course-unlock-hero__badge mb-4 inline-flex items-center gap-2 rounded-full border border-[#f5c14a]/45 bg-[#120f08]/70 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f5c14a]">
              <span className="course-unlock-hero__dot h-2 w-2 rounded-full bg-[#f5c14a]" />
              {trialBadgeLabel(trialEligible, trialShortLabel)}
            </div>

            <h2 className="mb-5 text-[1.65rem] font-bold leading-[1.15] tracking-tight text-white sm:text-3xl md:text-[2.05rem]">
              {coverageTitle}
            </h2>

            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5">
              <div className="course-unlock-hero__stat flex items-center gap-3.5 rounded-2xl border border-[#9b7cff]/35 bg-gradient-to-br from-[#6b4dff] via-[#4b35b8] to-[#2a1c6e] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] sm:p-[1.15rem]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </span>
                <div>
                  <p className="text-[1.75rem] font-bold leading-none tracking-tight text-white sm:text-[2rem]">
                    {formatNumber(questionCount)}
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-white/85">Practice Questions</p>
                </div>
              </div>

              <div className="course-unlock-hero__stat flex items-center gap-3.5 rounded-2xl border border-[#2be4c8]/35 bg-gradient-to-br from-[#1aa896] via-[#0f7468] to-[#0a3d42] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] sm:p-[1.15rem]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </span>
                <div>
                  <p className="text-[1.75rem] font-bold leading-none tracking-tight text-white sm:text-[2rem]">
                    {formatNumber(totalQuizzes)}
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-white/85">Practice Quizzes</p>
                </div>
              </div>
            </div>

            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <ul className="space-y-3">
                {leftFeatures.map((item) => (
                  <li key={`left-${item}`} className="course-unlock-hero__feature flex items-start gap-2.5 text-[15px] leading-snug text-[#ece8f5]">
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <ul className="space-y-3">
                {rightFeatures.map((item) => (
                  <li key={`right-${item}`} className="course-unlock-hero__feature flex items-start gap-2.5 text-[15px] leading-snug text-[#ece8f5]">
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="course-unlock-hero__pricing relative flex flex-col justify-center overflow-hidden rounded-[1.35rem] border border-[#9b7cff]/55 bg-gradient-to-b from-[#3a2a8a] via-[#22165a] to-[#120c2e] px-6 py-7 shadow-[0_0_50px_rgba(124,92,255,0.35)] sm:px-7 sm:py-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(179,136,255,0.28),transparent_55%)]" />
            <div className="relative text-center">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
                {trialEligible ? 'Start free, then' : 'Subscribe for'}
              </p>
              <p className="mb-1 leading-none tracking-tight text-white">
                <span className="text-5xl font-bold sm:text-[3.4rem]">{priceMain}</span>
                {priceSuffix ? <span className="text-2xl font-semibold text-white/90 sm:text-3xl">{priceSuffix}</span> : null}
              </p>
              <p className="mb-7 mt-3 text-sm text-white/65">Per course · Cancel anytime</p>

              <Link
                href={`/checkout?courseId=${courseId}`}
                className="course-unlock-hero__cta group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-[#f5c14a] px-5 py-4 text-[15px] font-bold text-[#0c0a00] shadow-[0_12px_32px_rgba(245,193,74,0.4)] transition hover:scale-[1.02] hover:bg-[#f9d06a]"
              >
                <span className="course-unlock-hero__cta-shine pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100" />
                <span className="relative">{ctaLabel(trialEligible, trialShortLabel)}</span>
              </Link>

              <p className="mt-4 text-center text-xs leading-relaxed text-white/60">
                {footerCopy(trialEligible, trialShortLabel)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
