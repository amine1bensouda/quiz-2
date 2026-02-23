'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Layout/Navigation';
import BackgroundPattern from '@/components/Layout/BackgroundPattern';
import SafeHtmlRenderer from '@/components/Common/SafeHtmlRenderer';

interface Lesson {
  id: string;
  title: string;
  slug: string;
  content: string;
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
  };
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLesson() {
      try {
        const res = await fetch(`/api/lessons/${id}`);
        if (res.ok) {
          const data = await res.json();
          setLesson(data);
        } else if (res.status === 404) {
          router.push('/quiz');
        }
      } catch (e) {
        console.error('Erreur chargement lesson:', e);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadLesson();
  }, [id, router]);

  if (loading) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="text-5xl mb-4 animate-spin">⏳</div>
          <p className="text-gray-700">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-gray-700 mb-4">Lesson not found.</p>
          <Link href="/quiz" className="text-indigo-600 hover:underline">Back to courses</Link>
        </div>
      </div>
    );
  }

  const courseSlug = lesson.module.course.slug;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50">
      <BackgroundPattern variant="luxury" opacity={0.08} />
      <Navigation />
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-4xl relative z-10">
        <nav className="mb-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-indigo-600">Home</Link>
          <span className="mx-1.5">/</span>
          <Link href="/quiz" className="hover:text-indigo-600">Courses</Link>
          <span className="mx-1.5">/</span>
          <Link href={`/quiz/course/${courseSlug}`} className="hover:text-indigo-600">{lesson.module.course.title}</Link>
          <span className="mx-1.5">/</span>
          <span className="text-gray-900 font-medium">{lesson.title}</span>
        </nav>

        <article className="rounded-2xl bg-white/90 backdrop-blur-md border border-white/60 shadow-xl overflow-hidden">
          {lesson.featuredImageUrl && (
            <div className="aspect-video w-full bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lesson.featuredImageUrl}
                alt=""
                className="w-full h-full object-cover"
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
          </div>
        </article>

        <div className="mt-6">
          <Link
            href={`/quiz/course/${courseSlug}`}
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to {lesson.module.course.title}
          </Link>
        </div>
      </div>
    </div>
  );
}
