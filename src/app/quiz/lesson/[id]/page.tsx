import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Layout/Navigation';
import BackgroundPattern from '@/components/Layout/BackgroundPattern';
import SafeHtmlRenderer from '@/components/Common/SafeHtmlRenderer';
import { getLessonByIdOrSlug } from '@/lib/lesson-service';

interface Lesson {
  id: string;
  title: string;
  slug: string;
  content: string;
  ctaLink: string | null;
  ctaText: string | null;
  featuredImageUrl: string | null;
  videoUrl: string | null;
  videoPlaybackSeconds: number | null;
  pdfUrl: string | null;
  allowPreview: boolean;
  module: {
    id: string;
    title: string;
    course: {
      id: string;
      title: string;
      slug: string;
    };
  } | null;
}

export const revalidate = 300;

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function LessonPage({ params }: PageProps) {
  const { id: slugOrId } = await Promise.resolve(params);
  const lesson = await getLessonByIdOrSlug(slugOrId);

  if (!lesson) {
    redirect('/quiz');
  }

  if (lesson.slug && lesson.slug !== slugOrId) {
    redirect(`/quiz/lesson/${lesson.slug}`);
  }

  const courseSlug = lesson.module?.course.slug;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50">
      <BackgroundPattern variant="luxury" opacity={0.08} />
      <Navigation />
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-4xl relative z-10">
        <nav className="mb-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-indigo-600">Home</Link>
          <span className="mx-1.5">/</span>
          <Link href="/quiz" className="hover:text-indigo-600">Courses</Link>
          {lesson.module && courseSlug && (
            <>
              <span className="mx-1.5">/</span>
              <Link href={`/quiz/course/${courseSlug}`} className="hover:text-indigo-600">{lesson.module.course.title}</Link>
            </>
          )}
          <span className="mx-1.5">/</span>
          <span className="text-gray-900 font-medium">{lesson.title}</span>
        </nav>

        <article className="rounded-2xl bg-white/90 backdrop-blur-md border border-white/60 shadow-xl overflow-hidden">
          {lesson.featuredImageUrl && (
            <div className="aspect-video w-full bg-gray-100">
              <Image
                src={lesson.featuredImageUrl}
                alt=""
                width={1280}
                height={720}
                className="w-full h-full object-cover"
                sizes="(max-width: 1024px) 100vw, 1024px"
                priority
              />
            </div>
          )}
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{lesson.title}</h1>

            {lesson.videoUrl && (
              <div className="mb-6 rounded-xl overflow-hidden bg-black">
                <video
                  src={lesson.videoUrl}
                  controls
                  className="w-full aspect-video"
                  poster={lesson.featuredImageUrl ?? undefined}
                >
                  Your browser does not support the video tag.
                </video>
                {lesson.videoPlaybackSeconds != null && lesson.videoPlaybackSeconds > 0 && (
                  <p className="text-xs text-gray-400 px-3 py-2">
                    Duration: {Math.floor(lesson.videoPlaybackSeconds / 60)} min {lesson.videoPlaybackSeconds % 60} s
                  </p>
                )}
              </div>
            )}

            {lesson.pdfUrl && (
              <div className="mb-6 rounded-xl border border-gray-200 overflow-hidden bg-gray-100">
                <div className="flex items-center justify-between gap-2 px-4 py-3 bg-white border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-700">PDF</span>
                  <a
                    href={lesson.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Open in new tab
                  </a>
                </div>
                <iframe
                  src={`${lesson.pdfUrl}#view=FitH`}
                  title="Lesson PDF"
                  className="w-full min-h-[60vh] border-0 bg-white"
                />
              </div>
            )}

            {lesson.content && (
              <div className="prose prose-gray max-w-none">
                <SafeHtmlRenderer html={lesson.content} renderMath />
              </div>
            )}

            {lesson.ctaLink && lesson.ctaText && (
              <div className="mt-8">
                <Link
                  href={lesson.ctaLink}
                  className="inline-flex items-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-white font-medium hover:from-indigo-700 hover:to-purple-700 transition-all"
                >
                  {lesson.ctaText}
                </Link>
              </div>
            )}
          </div>
        </article>

        <div className="mt-6">
          {lesson.module && courseSlug ? (
            <Link
              href={`/quiz/course/${courseSlug}`}
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              ← Back to {lesson.module.course.title}
            </Link>
          ) : (
            <Link
              href="/quiz"
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              ← Back to courses
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
