'use client';

import { usePathname } from 'next/navigation';
import { TrialBanner } from '@/components/TrialBanner';

const MARKETING_ROUTES = ['/landing'];
const TRIAL_EXEMPT_ROUTES = ['/subscription', '/login', '/register', '/landing'];

interface AppShellProps {
  children: React.ReactNode;
  isLoggedIn: boolean;
  sidebar: React.ReactNode;
  topbar: React.ReactNode;
  mobileNav: React.ReactNode;
  realtimeNotifier: React.ReactNode;
  trialStartedAt?: string | null;
}

export function AppShell({
  children,
  isLoggedIn,
  sidebar,
  topbar,
  mobileNav,
  realtimeNotifier,
  trialStartedAt,
}: AppShellProps) {
  const pathname = usePathname();
  const isMarketing = MARKETING_ROUTES.some((r) => pathname?.startsWith(r));
  const showTrial = isLoggedIn && trialStartedAt && !TRIAL_EXEMPT_ROUTES.some((r) => pathname?.startsWith(r));

  // Marketing routes: render children bare with no shell
  if (isMarketing) {
    return <>{children}</>;
  }

  // Unauthenticated app routes (login, etc.)
  if (!isLoggedIn) {
    return <main className="flex-1 flex flex-col">{children}</main>;
  }

  // Authenticated app shell with sidebar + topbar + trial banner
  return (
    <>
      {sidebar}
      {mobileNav}
      <div className="hidden md:block fixed top-0 left-48 right-0 z-40 print:hidden">
        {showTrial && <TrialBanner trialStartedAt={trialStartedAt ?? null} />}
        {topbar}
      </div>
      <main className={`flex-1 flex flex-col min-w-0 overflow-x-hidden pt-16 md:pt-14`}>
        {/* Mobile trial banner */}
        {showTrial && (
          <div className="md:hidden">
            <TrialBanner trialStartedAt={trialStartedAt ?? null} />
          </div>
        )}
        {children}
      </main>
      {realtimeNotifier}
    </>
  );
}
