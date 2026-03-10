"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const COOKIE_KEY = "cookie-consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(COOKIE_KEY);
    if (stored !== "accepted" && stored !== "rejected") {
      setVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(COOKIE_KEY, "accepted");
    }
    setVisible(false);
  };

  const declineCookies = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(COOKIE_KEY, "rejected");
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 sm:pb-6">
      <div className="max-w-4xl w-full bg-gray-900 text-gray-100 rounded-2xl shadow-2xl border border-gray-700 px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm sm:text-base leading-relaxed">
          <p>
            This website uses cookies to improve your experience and analyze traffic. By continuing to browse, you agree to our use of cookies. Read our{" "}
            <Link href="/privacy-policy" className="underline text-indigo-300 hover:text-indigo-200">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center gap-3 sm:ml-4">
          <button
            type="button"
            onClick={acceptCookies}
            className="px-4 py-2 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold shadow-lg transition-colors"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={declineCookies}
            className="px-4 py-2 rounded-full border border-gray-500 text-gray-100 text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}

