import { Metadata } from 'next';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'About us',
  description: `Learn more about ${SITE_NAME} and our mission to provide quality mathematics education`,
};

export default function AboutUsPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
        {/* About The School of Mathematics */}
        <section className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            About The School of Mathematics
          </h1>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              The School of Mathematics is an independent educational platform dedicated to helping students strengthen their math skills through high-quality, exam-style practice problems.
            </p>
            <p>
              Our goal is to make effective math practice accessible to students preparing for standardized exams such as the ACT, SAT, PSAT, AP, and more as well as anyone looking to improve their mathematical understanding.
            </p>
          </div>
        </section>

        {/* What We Offer */}
        <section className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            What We Offer
          </h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              We provide free math practice problems organized by exam, topic, and difficulty level. Each problem includes a detailed, step-by-step solution designed to help students understand concepts, improve accuracy, and build confidence.
            </p>
            <p>
              As the platform grows, The School of Mathematics will continue expanding to include instructional lessons, video explanations, and curated math resources.
            </p>
          </div>
        </section>

        {/* Who This Platform Is For */}
        <section className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Who This Platform Is For
          </h2>
          <p className="text-gray-700 leading-relaxed">
            The School of Mathematics is designed for middle school students, high school students, early college students, and independent learners who want to practice math in a structured and effective way.
          </p>
        </section>

        {/* Educational Disclaimer */}
        <section className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Educational Disclaimer
          </h2>
          <div className="bg-gray-100 rounded-lg p-6 border border-gray-200">
            <p className="text-gray-700 leading-relaxed">
              The School of Mathematics is an independent educational resource and is not affiliated with or endorsed by ACT, SAT, College Board, or any other testing organization. All trademarks belong to their respective owners.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
