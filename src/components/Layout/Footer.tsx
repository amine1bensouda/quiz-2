import Link from 'next/link';
import { SITE_NAME } from '@/lib/constants';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#080810] text-[#eeeaf4] mt-20 border-t border-white/10">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Site Description */}
          <div>
            <Link href="/" className="mb-4 inline-flex items-center">
              <h3 className="text-xl font-semibold tracking-[1px] text-[#eeeaf4]">
                <span className="text-[#f5c14a]">CRACK</span>
                <span className="text-[rgba(238,234,244,0.45)] mx-1">×</span>
                <span>THECURVE</span>
              </h3>
            </Link>
            <p className="text-sm text-[rgba(238,234,244,0.55)] leading-relaxed">
              Structured exam preparation with rigorous quizzes and targeted practice to improve your score.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-[#f5c14a] font-bold mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/" 
                  className="text-[rgba(238,234,244,0.55)] hover:text-[#eeeaf4] transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  href="/about-us" 
                  className="text-[rgba(238,234,244,0.55)] hover:text-[#eeeaf4] transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact-us" 
                  className="text-[rgba(238,234,244,0.55)] hover:text-[#eeeaf4] transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link 
                  href="/blogs" 
                  className="text-[rgba(238,234,244,0.55)] hover:text-[#eeeaf4] transition-colors"
                >
                  Blogs
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Exams */}
          <div>
            <h4 className="text-[#f5c14a] font-bold mb-4">Exams</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/quiz" 
                  className="text-[rgba(238,234,244,0.55)] hover:text-[#eeeaf4] transition-colors"
                >
                  All Exams
                </Link>
              </li>
            </ul>
          </div>

          {/* Information */}
          <div>
            <h4 className="text-[#f5c14a] font-bold mb-4">Information</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/terms-of-service" 
                  className="text-[rgba(238,234,244,0.55)] hover:text-[#eeeaf4] transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy-policy" 
                  className="text-[rgba(238,234,244,0.55)] hover:text-[#eeeaf4] transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact-us" 
                  className="text-[rgba(238,234,244,0.55)] hover:text-[#eeeaf4] transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Separator Line */}
        <div className="border-t border-white/10 mt-12 pt-8">
          {/* Copyright */}
          <p className="text-center text-sm text-[rgba(238,234,244,0.55)] mb-2">
            © {currentYear} {SITE_NAME}. All rights reserved.
          </p>
          <p className="text-center text-sm text-[rgba(238,234,244,0.55)]">
            Made with <span className="text-red-500">❤️</span> for quiz enthusiasts
          </p>
        </div>
      </div>
    </footer>
  );
}
