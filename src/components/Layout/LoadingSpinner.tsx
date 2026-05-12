'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Afficher dans une carte (fond, ombre) pour les écrans pleine page */
  variant?: 'inline' | 'card';
}

function SpinnerContent({
  size,
  className = '',
}: {
  size: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-14 h-14',
    lg: 'w-24 h-24',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2.5 h-2.5',
    lg: 'w-4 h-4',
  };

  return (
    <div className={`${sizeClasses[size]} relative flex items-center justify-center ${className}`}>
      {/* Anneaux tournants adaptés au thème dark premium */}
      <div
        className={`absolute inset-0 rounded-full border-2 border-transparent animate-[spin_1s_linear_infinite] ${sizeClasses[size]}`}
        style={{
          borderTopColor: 'rgba(245, 193, 74, 0.95)',
          borderRightColor: 'transparent',
        }}
      />
      <div
        className={`absolute rounded-full border-2 border-transparent animate-[spin_1.4s_linear_infinite_reverse] ${size === 'sm' ? 'inset-[2px]' : size === 'lg' ? 'inset-[4px]' : 'inset-[3px]'}`}
        style={{
          borderBottomColor: 'rgba(179, 136, 255, 0.9)',
          borderLeftColor: 'transparent',
        }}
      />
      {/* Points pulsés au centre */}
      <div className="flex items-center justify-center gap-0.5">
        <span
          className={`${dotSizes[size]} rounded-full animate-pulse-scale`}
          style={{ backgroundColor: '#f5c14a', animationDelay: '0ms' }}
        />
        <span
          className={`${dotSizes[size]} rounded-full animate-pulse-scale`}
          style={{ backgroundColor: '#b388ff', animationDelay: '140ms' }}
        />
        <span
          className={`${dotSizes[size]} rounded-full animate-pulse-scale`}
          style={{ backgroundColor: '#2be4c8', animationDelay: '280ms' }}
        />
      </div>
      <div
        className="pointer-events-none absolute -z-10 rounded-full blur-2xl"
        style={{
          width: size === 'sm' ? '36px' : size === 'md' ? '56px' : '84px',
          height: size === 'sm' ? '36px' : size === 'md' ? '56px' : '84px',
          background:
            'radial-gradient(circle, rgba(245,193,74,0.28) 0%, rgba(179,136,255,0.14) 45%, rgba(43,228,200,0.04) 100%)',
        }}
      />
    </div>
  );
}

export default function LoadingSpinner({
  size = 'md',
  className = '',
  variant = 'inline',
}: LoadingSpinnerProps) {
  if (variant === 'card') {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#080810] px-4 py-12">
        <div className="pointer-events-none absolute -left-20 top-24 h-64 w-64 rounded-full bg-[#f5c14a]/12 blur-3xl" />
        <div className="pointer-events-none absolute right-[-3rem] top-28 h-72 w-72 rounded-full bg-[#b388ff]/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-20 left-1/3 h-64 w-64 rounded-full bg-[#2be4c8]/10 blur-3xl" />
        <div className="relative flex min-h-screen items-center justify-center">
          <div className="rounded-3xl border border-white/10 bg-[#12121f]/90 px-10 py-9 shadow-2xl shadow-black/40 backdrop-blur-xl sm:px-12 sm:py-11">
            <div className="mb-4 text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-[#f5c14a]/90">
              Loading
            </div>
            <SpinnerContent size={size} />
          </div>
        </div>
      </div>
    );
  }

  return <SpinnerContent size={size} className={className} />;
}
