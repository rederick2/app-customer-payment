import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/login/actions';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { LayoutDashboard, Users, PlusCircle, ListTodo, LogOut, MessageSquare, Calendar, Settings, GanttChart, FileText, Briefcase, Receipt } from 'lucide-react';
import RealtimeNotifier from '@/components/RealtimeNotifier';
import DashboardMobileNav from '@/components/DashboardMobileNav';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

const playfair = Playfair_Display({
  variable: '--font-serif',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Estudio de Diseño | Generador de Proformas',
  description: 'Generador de cotizaciones premium para proyectos de diseño interior.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
    <html lang="es">
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased min-h-screen bg-background text-foreground flex`}
      >
        {user ? (
          <>
            <aside className="hidden md:flex flex-col w-64 border-r border-border/40 bg-muted/20 h-screen sticky top-0 px-4 py-8 print:hidden">
              <Link href="/" className="mb-8 px-2 flex items-center space-x-2">
                <img src="/logo.png" alt="Logo" />
              </Link>

              <nav className="flex-1 space-y-2">
                <Link href="/" className="flex items-center px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors">
                  <LayoutDashboard className="mr-3 h-4 w-4" />
                  Dashboard
                </Link>
                <Link href="/clients" className="flex items-center px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors">
                  <Users className="mr-3 h-4 w-4" />
                  Clients
                </Link>
                <Link href="/quotes" className="flex items-center px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors">
                  <FileText className="mr-3 h-4 w-4" />
                  Quotes
                </Link>
                <Link href="/jobs" className="flex items-center px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors">
                  <Briefcase className="mr-3 h-4 w-4" />
                  Jobs
                </Link>
                <Link href="/invoices" className="flex items-center px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors">
                  <Receipt className="mr-3 h-4 w-4" />
                  Invoices
                </Link>
                <Link href="/proforma/new" className="flex items-center px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors">
                  <PlusCircle className="mr-3 h-4 w-4" />
                  New Quote
                </Link>
                <Link href="/requests" className="flex items-center px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors">
                  <ListTodo className="mr-3 h-4 w-4" />
                  Requests
                </Link>
                <Link href="/calendar" className="flex items-center px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors">
                  <Calendar className="mr-3 h-4 w-4" />
                  Calendar
                </Link>
                <Link href="/gantt" className="flex items-center px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors">
                  <GanttChart className="mr-3 h-4 w-4" />
                  Gantt
                </Link>
                <Link href="/messages" className="flex items-center px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors">
                  <MessageSquare className="mr-3 h-4 w-4" />
                  Messages
                  {unreadCount > 0 && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link href="/settings" className="flex items-center px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-md transition-colors">
                  <Settings className="mr-3 h-4 w-4" />
                  Settings
                </Link>
              </nav>

              <div className="pt-4 border-t border-border/40">
                <form action={logout}>
                  <button type="submit" className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                    <LogOut className="mr-3 h-4 w-4" />
                    Log Out
                  </button>
                </form>
              </div>
            </aside>
            <DashboardMobileNav unreadCount={unreadCount} />
            <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden pt-16 md:pt-0">
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
      </body>
    </html>
  );
}
