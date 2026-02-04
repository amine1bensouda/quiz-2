import { Metadata } from 'next';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: `Get in touch with ${SITE_NAME} - We'd love to hear from you`,
};

export default function ContactUsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Contact Us</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-xl text-gray-700 mb-8">
          We'd love to hear from you! Whether you have a question, feedback, or need support,
          our team is here to help.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="card-modern p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Get in Touch</h3>
            <div className="space-y-4 text-gray-700">
              <div>
                <p className="font-semibold mb-1">Email</p>
                <p className="text-gray-600">
                  <a href="mailto:contact@schoolofmathematics.com" className="hover:text-gray-900 underline">
                    contact@schoolofmathematics.com
                  </a>
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1">Support</p>
                <p className="text-gray-600">
                  <a href="mailto:support@schoolofmathematics.com" className="hover:text-gray-900 underline">
                    support@schoolofmathematics.com
                  </a>
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1">Business Hours</p>
                <p className="text-gray-600">Monday - Friday: 9:00 AM - 5:00 PM EST</p>
              </div>
            </div>
          </div>

          <div className="card-modern p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Follow Us</h3>
            <div className="space-y-4 text-gray-700">
              <p className="text-gray-600">Stay connected with us on social media for updates,
              tips, and educational content.</p>
            </div>
          </div>
        </div>

        <div className="card-modern p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
          <form className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                placeholder="your.email@example.com"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 outline-none transition-all resize-none"
                placeholder="Your message..."
              ></textarea>
            </div>
            <button
              type="submit"
              className="btn-primary w-full"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

