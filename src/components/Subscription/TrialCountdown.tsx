'use client';

import { useEffect, useState } from 'react';
import {
  formatTrialEndDate,
  getTrialAccessEndDate,
  getTrialRemainingMs,
  isActiveTrialSubscription,
  isTrialCanceled,
  splitTrialRemaining,
  type TrialDisplaySubscription,
} from '@/lib/trial-display';
import { getTrialBadgeLabel } from '@/lib/plans';

type TrialCountdownVariant = 'hero' | 'inline' | 'banner';

interface TrialCountdownProps {
  trialEndsAt: string | Date;
  canceled?: boolean;
  variant?: TrialCountdownVariant;
  className?: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function CountdownUnit({
  value,
  label,
  variant,
}: {
  value: number;
  label: string;
  variant: TrialCountdownVariant;
}) {
  const isBanner = variant === 'banner';
  const isHero = variant === 'hero';

  return (
    <div
      className={`flex flex-col items-center rounded-xl border text-center ${
        isHero
          ? 'min-w-[4.25rem] border-[#f5c14a]/30 bg-[#f5c14a]/10 px-3 py-2.5 sm:min-w-[4.75rem] sm:px-4'
          : isBanner
            ? 'min-w-[3.25rem] border-white/15 bg-black/30 px-2 py-2 sm:min-w-[3.75rem]'
            : 'min-w-[3rem] border-white/10 bg-white/[0.04] px-2 py-2'
      }`}
    >
      <span
        className={`font-mono font-bold tabular-nums text-[#f5c14a] ${
          isHero ? 'text-2xl sm:text-3xl' : isBanner ? 'text-xl sm:text-2xl' : 'text-lg'
        }`}
      >
        {pad2(value)}
      </span>
      <span
        className={`mt-0.5 uppercase tracking-wider text-[#9d98ab] ${
          isHero ? 'text-[10px]' : 'text-[9px]'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export function TrialCountdown({
  trialEndsAt,
  canceled = false,
  variant = 'inline',
  className = '',
}: TrialCountdownProps) {
  const endMs = new Date(trialEndsAt).getTime();
  const [remainingMs, setRemainingMs] = useState(() => getTrialRemainingMs(trialEndsAt));

  useEffect(() => {
    const tick = () => setRemainingMs(Math.max(0, endMs - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endMs]);

  if (remainingMs <= 0) return null;

  const { days, hours, minutes, seconds } = splitTrialRemaining(remainingMs);
  const endLabel = formatTrialEndDate(trialEndsAt);
  const trialBadge = getTrialBadgeLabel();

  const title = canceled ? 'Trial access ends in' : 'Free trial ends in';
  const subtitle = canceled
    ? `Canceled. No charge. Access until ${endLabel}.`
    : `Cancel before ${endLabel} to avoid being charged.`;

  const units = (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
      {days > 0 && <CountdownUnit value={days} label="Days" variant={variant} />}
      <CountdownUnit value={hours} label="Hours" variant={variant} />
      <CountdownUnit value={minutes} label="Min" variant={variant} />
      <CountdownUnit value={seconds} label="Sec" variant={variant} />
    </div>
  );

  if (variant === 'banner') {
    return (
      <div
        className={`rounded-2xl border border-[#f5c14a]/25 bg-[#111121]/90 p-4 shadow-lg shadow-black/30 backdrop-blur-md sm:p-5 ${className}`}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f5c14a]">
              {trialBadge}
            </p>
            <p className="mt-1 text-base font-semibold text-[#f5f2ff] sm:text-lg">{title}</p>
            <p className="mt-1 text-xs text-[#9d98ab] sm:text-sm">{subtitle}</p>
          </div>
          {units}
        </div>
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div
        className={`mt-5 rounded-2xl border border-[#f5c14a]/20 bg-black/25 p-4 backdrop-blur-sm sm:p-5 ${className}`}
      >
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#f5c14a]">
          {trialBadge}
        </p>
        <p className="mb-3 text-sm font-medium text-[#eeeaf4]">{title}</p>
        {units}
        <p className="dash-muted mt-3 text-xs leading-relaxed">{subtitle}</p>
      </div>
    );
  }

  return (
    <div className={`mt-4 rounded-xl border border-[#f5c14a]/20 bg-[#f5c14a]/5 p-4 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-[#f5c14a]">{title}</p>
      <div className="mt-3">{units}</div>
      <p className="dash-muted mt-3 text-xs leading-relaxed">{subtitle}</p>
    </div>
  );
}

export function TrialCountdownFromSubscription({
  subscription,
  variant = 'inline',
  className,
}: {
  subscription: TrialDisplaySubscription | null | undefined;
  variant?: TrialCountdownVariant;
  className?: string;
}) {
  const accessEnd = getTrialAccessEndDate(subscription);
  if (!isActiveTrialSubscription(subscription) || !accessEnd) {
    return null;
  }

  return (
    <TrialCountdown
      trialEndsAt={accessEnd}
      canceled={isTrialCanceled(subscription)}
      variant={variant}
      className={className}
    />
  );
}
