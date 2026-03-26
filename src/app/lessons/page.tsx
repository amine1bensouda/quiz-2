import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import AnimatedShapes from '@/components/Layout/AnimatedShapes';
import BackgroundPattern from '@/components/Layout/BackgroundPattern';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Lessons | The School of Mathematics',
  description: 'Browse all math lessons and start learning step by step.',
};

function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default async function LessonsPage() {
  const lessons = await prisma.lesson.findMany({
    where: {
      OR: [
        { moduleId: null },
        {
          module: {
            course: {
              status: 'published',
            },
          },
        },
      ],
    },
    include: {
      module: {
        include: {
          course: {
            select: {
              title: true,
            },
          },
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }],
    take: 50,
  });

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 overflow-hidden">
      <AnimatedShapes variant="hero" count={6} intensity="medium" />
      <BackgroundPattern variant="grid" opacity={0.05} />

      <div className="container mx-auto px-4 sm:px-5 md:px-6 py-10 sm:py-12 md:py-16 relative z-10 max-w-[100vw]">
        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-10 sm:mb-14 md:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 bg-clip-text text-transparent mb-3 sm:mb-4">
              Lessons
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Discover structured lessons to build your math skills.
            </p>
          </header>

          {lessons.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {lessons.map((lesson) => {
                const preview = stripHtml(lesson.content).slice(0, 140);
                return (
                  <Link
                    key={lesson.id}
                    href={`/quiz/lesson/${lesson.slug}`}
                    className="group flex flex-col backdrop-blur-xl bg-white/90 rounded-2xl sm:rounded-3xl shadow-lg border border-white/60 overflow-hidden hover:shadow-xl hover:border-indigo-200/80 transition-all duration-300"
                  >
                    <div className="p-5 sm:p-6 md:p-7 flex flex-col flex-1">
                      <span className="inline-block w-fit px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 mb-3">
                        {lesson.module
                          ? `${lesson.module.course.title} / ${lesson.module.title}`
                          : 'Independent lesson'}
                      </span>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {lesson.title}
                      </h2>
                      <p className="text-sm sm:text-base text-gray-600 line-clamp-3 flex-1">
                        {preview || 'Open this lesson to start learning.'}
                      </p>
                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-gray-500">
                          Lesson
                        </span>
                        <span className="text-sm font-semibold text-indigo-600 group-hover:underline">
                          Open →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 sm:py-20 backdrop-blur-xl bg-white/80 rounded-2xl sm:rounded-3xl shadow-xl border border-white/40">
              <div className="text-5xl sm:text-6xl mb-4">📚</div>
              <p className="text-gray-600 text-base sm:text-lg">No lessons available right now.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

