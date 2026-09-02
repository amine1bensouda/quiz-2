'use client';

import Link from 'next/link';

interface CourseUnlockHeroProps {
  courseId: string;
  priceLabel: string;
  trialEligible: boolean;
  trialShortLabel: string;
  trialLongLabel: string;
  highlights: string[];
  moduleCount: number;
  totalQuizzes: number;
  totalLessons: number;
}

export default function CourseUnlockHero({
  courseId,
  priceLabel,
  trialEligible,
  trialShortLabel,
  trialLongLabel,
  highlights,
  moduleCount,
  totalQuizzes,
  totalLessons,
}: CourseUnlockHeroProps) {
  const stats = [
    {
      label: 'Modules',
      value: moduleCount,
      color: 'text-[#b388ff]',
      bg: 'from-[#b388ff]/20 to-[#b388ff]/5',
      border: 'border-[#b388ff]/25',
    },
    {
      label: 'Exams',
      value: totalQuizzes,
      color: 'text-[#2be4c8]',
      bg: 'from-[#2be4c8]/20 to-[#2be4c8]/5',
      border: 'border-[#2be4c8]/25',
    },
    ...(totalLessons > 0
      ? [
          {
            label: 'Lessons',
            value: totalLessons,
            color: 'text-emerald-300',
            bg: 'from-emerald-400/20 to-emerald-400/5',
            border: 'border-emerald-400/25',
          },
        ]
      : []),
  ];

  return (
    <div className="course-unlock-hero mt-8 animate-fade-in">
      <div className="course-unlock-hero__glow pointer-events-none absolute -inset-px rounded-3xl opacity-70" />

      <div className="relative overflow-hidden rounded-3xl border border-[#f5c14a]/25 bg-gradient-to-br from-[#0e0e1a] via-[#12121f] to-[#0a0a14] p-6 sm:p-8 md:p-10">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#f5c14a]/10 blur-3xl animate-pulse-slow" />
        <div className="pointer-events-none absolute -bottom-10 left-1/4 h-32 w-32 rounded-full bg-[#b388ff]/10 blur-3xl animate-pulse-slow" />

        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="course-unlock-hero__badge mb-4 inline-flex items-center gap-2 rounded-full border border-[#f5c14a]/35 bg-[#f5c14a]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#f5c14a]">
              <span className="course-unlock-hero__dot h-2 w-2 rounded-full bg-[#f5c14a]" />
              {trialEligible ? trialShortLabel : 'Full access'}
            </div>

            <h2 className="mb-3 font-['Instrument_Serif',serif] text-2xl font-bold text-[#f5f2ff] sm:text-3xl md:text-4xl">
              Unlock the full Qbank
            </h2>
            <p className="mb-6 max-w-xl text-sm leading-relaxed text-[#a29cb0] sm:text-base">
              Get every module, lesson, and exam in this course. Practice with real
              questions, track your progress, and improve your score.
            </p>

            <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`course-unlock-hero__stat rounded-2xl border bg-gradient-to-br p-3 text-center sm:p-4 ${stat.border} ${stat.bg}`}
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <p className={`text-xl font-bold sm:text-2xl ${stat.color}`}>
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[#9d98ab] sm:text-xs">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <ul className="space-y-3">
              {highlights.map((item, index) => (
                <li
                  key={item}
                  className="course-unlock-hero__feature flex items-start gap-3 text-sm text-[#c8c2d6] sm:text-base"
                  style={{ animationDelay: `${200 + index * 100}ms` }}
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f5c14a]/15 text-xs font-bold text-[#f5c14a]">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="course-unlock-hero__pricing relative rounded-2xl border border-white/10 bg-[#080810]/60 p-6 backdrop-blur-sm sm:p-8">
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#f5c14a]/5 via-transparent to-[#b388ff]/5" />

            <div className="relative text-center lg:text-left">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#9d98ab]">
                {trialEligible ? 'Try free, then' : 'Subscribe for'}
              </p>
              <p className="mb-1 text-4xl font-bold tracking-tight text-[#eeeaf4] sm:text-5xl">
                {priceLabel}
              </p>
              <p className="mb-6 text-sm text-[#a29cb0]">per course · cancel anytime</p>

              <Link
                href={`/checkout?courseId=${courseId}`}
                className="course-unlock-hero__cta group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#f5c14a] px-6 py-4 text-base font-bold text-[#080810] shadow-lg shadow-[#f5c14a]/25 transition hover:scale-[1.02] hover:bg-[#f9d06a] hover:shadow-[#f5c14a]/40"
              >
                <span className="course-unlock-hero__cta-shine pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100" />
                <span className="relative">
                  {trialEligible ? `Start ${trialShortLabel}` : 'Continue to checkout'}
                </span>
                <svg
                  className="relative h-5 w-5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>

              <p className="mt-4 text-center text-xs leading-relaxed text-[#9d98ab] lg:text-left">
                {trialEligible
                  ? `${trialLongLabel}. No charge until the trial ends.`
                  : 'Billed immediately. Manage or cancel from your dashboard.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
