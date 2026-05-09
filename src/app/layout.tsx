import type { Metadata } from 'next';
import { Archivo_Black, DM_Sans, Manrope } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Toaster } from '@/components/ui/sonner';
import RealtimeNotifier from '@/components/RealtimeNotifier';
import DashboardMobileNav from '@/components/DashboardMobileNav';
import SidebarNav from '@/components/SidebarNav';
import { ThemeProvider } from '@/components/theme-provider';
import { TopBar } from '@/components/TopBar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell } from '@/components/AppShell';
import { HousePlus } from 'lucide-react';
import { isTrialExpired } from '@/lib/trial';
import { headers } from 'next/headers';

const archivoBlack = Archivo_Black({
  weight: '400',
  variable: '--font-archivo',
  subsets: ['latin'],
});

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
});

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Quickqi | Quote & Invoicing',
  description: 'Quote & Invoicing for projects.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Quickqi',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: '#303030',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let userProfile: { displayName: string | null, email: string | null, phone: string | null } | null = null;
  let isTeamMember = false;
  let trialStartedAt: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('display_name, email, phone, user_type, trial_started_at, created_at')
      .eq('id', user.id)
      .single();

    userProfile = {
      displayName: profile?.display_name || user.email?.split('@')[0] || null,
      email: profile?.email || user.email || null,
      phone: profile?.phone || null
    };

    isTeamMember = profile?.user_type === 2;
    trialStartedAt = profile?.trial_started_at ?? null;

    // ── Trial Logic ─────────────────────────────────────────────
    // Old users (created before May 4th, 2026) are exempt from trial
    const TRIAL_LAUNCH_DATE = new Date('2026-05-04T00:00:00Z');
    const userCreatedAt = profile?.created_at ? new Date(profile.created_at) : new Date();

    if (!trialStartedAt && userCreatedAt >= TRIAL_LAUNCH_DATE) {
      // New user: Initialize trial on first authenticated access
      const now = new Date().toISOString();
      await supabase
        .from('users')
        .update({ trial_started_at: now })
        .eq('id', user.id);
      trialStartedAt = now;
    }

    // ── Redirect expired trial users to subscription page ──────
    // Only applies if they have a trial started
    if (trialStartedAt) {
      const headersList = await headers();
      const pathname = headersList.get('x-pathname') ?? headersList.get('next-url') ?? '';
      const isExempt = ['/subscription', '/login', '/register', '/landing', '/p/', '/api'].some(
        (p) => pathname.startsWith(p)
      );
      if (!isExempt && isTrialExpired(trialStartedAt)) {
        const { redirect } = await import('next/navigation');
        redirect('/subscription');
      }
    }
  }

  let unreadCount = 0;
  let proformaIds: string[] = [];
  if (user) {
    const { data: proformas } = await supabase.from('proformas').select('id').eq('user_id', user.id);
    proformaIds = proformas?.map(p => p.id) || [];
    if (proformaIds.length > 0) {
      const { count } = await supabase
        .from('proforma_requests')
        .select('id', { count: 'exact', head: true })
        .eq('sender_type', 'client')
        .is('read_at', null)
        .in('proforma_id', proformaIds);
      unreadCount = count || 0;
    }
  }

  const sidebar = user ? (
    <aside className="hidden md:flex flex-col w-48 border-r border-border/40 bg-muted/50 h-screen sticky top-0 px-4 py-8 print:hidden">
      <Link href="/" className="mb-4 flex items-center justify-center gap-3">
        <HousePlus className="h-9 w-9 shrink-0" />
        <span className="font-archivo text-3xl font-bold tracking-tight mt-1">Quickqi</span>
      </Link>
      <nav className="flex-1 space-y-1">
        <SidebarNav isTeamMember={isTeamMember} />
      </nav>
    </aside>
  ) : null;

  const topbar = user ? (
    <TopBar userProfile={userProfile} unreadCount={unreadCount} isTeamMember={isTeamMember} />
  ) : null;

  const mobileNav = user ? (
    <DashboardMobileNav unreadCount={unreadCount} isTeamMember={isTeamMember} />
  ) : null;

  const realtimeNotifier = user ? (
    <RealtimeNotifier proformaIds={proformaIds} watchSenderType="client" />
  ) : null;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${archivoBlack.variable} ${dmSans.variable} ${manrope.variable} font-manrope antialiased min-h-screen bg-background text-foreground flex`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider delay={300}>
            <AppShell
              isLoggedIn={!!user}
              sidebar={sidebar}
              topbar={topbar}
              mobileNav={mobileNav}
              realtimeNotifier={realtimeNotifier}
              trialStartedAt={trialStartedAt}
            >
              {children}
            </AppShell>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
