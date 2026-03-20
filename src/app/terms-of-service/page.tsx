import { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `Terms of Service for ${SITE_NAME} - Read our terms and conditions for using our platform`,
};

export default function TermsOfServicePage() {
  return (
    <div className="bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        
        <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
          <p className="text-sm text-gray-500 mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Agreement to Terms</h2>
            <p>
              By accessing or using {SITE_NAME} ({SITE_URL}), you agree to be bound by these Terms of Service and all 
              applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from 
              using or accessing this website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Use License</h2>
            <p>
              Permission is granted to temporarily access and use {SITE_NAME} for personal, non-commercial transitory 
              viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained on the website</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. User Accounts</h2>
            <p>
              When you create an account with us, you must provide information that is accurate, complete, and current at all times. 
              You are responsible for safeguarding the password and for all activities that occur under your account.
            </p>
            <p className="mt-4">
              You agree not to disclose your password to any third party and to take sole responsibility for any activities 
              or actions under your account, whether or not you have authorized such activities or actions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Acceptable Use</h2>
            <p>You agree not to use the website:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>In any way that violates any applicable national or international law or regulation</li>
              <li>To transmit, or procure the sending of, any advertising or promotional material without our prior written consent</li>
              <li>To impersonate or attempt to impersonate the company, a company employee, another user, or any other person or entity</li>
              <li>In any way that infringes upon the rights of others, or in any way is illegal, threatening, fraudulent, or harmful</li>
              <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the website</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Intellectual Property</h2>
            <p>
              The website and its original content, features, and functionality are owned by {SITE_NAME} and are protected 
              by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
            <p className="mt-4">
              You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, 
              republish, download, store, or transmit any of the material on our website without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Quiz Content and Results</h2>
            <p>
              All quiz content, questions, answers, and explanations are provided for educational purposes only. While we 
              strive for accuracy, we do not guarantee that all content is error-free or up-to-date.
            </p>
            <p className="mt-4">
              Quiz results are provided for informational purposes and should not be considered as official assessments 
              or certifications unless explicitly stated otherwise.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Disclaimer</h2>
            <p>
              The materials on {SITE_NAME} are provided on an 'as is' basis. {SITE_NAME} makes no warranties, expressed 
              or implied, and hereby disclaims and negates all other warranties including, without limitation, implied 
              warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of 
              intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Limitations</h2>
            <p>
              In no event shall {SITE_NAME} or its suppliers be liable for any damages (including, without limitation, 
              damages for loss of data or profit, or due to business interruption) arising out of the use or inability 
              to use the materials on {SITE_NAME}, even if {SITE_NAME} or an authorized representative has been notified 
              orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Links to Other Websites</h2>
            <p>
              Our website may contain links to third-party websites or services that are not owned or controlled by {SITE_NAME}. 
              We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any 
              third-party websites or services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Termination</h2>
            <p>
              We may terminate or suspend your account and bar access to the website immediately, without prior notice or 
              liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">11. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is 
              material, we will provide at least 30 days notice prior to any new terms taking effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">12. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="mt-4 space-y-2">
              <p><strong>Email:</strong> <a href="mailto:contact@schoolofmathematics.com" className="text-gray-900 underline">contact@schoolofmathematics.com</a></p>
              <p><strong>Support:</strong> <a href="mailto:support@schoolofmathematics.com" className="text-gray-900 underline">support@schoolofmathematics.com</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

