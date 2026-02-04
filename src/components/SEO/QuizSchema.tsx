import type { Quiz } from '@/lib/types';
import { SITE_URL } from '@/lib/constants';

interface QuizSchemaProps {
  quiz: Quiz;
}

export default function QuizSchema({ quiz }: QuizSchemaProps) {
  const questions = quiz.acf?.questions || [];
  const questionCount = questions.length;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: quiz.title.rendered,
    description: quiz.excerpt?.rendered || quiz.content?.rendered,
    url: `${SITE_URL}/quiz/${quiz.slug}`,
    ...(quiz.featured_media_url && {
      image: quiz.featured_media_url,
    }),
    ...(quiz.acf?.duree_estimee && {
      timeRequired: `PT${quiz.acf.duree_estimee}M`,
    }),
    ...(quiz.acf?.niveau_difficulte && {
      educationalLevel: quiz.acf.niveau_difficulte,
    }),
    numberOfQuestions: questionCount,
    ...(quiz.acf?.categorie && {
      about: {
        '@type': 'Thing',
        name: quiz.acf.categorie,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

