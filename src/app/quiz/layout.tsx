import { Metadata } from 'next';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'All Exams',
  description: `Discover all our practice exams and interactive tests on mathematics topics at ${SITE_NAME}`,
};

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
