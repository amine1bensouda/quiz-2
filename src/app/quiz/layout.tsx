import { Metadata } from 'next';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'All Quizzes',
  description: `Discover all our interactive quizzes on various mathematics topics at ${SITE_NAME}`,
};

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
