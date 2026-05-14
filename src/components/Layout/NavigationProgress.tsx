'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Fine barre en haut de l’écran pendant les navigations (effet « en cours »).
 * Les timers doivent tous être annulés au changement de route / démontage.
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setProgress(10);

    let interval1: ReturnType<typeof setInterval> | null = null;
    let interval2: ReturnType<typeof setInterval> | null = null;
    let slowStartTimer: ReturnType<typeof setTimeout> | null = null;
    let completeTimer: ReturnType<typeof setTimeout> | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    interval1 = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 70) {
          if (interval1) {
            clearInterval(interval1);
            interval1 = null;
          }
          return 70;
        }
        return prev + 15;
      });
    }, 50);

    slowStartTimer = setTimeout(() => {
      interval2 = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            if (interval2) {
              clearInterval(interval2);
              interval2 = null;
            }
            return 90;
          }
          return prev + 2;
        });
      }, 100);

      completeTimer = setTimeout(() => {
        setProgress(100);
        hideTimer = setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
        }, 300);
      }, 1000);
    }, 200);

    return () => {
      if (interval1) clearInterval(interval1);
      if (interval2) clearInterval(interval2);
      if (slowStartTimer) clearTimeout(slowStartTimer);
      if (completeTimer) clearTimeout(completeTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]');
      const href = link?.getAttribute('href');
      if (href?.startsWith('/')) {
        setIsLoading(true);
        setProgress(10);
      }
    };

    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9998] h-1 bg-gray-100 dark:bg-white/10">
      <div
        className="h-full bg-gray-900 dark:bg-indigo-400 transition-all duration-300 ease-out shadow-lg"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
