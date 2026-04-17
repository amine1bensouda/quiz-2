import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { stripHtml } from '@/lib/utils';

interface CourseSchemaProps {
  slug: string;
  title: string;
  description?: string | null;
  moduleCount: number;
  totalQuizzes: number;
}

export default function CourseSchema({
  slug,
  title,
  description,
  moduleCount,
  totalQuizzes,
}: CourseSchemaProps) {
  const cleanTitle = stripHtml(title);
  const cleanDescription = stripHtml(description || '');

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: cleanTitle,
    description: cleanDescription || `${cleanTitle} - exam preparation course on ${SITE_NAME}.`,
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    url: `${SITE_URL}/quiz/course/${encodeURIComponent(slug)}`,
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      numberOfCredits: moduleCount,
    },
    educationalLevel: 'Exam preparation',
    teaches: [`${totalQuizzes} quizzes`, `${moduleCount} modules`],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

