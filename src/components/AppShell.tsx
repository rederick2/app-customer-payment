'use client';

import { usePathname } from 'next/navigation';

const MARKETING_ROUTES = ['/landing'];

interface AppShellProps {
  children: React.ReactNode;
  isLoggedIn: boolean;
  sidebar: React.ReactNode;
  topbar: React.ReactNode;
  mobileNav: React.ReactNode;
  realtimeNotifier: React.ReactNode;
}

export function AppShell({
  children,
  isLoggedIn,
  sidebar,
  topbar,
  mobileNav,
  realtimeNotifier,
}: AppShellProps) {
  const pathname = usePathname();
  const isMarketing = MARKETING_ROUTES.some((r) => pathname?.startsWith(r));

  // Marketing routes: render children bare with no shell
  if (isMarketing) {
    return <>{children}</>;
  }

  // Unauthenticated app routes (login, etc.)
  if (!isLoggedIn) {
    return <main className="flex-1 flex flex-col">{children}</main>;
  }

  // Authenticated app shell with sidebar + topbar
  return (
    <>
      {sidebar}
      {mobileNav}
      <div className="hidden md:block fixed top-0 left-48 right-0 z-40 print:hidden">
        {topbar}
      </div>
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden pt-16 md:pt-14">
        {children}
      </main>
      {realtimeNotifier}
    </>
  );
}
