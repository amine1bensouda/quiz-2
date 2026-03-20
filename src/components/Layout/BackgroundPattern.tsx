'use client';

interface BackgroundPatternProps {
  variant?: 'dots' | 'grid' | 'waves' | 'circular' | 'luxury';
  opacity?: number;
  className?: string;
  color?: string;
}

export default function BackgroundPattern({ 
  variant = 'dots', 
  opacity = 0.1,
  className = '',
  color = 'currentColor'
}: BackgroundPatternProps) {
  const patterns = {
    dots: (
      <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
        <defs>
          <pattern id="dots-luxury" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="2" fill={color} opacity={opacity} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots-luxury)" />
      </svg>
    ),
    grid: (
      <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
        <defs>
          <pattern id="grid-luxury" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke={color} strokeWidth="1.5" opacity={opacity} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-luxury)" />
      </svg>
    ),
    waves: (
      <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
        <defs>
          <pattern id="waves-luxury" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
            <path d="M0,60 Q30,30 60,60 T120,60" fill="none" stroke={color} strokeWidth="2" opacity={opacity} />
            <path d="M0,90 Q30,60 60,90 T120,90" fill="none" stroke={color} strokeWidth="2" opacity={opacity} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#waves-luxury)" />
      </svg>
    ),
    circular: (
      <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
        <defs>
          <pattern id="circular-luxury" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="1.5" opacity={opacity} />
            <circle cx="50" cy="50" r="25" fill="none" stroke={color} strokeWidth="1" opacity={opacity * 0.7} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circular-luxury)" />
      </svg>
    ),
    luxury: (
      <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
        <defs>
          <pattern id="luxury-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1.5" fill={color} opacity={opacity} />
            <circle cx="50" cy="50" r="2" fill={color} opacity={opacity * 0.8} />
            <circle cx="90" cy="90" r="1.5" fill={color} opacity={opacity} />
            <path d="M0,50 Q25,25 50,50 T100,50" fill="none" stroke={color} strokeWidth="1" opacity={opacity * 0.5} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#luxury-pattern)" />
      </svg>
    ),
  };

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      {patterns[variant]}
    </div>
  );
}




