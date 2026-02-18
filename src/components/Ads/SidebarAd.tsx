'use client';

import AdSense from './AdSense';

interface SidebarAdProps {
  className?: string;
}

/** Bloc pub pour les colonnes latérales (format vertical / rectangle). */
export default function SidebarAd({ className = '' }: SidebarAdProps) {
  return (
    <aside
      className={`flex flex-col items-center justify-start w-full ${className}`}
      aria-label="Publicité"
    >
      <div className="sticky top-24 w-full max-w-[200px] min-h-[250px] rounded-xl overflow-hidden bg-gray-100/80 border border-gray-200/60">
        <AdSense
          adSlot={process.env.NEXT_PUBLIC_ADSENSE_DISPLAY_SLOT || process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT || '1234567890'}
          adFormat="rectangle"
          fullWidthResponsive={false}
          style={{ minHeight: '250px', width: '200px' }}
        />
      </div>
    </aside>
  );
}
