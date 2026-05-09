'use client';

import * as React from 'react';
import Link from 'next/link';
import { X, Clock, Zap, ArrowRight } from 'lucide-react';
import { getTrialMsRemaining, TRIAL_DURATION_DAYS } from '@/lib/trial';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface TrialBannerProps {
  trialStartedAt: string | null;
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

export function TrialBanner({ trialStartedAt }: TrialBannerProps) {
  const [dismissed, setDismissed] = React.useState(false);
  const [msRemaining, setMsRemaining] = React.useState(() =>
    getTrialMsRemaining(trialStartedAt)
  );

  // Live countdown — update every second
  React.useEffect(() => {
    if (!trialStartedAt) return;
    const id = setInterval(() => {
      const ms = getTrialMsRemaining(trialStartedAt);
      setMsRemaining(ms);
      if (ms === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [trialStartedAt]);

  if (!trialStartedAt || dismissed || msRemaining === 0) return null;

  const { days, hours, minutes, seconds } = formatCountdown(msRemaining);
  const totalMs = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;
  const progressPct = Math.max(0, Math.min(100, ((totalMs - msRemaining) / totalMs) * 100));

  // Color scheme based on urgency
  const isUrgent = days < 3;
  const isWarning = days >= 3 && days < 7;
  // isOk = days >= 7

  const bannerClass = isUrgent
    ? 'bg-gradient-to-r from-red-950/80 via-red-900/70 to-red-950/80 border-red-500/30'
    : isWarning
    ? 'bg-gradient-to-r from-amber-950/80 via-amber-900/70 to-amber-950/80 border-amber-500/30'
    : 'bg-gradient-to-r from-emerald-950/80 via-teal-900/70 to-emerald-950/80 border-emerald-500/30';

  const accentClass = isUrgent
    ? 'text-red-400'
    : isWarning
    ? 'text-amber-400'
    : 'text-emerald-400';

  const progressClass = isUrgent
    ? 'bg-red-500'
    : isWarning
    ? 'bg-amber-400'
    : 'bg-emerald-400';

  const glowClass = isUrgent
    ? 'shadow-[0_0_20px_rgba(239,68,68,0.15)]'
    : isWarning
    ? 'shadow-[0_0_20px_rgba(245,158,11,0.15)]'
    : 'shadow-[0_0_20px_rgba(16,185,129,0.10)]';

  const Pad = ({ n }: { n: number }) => (
    <span className="font-archivo text-lg font-black tabular-nums">
      {String(n).padStart(2, '0')}
    </span>
  );

  return (
    <div
      className={`relative w-full px-4 py-2.5 border-b backdrop-blur-sm print:hidden transition-all duration-500 ${bannerClass} ${glowClass}`}
    >
      {/* Progress bar — thin strip at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
        <div
          className={`h-full transition-all duration-1000 ${progressClass}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Left: icon + text */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`shrink-0 ${accentClass}`}>
            <Clock className="h-4 w-4" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
            <p className="text-sm font-semibold text-white whitespace-nowrap">
              {isUrgent ? '⚡ Trial expiring soon!' : isWarning ? '⏳ Trial in progress' : '🎉 Free trial active'}
            </p>

            {/* Countdown chips */}
            <div className="flex items-center gap-1 text-white/70">
              {days > 0 && (
                <>
                  <Pad n={days} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 mr-1">d</span>
                </>
              )}
              <Pad n={hours} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 mx-0.5">h</span>
              <Pad n={minutes} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 mx-0.5">m</span>
              <Pad n={seconds} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 ml-0.5">s</span>
              <span className="text-xs text-white/50 ml-1 hidden sm:inline">remaining</span>
            </div>
          </div>
        </div>

        {/* Right: CTA + dismiss */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/subscription">
            <Button
              size="sm"
              className={`h-7 px-3 text-xs font-bold rounded-lg gap-1.5 transition-all hover:-translate-y-0.5 ${
                isUrgent
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
                  : isWarning
                  ? 'bg-amber-400 hover:bg-amber-500 text-zinc-900 shadow-lg shadow-amber-400/30'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
              }`}
            >
              <Zap className="h-3 w-3" />
              <span className="hidden sm:inline">Upgrade</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>

          <button
            onClick={() => setDismissed(true)}
            aria-label="Close banner"
            className="h-7 w-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

