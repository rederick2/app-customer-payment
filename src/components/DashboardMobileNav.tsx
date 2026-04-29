'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  LayoutDashboard,
  Users,
  ListTodo,
  Calendar,
  LogOut,
  Settings,
  GanttChart,
  FileText,
  Briefcase,
  Receipt,
  Image,
  MapPin,
  Clock,
  HousePlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { logout } from '@/app/login/actions';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

interface DashboardMobileNavProps {
  unreadCount: number;
  isTeamMember?: boolean;
}

export default function DashboardMobileNav({ unreadCount, isTeamMember }: DashboardMobileNavProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const pathname = usePathname();

  const adminLinks = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/clients', icon: Users, label: 'Clients' },
    { href: '/quotes', icon: FileText, label: 'Quotes' },
    { href: '/jobs', icon: Briefcase, label: 'Jobs' },
    { href: '/invoices', icon: Receipt, label: 'Invoices' },
    { href: '/requests', icon: ListTodo, label: 'Requests' },
    { href: '/gallery', icon: Image, label: 'Gallery' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  const teamLinks = [
    { href: '/team/tasks', icon: MapPin, label: 'My Schedule', badge: 0 },
    { href: '/team/timesheets', icon: Clock, label: 'Timesheets', badge: 0 },
  ];

  const links = isTeamMember ? teamLinks : adminLinks;

  const scheduleLinks = [
    { href: '/calendar', icon: Calendar, label: 'Calendar' },
    { href: '/gantt', icon: GanttChart, label: 'Gantt' },
    { href: '/jobs/team-map', icon: MapPin, label: 'Map' },
  ];

  // Close menu when route changes
  React.useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border/40 h-16 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <HousePlus className="h-8 w-8 shrink-0 text-foreground" />
          <span className="font-archivo text-2xl font-bold tracking-tight mt-1">Quickqi</span>
        </Link>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger render={
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground"
            />
          }>
            <Menu className="h-6 w-6" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 flex flex-col">
            <SheetHeader className="px-4 py-5 border-b border-border/40">
              <SheetTitle>
                <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-3">
                  <HousePlus className="h-8 w-8 shrink-0 text-foreground" />
                  <span className="font-archivo text-2xl font-bold tracking-tight mt-1">Quickqi</span>
                </Link>
              </SheetTitle>
            </SheetHeader>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center px-3 py-2.5 text-sm font-bold rounded-xl transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/80 hover:bg-muted/50 hover:text-primary"
                    )}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}

              {/* Schedule submenu for admin */}
              {!isTeamMember && (
                <div className="space-y-1 pt-2">
                  <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Schedule</p>
                  {scheduleLinks.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center px-3 py-2.5 text-sm font-bold rounded-xl transition-colors",
                        pathname.startsWith(link.href)
                          ? "bg-primary/10 text-primary"
                          : "text-foreground/80 hover:bg-muted/50 hover:text-primary"
                      )}
                    >
                      <link.icon className="mr-3 h-4 w-4" />
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </nav>

            <div className="p-3 border-t border-border/40 space-y-1">
              <ThemeToggle />
              <Separator className="my-2" />
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full flex items-center px-3 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Log Out
                </button>
              </form>
            </div>
          </SheetContent>
        </Sheet>
      </header>
    </>
  );
}
