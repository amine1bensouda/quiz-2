import Link from 'next/link';
import { SITE_NAME } from '@/lib/constants';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-white/10 bg-[#080810] text-[#eeeaf4]">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Site Description */}
          <div>
            <Link href="/" className="mb-4 inline-flex items-center">
              <h3 className="text-xl font-semibold tracking-[1px] text-[#eeeaf4]">
                <span className="text-[#f5c14a]">CRACK</span>
                <span className="mx-1 text-[rgba(238,234,244,0.45)]">×</span>
                <span>THECURVE</span>
              </h3>
            </Link>
            <p className="text-sm leading-relaxed text-[rgba(238,234,244,0.55)]">
              Structured exam preparation with rigorous quizzes and targeted practice to improve your score.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="mb-4 font-bold text-[#f5c14a]">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-[rgba(238,234,244,0.55)] transition-colors hover:text-[#eeeaf4]"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/about-us"
                  className="text-[rgba(238,234,244,0.55)] transition-colors hover:text-[#eeeaf4]"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact-us"
                  className="text-[rgba(238,234,244,0.55)] transition-colors hover:text-[#eeeaf4]"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/blogs"
                  className="text-[rgba(238,234,244,0.55)] transition-colors hover:text-[#eeeaf4]"
                >
                  Blogs
                </Link>
              </li>
            </ul>
          </div>

          {/* Exams */}
          <div>
            <h4 className="mb-4 font-bold text-[#f5c14a]">Exams</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/quiz"
                  className="text-[rgba(238,234,244,0.55)] transition-colors hover:text-[#eeeaf4]"
                >
                  All Exams
                </Link>
              </li>
            </ul>
          </div>

          {/* Information */}
          <div>
            <h4 className="mb-4 font-bold text-[#f5c14a]">Information</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/terms-of-service"
                  className="text-[rgba(238,234,244,0.55)] transition-colors hover:text-[#eeeaf4]"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-[rgba(238,234,244,0.55)] transition-colors hover:text-[#eeeaf4]"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/contact-us"
                  className="text-[rgba(238,234,244,0.55)] transition-colors hover:text-[#eeeaf4]"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Separator Line */}
        <div className="mt-12 border-t border-white/10 pt-8">
          {/* Copyright */}
          <p className="mb-2 text-center text-sm text-[rgba(238,234,244,0.55)]">
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
