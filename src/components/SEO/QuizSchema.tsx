import type { Quiz } from '@/lib/types';
import { SITE_URL } from '@/lib/constants';
import { stripHtml } from '@/lib/utils';

interface QuizSchemaProps {
  quiz: Quiz;
}

export default function QuizSchema({ quiz }: QuizSchemaProps) {
  const questions = quiz.acf?.questions || [];
  const questionCount = questions.length;
  const title = stripHtml(quiz.title.rendered);
  const description = stripHtml(quiz.excerpt?.rendered || quiz.content?.rendered || '');

  // Plateforme par abonnement : l'accès est toujours payant (subscription-only).
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: title,
    description,
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
    isAccessibleForFree: false,
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

