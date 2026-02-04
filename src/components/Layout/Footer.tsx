import Link from 'next/link';
import { SITE_NAME } from '@/lib/constants';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 text-gray-700 mt-20 border-t border-gray-200">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Site Description */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-black rounded flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <h3 className="text-gray-900 font-bold text-lg">{SITE_NAME}</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Test your knowledge with our interactive mathematics quizzes. Learn while having fun!
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-gray-900 font-bold mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  href="/about-us" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact-us" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link 
                  href="/blogs" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Blogs
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Quizzes */}
          <div>
            <h4 className="text-gray-900 font-bold mb-4">Quizzes</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/quiz" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  All Quizzes
                </Link>
              </li>
              <li>
                <Link 
                  href="/categorie" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Categories
                </Link>
              </li>
              <li>
                <Link 
                  href="/a-propos" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Information */}
          <div>
            <h4 className="text-gray-900 font-bold mb-4">Information</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/terms-of-service" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact-us" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Separator Line */}
        <div className="border-t border-gray-300 mt-12 pt-8">
          {/* Copyright */}
          <p className="text-center text-sm text-gray-600 mb-2">
            © {currentYear} {SITE_NAME}. All rights reserved.
          </p>
          <p className="text-center text-sm text-gray-600">
            Made with <span className="text-red-500">❤️</span> for quiz enthusiasts
          </p>
        </div>
      </div>
    </footer>
  );
}
