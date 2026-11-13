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
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f5c14a]/15 text-[11px] font-bold text-[#f5c14a]">
      ✓
    </span>
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
  if (!trialEligible) return 'Continue to checkout';
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
  if (minutesMatch) {
    return `No charge for the first ${minutesMatch[1]} minutes. Cancel anytime.`;
  }
  const hoursMatch = trialShortLabel.match(/^(\d+)\s*h/i);
  if (hoursMatch) {
    return `No charge for the first ${hoursMatch[1]} hours. Cancel anytime.`;
  }
  const daysMatch = trialShortLabel.match(/^(\d+)\s*d/i);
  if (daysMatch) {
    return `No charge for the first ${daysMatch[1]} days. Cancel anytime.`;
  }
  return 'No charge during the free trial. Cancel anytime.';
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
  const coverageTitle = courseTitle.trim()
    ? `Comprehensive ${courseTitle.trim()} Coverage`
    : 'Comprehensive exam coverage';

  const featureList =
    highlights.length > 0
      ? highlights
      : [
          `Full access to all ${courseTitle || 'course'} modules`,
          'Coverage across every major problem type',
          'Track your progress and identify weak areas',
          'Practice at your own pace, anytime',
          'Cancel anytime',
        ];

  const mid = Math.ceil(featureList.length / 2);
  const leftFeatures = featureList.slice(0, mid);
  const rightFeatures = featureList.slice(mid);

  return (
    <div className="course-unlock-hero mt-8 animate-fade-in">
      <div className="course-unlock-hero__shell relative overflow-hidden rounded-[1.75rem] border border-[#7c5cff]/35 bg-gradient-to-br from-[#12122a] via-[#0e0e1c] to-[#0a0a16] p-5 shadow-[0_0_0_1px_rgba(124,92,255,0.12),0_24px_80px_rgba(0,0,0,0.45)] sm:p-7 md:p-9">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#7c5cff]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-[#2be4c8]/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#b388ff]/50 to-transparent" />

        <div className="relative grid gap-7 lg:grid-cols-[1.35fr_0.85fr] lg:items-stretch lg:gap-8">
          <div className="min-w-0">
            <div className="course-unlock-hero__badge mb-4 inline-flex items-center gap-2 rounded-full border border-[#f5c14a]/40 bg-[#f5c14a]/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f5c14a]">
              <span className="course-unlock-hero__dot h-2 w-2 rounded-full bg-[#f5c14a]" />
              {trialBadgeLabel(trialEligible, trialShortLabel)}
            </div>

            <h2 className="mb-5 text-2xl font-bold leading-tight tracking-tight text-[#f5f2ff] sm:text-3xl md:text-[2rem]">
              {coverageTitle}
            </h2>

            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div
                className="course-unlock-hero__stat flex items-center gap-4 rounded-2xl border border-[#b388ff]/30 bg-gradient-to-br from-[#5b3fd4]/35 via-[#3a2a7a]/40 to-[#1a1438]/80 p-4 sm:p-5"
                style={{ animationDelay: '0ms' }}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#b388ff]/20 text-[#d2b8ff]">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </span>
                <div>
                  <p className="text-2xl font-bold tracking-tight text-[#eeeaf4] sm:text-3xl">
                    {formatNumber(questionCount)}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-[#c4b0ff]">Practice Questions</p>
                </div>
              </div>

              <div
                className="course-unlock-hero__stat flex items-center gap-4 rounded-2xl border border-[#2be4c8]/30 bg-gradient-to-br from-[#0f6f66]/45 via-[#0d4a48]/50 to-[#0a1f24]/90 p-4 sm:p-5"
                style={{ animationDelay: '120ms' }}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2be4c8]/15 text-[#7df0db]">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </span>
                <div>
                  <p className="text-2xl font-bold tracking-tight text-[#eeeaf4] sm:text-3xl">
                    {formatNumber(totalQuizzes)}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-[#7df0db]">Practice Quizzes</p>
                </div>
              </div>
            </div>

            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <ul className="space-y-3">
                {leftFeatures.map((item, index) => (
                  <li
                    key={`left-${item}`}
                    className="course-unlock-hero__feature flex items-start gap-3 text-sm leading-snug text-[#d4d0dc] sm:text-[15px]"
                    style={{ animationDelay: `${200 + index * 80}ms` }}
                  >
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <ul className="space-y-3">
                {rightFeatures.map((item, index) => (
                  <li
                    key={`right-${item}`}
                    className="course-unlock-hero__feature flex items-start gap-3 text-sm leading-snug text-[#d4d0dc] sm:text-[15px]"
                    style={{ animationDelay: `${280 + index * 80}ms` }}
                  >
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="course-unlock-hero__pricing relative flex flex-col justify-center overflow-hidden rounded-2xl border border-[#8b6cff]/45 bg-gradient-to-b from-[#1a1438] via-[#14102c] to-[#0d0b1c] p-6 shadow-[0_0_40px_rgba(124,92,255,0.22)] sm:p-7">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#7c5cff]/25 blur-2xl" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#b388ff]/60 to-transparent" />

            <div className="relative text-center">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c8c2d6]">
                {trialEligible ? 'Start free, then' : 'Subscribe for'}
              </p>
              <p className="mb-1 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                {priceLabel}
              </p>
              <p className="mb-6 text-sm text-[#a29cb0]">Per course · Cancel anytime</p>

              <Link
                href={`/checkout?courseId=${courseId}`}
                className="course-unlock-hero__cta group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#f5c14a] px-5 py-4 text-[15px] font-bold text-[#080810] shadow-[0_10px_30px_rgba(245,193,74,0.35)] transition hover:scale-[1.02] hover:bg-[#f9d06a] hover:shadow-[0_12px_36px_rgba(245,193,74,0.45)]"
              >
                <span className="course-unlock-hero__cta-shine pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100" />
                <span className="relative">{ctaLabel(trialEligible, trialShortLabel)}</span>
              </Link>

              <p className="mt-4 text-center text-xs leading-relaxed text-[#9d98ab]">
                {footerCopy(trialEligible, trialShortLabel)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
