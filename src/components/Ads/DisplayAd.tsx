import AdSense from './AdSense';

interface DisplayAdProps {
  className?: string;
}

export default function DisplayAd({ className = '' }: DisplayAdProps) {
  return (
    <div className={`my-8 ${className}`}>
      <AdSense
        adSlot={process.env.NEXT_PUBLIC_ADSENSE_DISPLAY_SLOT || '1234567890'}
        adFormat="auto"
        fullWidthResponsive={true}
        style={{ minHeight: '250px' }}
      />
    </div>
  );
}

