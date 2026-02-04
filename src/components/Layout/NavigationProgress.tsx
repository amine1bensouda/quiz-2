'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Réinitialiser la progression lors du changement de route
    setIsLoading(true);
    setProgress(10);

    // Simuler la progression rapide au début
    const interval1 = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 70) {
          clearInterval(interval1);
          return 70;
        }
        return prev + 15;
      });
    }, 50);

    // Progression plus lente ensuite
    const slowInterval = setTimeout(() => {
      const interval2 = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval2);
            return 90;
          }
          return prev + 2;
        });
      }, 100);

      // Compléter à 100% après un délai
      const timer = setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
        }, 300);
      }, 1000);

      return () => {
        clearInterval(interval2);
        clearTimeout(timer);
      };
    }, 200);

    return () => {
      clearInterval(interval1);
      clearTimeout(slowInterval);
    };
  }, [pathname, searchParams]);

  // Écouter les clics sur les liens Next.js
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]');
      
      if (link && link.getAttribute('href')?.startsWith('/')) {
        setIsLoading(true);
        setProgress(10);
      }
    };

    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, []);

  if (!isLoading && !isPending) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9998] h-1 bg-gray-100">
      <div
        className="h-full bg-gray-900 transition-all duration-300 ease-out shadow-lg"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

