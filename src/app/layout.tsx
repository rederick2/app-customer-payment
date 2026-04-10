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
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { TopBar } from '@/components/TopBar';

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
    const { data: profile } = await supabase.from('users').select('display_name, email, phone').eq('id', user.id).single();
    userProfile = {
      displayName: profile?.display_name || user.email?.split('@')[0] || null,
      email: profile?.email || user.email || null,
      phone: profile?.phone || null
    };

    const { data: teamMemberData } = await supabase
      .from('team_members')
      .select('id, name')
      .eq('auth_user_id', user.id)
      .single();

    if (teamMemberData) {
      isTeamMember = true;
      if (userProfile) {
        userProfile.displayName = teamMemberData.name;
      }
    }
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
          {user ? (
            <>
              <aside className="hidden md:flex flex-col w-48 border-r border-border/40 bg-muted/50 h-screen sticky top-0 px-4 py-8 print:hidden">
                <Link href="/" className="mb-8 px-2 flex items-center space-x-2">
                  <img src="/logo.png" alt="Logo" />
                </Link>

                <nav className="flex-1 space-y-2">
                  {isTeamMember ? (
                    <>
                      <Link href="/team" className="flex items-center px-3 py-2.5 text-sm font-bold text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors">
                        <Calendar className="mr-3 h-4 w-4" />
                        My Visits
                      </Link>
                      <Link href="/team/tasks" className="flex items-center px-3 py-2.5 text-sm font-bold text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors">
                        <ListTodo className="mr-3 h-4 w-4" />
                        My Tasks
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/" className="flex items-center px-3 py-2.5 text-sm font-bold text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors">
                        <LayoutDashboard className="mr-3 h-4 w-4" />
                        Dashboard
                      </Link>
                      <Link href="/clients" className="flex items-center px-3 py-2.5 text-sm font-bold text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors">
                        <Users className="mr-3 h-4 w-4" />
                        Clients
                      </Link>
                      <Link href="/quotes" className="flex items-center px-3 py-2.5 text-sm font-bold text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors">
                        <FileText className="mr-3 h-4 w-4" />
                        Quotes
                      </Link>
                      <Link href="/jobs" className="flex items-center px-3 py-2.5 text-sm font-bold text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors">
                        <Briefcase className="mr-3 h-4 w-4" />
                        Jobs
                      </Link>
                      <Link href="/invoices" className="flex items-center px-3 py-2.5 text-sm font-bold text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors">
                        <Receipt className="mr-3 h-4 w-4" />
                        Invoices
                      </Link>
                      {/*<Link href="/proforma/new" className="flex items-center px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors">
                  <PlusCircle className="mr-3 h-4 w-4" />
                  New Quote
                </Link>*/}
                      <Link href="/requests" className="flex items-center px-3 py-2.5 text-sm font-bold text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors">
                        <ListTodo className="mr-3 h-4 w-4" />
                        Requests
                      </Link>
                      <Link href="/calendar" className="flex items-center px-3 py-2.5 text-sm font-bold text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors">
                        <Calendar className="mr-3 h-4 w-4" />
                        Calendar
                      </Link>
                      <Link href="/gantt" className="flex items-center px-3 py-2.5 text-sm font-bold text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors">
                        <GanttChart className="mr-3 h-4 w-4" />
                        Gantt
                      </Link>
                      {/*<Link href="/messages" className="flex items-center px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors">
                    <MessageSquare className="mr-3 h-4 w-4" />
                    Messages
                    {unreadCount > 0 && (
                      <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>*/}
                      <Link href="/gallery" className="flex items-center px-3 py-2.5 text-sm font-bold text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors">
                        <Camera className="mr-3 h-4 w-4" />
                        Gallery
                      </Link>
                      <Link href="/timesheets" className="flex items-center px-3 py-2.5 text-sm font-bold text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors">
                        <Clock className="mr-3 h-4 w-4" />
                        Timesheets
                      </Link>
                      {/*<Link href="/settings" className="flex items-center px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors">
                  <Settings className="mr-3 h-4 w-4" />
                  Settings
                </Link>*/}
                    </>
                  )}
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
        </ThemeProvider>
      </body>
    </html>
  );
}
