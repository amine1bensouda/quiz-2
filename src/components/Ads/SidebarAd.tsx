import AdSense from './AdSense';

interface SidebarAdProps {
  className?: string;
}

export default function SidebarAd({ className = '' }: SidebarAdProps) {
  return (
    <div className={`sticky top-4 ${className}`}>
      <AdSense
        adSlot={process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT || '1234567892'}
        adFormat="vertical"
        fullWidthResponsive={true}
        style={{ minHeight: '600px', width: '100%' }}
      />
    </div>
  );
}

