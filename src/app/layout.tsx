import type { Metadata } from 'next';
import { Archivo_Black, DM_Sans, Manrope } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/login/actions';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { LayoutDashboard, Users, PlusCircle, ListTodo, LogOut, MessageSquare, Calendar, Settings, GanttChart, FileText, Briefcase, Receipt, Camera, Clock } from 'lucide-react';
import RealtimeNotifier from '@/components/RealtimeNotifier';
import DashboardMobileNav from '@/components/DashboardMobileNav';
import SidebarNav from '@/components/SidebarNav';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { TopBar } from '@/components/TopBar';
import { TooltipProvider } from '@/components/ui/tooltip';

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
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('display_name, email, phone, user_type')
      .eq('id', user.id)
      .single();

    userProfile = {
      displayName: profile?.display_name || user.email?.split('@')[0] || null,
      email: profile?.email || user.email || null,
      phone: profile?.phone || null
    };

    // user_type: 0 = admin, 1 = regular user, 2 = team member
    isTeamMember = profile?.user_type === 2;
  }

  // Count unread messages from clients across all proformas
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
  return (
    <html lang="en">
      <body
        className={`${archivoBlack.variable} ${dmSans.variable} ${manrope.variable} font-manrope antialiased min-h-screen bg-background text-foreground flex`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider delay={300}>
          {user ? (
            <>
              <aside className="hidden md:flex flex-col w-48 border-r border-border/40 bg-muted/50 h-screen sticky top-0 px-4 py-8 print:hidden">
                <Link href="/" className="mb-8 px-2 flex items-center space-x-2">
                  <img src="/logo.png" alt="Logo" />
                </Link>

                <nav className="flex-1 space-y-1">
                  <SidebarNav isTeamMember={isTeamMember} />
                </nav>

                {/*<div className="pt-4 border-t border-border/40 space-y-2">
                  <ThemeToggle />
                  <form action={logout}>
                    <button type="submit" className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                      <LogOut className="mr-3 h-4 w-4" />
                      Log Out
                    </button>
                  </form>
                </div>*/}
              </aside>
              <DashboardMobileNav unreadCount={unreadCount} isTeamMember={isTeamMember} />
              {/* Fixed top bar — sits above main, outside scroll container */}
              <div className="hidden md:block fixed top-0 left-48 right-0 z-40 print:hidden">
                <TopBar userProfile={userProfile} unreadCount={unreadCount} isTeamMember={isTeamMember} />
              </div>
              <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden pt-16 md:pt-14">
                {children}
              </main>
              {/* Invisible realtime listener — keeps the badge count live */}
              <RealtimeNotifier proformaIds={proformaIds} watchSenderType="client" />
            </>
          ) : (
            <main className="flex-1 flex flex-col">
              {children}
            </main>
          )}
          <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
