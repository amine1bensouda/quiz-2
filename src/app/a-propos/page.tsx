import { Metadata } from 'next';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'About',
  description: `Discover ${SITE_NAME} and our mission`,
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">About</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-xl text-gray-700 mb-6">
          Welcome to {SITE_NAME}, your interactive quiz platform to test
          your knowledge in mathematics and related subjects.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Mission</h2>
        <p className="text-gray-700 mb-6">
          Our goal is to make learning fun and accessible to everyone.
          Whether you want to test your knowledge, learn new things,
          or simply have fun, our quizzes are designed to provide you with an
          enriching experience.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Quizzes</h2>
        <p className="text-gray-700 mb-6">
          We offer a wide range of quizzes covering many mathematical topics:
          algebra, geometry, calculus, statistics, and much more.
          Each quiz is carefully designed to be both educational and
          entertaining.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">How It Works</h2>
        <p className="text-gray-700 mb-6">
          It's simple! Browse our categories, choose a quiz that interests you,
          and start answering questions. At the end, you will receive your score
          and detailed explanations for each answer.
        </p>
      </div>
    </div>
  );
}

