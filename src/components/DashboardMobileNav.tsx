'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  PlusCircle,
  ListTodo,
  Calendar,
  MessageSquare,
  LogOut,
  Settings,
  GanttChart,
  FileText,
  Briefcase,
  Receipt,
  Image
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { logout } from '@/app/login/actions';
import { ThemeToggle } from '@/components/ThemeToggle';

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
    { href: '/calendar', icon: Calendar, label: 'Calendar' },
    { href: '/gantt', icon: GanttChart, label: 'Gantt' },
    { href: '/gallery', icon: Image, label: 'Gallery' },
    {
      href: '/messages',
      icon: MessageSquare,
      label: 'Messages',
      badge: unreadCount
    },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  const teamLinks = [
    { href: '/team', icon: Calendar, label: 'My Visits', badge: 0 },
    { href: '/team/tasks', icon: ListTodo, label: 'My Tasks', badge: 0 },
  ];

  const links = isTeamMember ? teamLinks : adminLinks;

  // Close menu when route changes
  React.useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border/40 h-16 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <img src="/logo.png" alt="Logo" className="h-8" />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="text-foreground"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background pt-16 flex flex-col animate-in fade-in slide-in-from-top-4 duration-300">
          <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center px-4 py-3 text-base font-medium rounded-xl transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/80 hover:bg-muted/50"
                  )}
                >
                  <Icon className="mr-4 h-5 w-5" />
                  {link.label}
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white leading-none">
                      {link.badge > 9 ? '9+' : link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border/40 mb-4 space-y-2">
            <ThemeToggle />
            <form action={logout}>
              <button
                type="submit"
                className="w-full flex items-center px-4 py-3 text-base font-medium text-foreground/80 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
              >
                <LogOut className="mr-4 h-5 w-5" />
                Log Out
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
