import AdSense from './AdSense';

interface InArticleAdProps {
  className?: string;
}

export default function InArticleAd({ className = '' }: InArticleAdProps) {
  return (
    <div className={`my-8 ${className}`}>
      <AdSense
        adSlot={process.env.NEXT_PUBLIC_ADSENSE_INARTICLE_SLOT || '1234567891'}
        adFormat="fluid"
        fullWidthResponsive={true}
        style={{ display: 'block', textAlign: 'center', minHeight: '280px' }}
      />
    </div>
  );
}

