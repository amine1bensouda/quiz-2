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
      {/* Anneau tournant avec dégradé */}
      <div
        className={`absolute inset-0 rounded-full border-2 border-transparent border-t-gray-900 border-r-gray-900/30 animate-[spin_0.8s_linear_infinite] ${sizeClasses[size]}`}
        style={{ borderRightColor: 'transparent' }}
      />
      <div
        className={`absolute rounded-full border-2 border-transparent border-b-indigo-500 border-l-indigo-500/30 animate-[spin_1.2s_linear_infinite_reverse] ${size === 'sm' ? 'inset-[2px]' : size === 'lg' ? 'inset-[4px]' : 'inset-[3px]'}`}
        style={{ borderLeftColor: 'transparent' }}
      />
      {/* Points pulsés au centre */}
      <div className="flex items-center justify-center gap-0.5">
        <span
          className={`${dotSizes[size]} bg-gray-900 rounded-full animate-pulse-scale`}
          style={{ animationDelay: '0ms' }}
        />
        <span
          className={`${dotSizes[size]} bg-indigo-500 rounded-full animate-pulse-scale`}
          style={{ animationDelay: '150ms' }}
        />
        <span
          className={`${dotSizes[size]} bg-gray-900 rounded-full animate-pulse-scale`}
          style={{ animationDelay: '300ms' }}
        />
      </div>
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
      <div
        className="min-h-screen flex items-center justify-center py-12 px-4"
        style={{
          background: `
            linear-gradient(135deg, rgb(248 250 252) 0%, rgb(241 245 249) 50%, rgb(238 242 255) 100%),
            radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.06) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.06) 0%, transparent 50%)
          `,
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, #64748b 1px, transparent 0),
              radial-gradient(circle at 1px 1px, #64748b 1px, transparent 0)
            `,
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative flex flex-col items-center gap-8">
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl shadow-gray-200/80 border border-white/60 p-10 sm:p-12 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
            <SpinnerContent size={size} />
          </div>
        </div>
      </div>
    );
  }

  return <SpinnerContent size={size} className={className} />;
}
