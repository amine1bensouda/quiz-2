'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const ROTATING_LINES = [
  'Polishing every detail…',
  'Calibrating the experience…',
  'Almost ready to launch…',
];

type Props = {
  siteName: string;
};

export default function HomeUnderConstruction({ siteName }: Props) {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % ROTATING_LINES.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-8rem)] sm:min-h-[calc(100vh-10rem)] flex items-center justify-center overflow-hidden py-12 px-4">
      {/* Animated mesh background */}
      <div
        className="absolute inset-0 -z-10 animate-under-construction-gradient bg-gradient-to-br from-violet-200 via-fuchsia-100 to-cyan-200"
        aria-hidden
      />
      <div
        className="absolute inset-0 -z-10 opacity-90 animate-under-construction-gradient bg-gradient-to-tr from-indigo-400/30 via-transparent to-rose-300/40 mix-blend-multiply"
        style={{ animationDelay: '-4s' }}
        aria-hidden
      />

      {/* Floating blobs */}
      <div
        className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-purple-400/50 blur-3xl animate-under-construction-blob"
        aria-hidden
      />
      <div
        className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-cyan-400/40 blur-3xl animate-under-construction-blob-delayed"
        aria-hidden
      />
      <div
        className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-pink-400/45 blur-3xl animate-under-construction-blob-slow"
        aria-hidden
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_50%,#000_40%,transparent_100%)]"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-2xl mx-auto text-center">
        <div className="relative rounded-3xl border border-white/40 bg-white/70 shadow-2xl shadow-purple-500/20 backdrop-blur-xl px-8 py-12 sm:px-12 sm:py-14 md:py-16 animate-scale-in">
          {/* Orbiting ring + core */}
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center">
            <div
              className="absolute h-24 w-24 rounded-full border-2 border-dashed border-purple-400/60 animate-under-construction-ring"
              aria-hidden
            />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-500 shadow-lg shadow-fuchsia-500/40 animate-float">
              <svg
                className="h-8 w-8 text-white drop-shadow-md"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
            </div>
          </div>

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-600/90 mb-3">
            Under construction
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-violet-700 via-fuchsia-600 to-cyan-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-under-construction-gradient">
              {siteName}
            </span>
            <br />
            <span className="text-gray-800">is getting an upgrade</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-md mx-auto leading-relaxed mb-8">
            We&apos;re crafting a faster, clearer experience. Check back soon — the new home for your math practice is on its way.
          </p>

          {/* Status line (rotating) */}
          <p
            key={lineIndex}
            className="text-sm font-medium text-purple-700/90 min-h-[1.25rem] animate-fade-in mb-8"
          >
            {ROTATING_LINES[lineIndex]}
          </p>

          {/* Progress track */}
          <div className="relative h-2 w-full max-w-sm mx-auto rounded-full bg-gray-200/80 overflow-hidden mb-10">
            <div className="absolute inset-y-0 left-0 w-2/5 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 animate-pulse-slow" />
            <div
              className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-white/70 to-transparent animate-under-construction-shimmer"
              aria-hidden
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/contact-us"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-black hover:scale-[1.02] active:scale-[0.98]"
            >
              Contact us
            </Link>
            <Link
              href="/about-us"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white/80 px-6 py-3 text-sm font-semibold text-gray-800 transition hover:border-purple-300 hover:bg-white"
            >
              About the project
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
