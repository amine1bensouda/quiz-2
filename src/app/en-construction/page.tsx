import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Under construction',
  description: 'Temporary page — site is being updated.',
  robots: { index: false, follow: false },
};

export default function EnConstructionPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-lg w-full text-center space-y-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-purple-100 shadow-xl shadow-purple-500/10 p-10 sm:p-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-2xl font-bold shadow-lg">
          ⋯
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Site under construction
          </h1>
          <p className="mt-3 text-gray-600 leading-relaxed">
            {SITE_NAME} is temporarily unavailable while we push an update.
            Thanks for your patience — we'll be back soon.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <span className="inline-flex items-center justify-center gap-2 text-sm text-purple-700 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
            </span>
            Work in progress
          </span>
        </div>
        <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">
          Temporary page — remove or disable once the launch is complete.
        </p>
        <Link
          href="/"
          className="inline-block text-sm font-medium text-indigo-600 hover:text-indigo-800 underline-offset-4 hover:underline"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
