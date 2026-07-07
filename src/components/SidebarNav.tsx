'use client';

import { LoadingLink as Link } from '@/components/ui/loading-link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, FileText, Briefcase, Receipt,
  ListTodo, Calendar, GanttChart, MapPin, Camera, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface SidebarNavProps {
  isTeamMember?: boolean;
}

const SCHEDULE_PATHS = ['/calendar', '/gantt', '/jobs/team-map'];

export default function SidebarNav({ isTeamMember }: SidebarNavProps) {
  const pathname = usePathname();
  const isScheduleActive = SCHEDULE_PATHS.some(p => pathname.startsWith(p));

  const linkClass = (href: string) =>
    cn(
      'flex items-center px-3 py-2.5 text-sm font-bold rounded-xl transition-colors',
      pathname === href || (href !== '/' && pathname.startsWith(href))
        ? 'bg-primary/10 text-primary'
        : 'text-foreground/80 hover:text-primary hover:bg-muted/50'
    );

  if (isTeamMember) {
    return (
      <>
        <Link href="/team/tasks" className={linkClass('/team/tasks')}>
          <MapPin className="mr-3 h-4 w-4" />
          My Schedule
        </Link>
        <Link href="/team/timesheets" className={linkClass('/team/timesheets')}>
          <Clock className="mr-3 h-4 w-4" />
          Timesheets
        </Link>
      </>
    );
  }

  return (
    <>
      <Link href="/" className={linkClass('/')}>
        <LayoutDashboard className="mr-3 h-4 w-4" />
        Dashboard
      </Link>
      <Link href="/clients" className={linkClass('/clients')}>
        <Users className="mr-3 h-4 w-4" />
        Clients
      </Link>
      <Link href="/quotes" className={linkClass('/quotes')}>
        <FileText className="mr-3 h-4 w-4" />
        Quotes
      </Link>
      <Link href="/jobs" className={linkClass('/jobs')}>
        <Briefcase className="mr-3 h-4 w-4" />
        Jobs
      </Link>
      <Link href="/invoices" className={linkClass('/invoices')}>
        <Receipt className="mr-3 h-4 w-4" />
        Invoices
      </Link>
      <Link href="/requests" className={linkClass('/requests')}>
        <ListTodo className="mr-3 h-4 w-4" />
        Requests
      </Link>

      {/* ── Schedule submenu via Accordion ── */}
      <Accordion
        multiple={false}
        defaultValue={isScheduleActive ? ['schedule'] : []}
        className="border-none"
      >
        <AccordionItem value="schedule" className="border-none">
          <AccordionTrigger
            className={cn(
              'flex items-center px-3 py-2.5 text-sm font-bold rounded-xl transition-colors hover:no-underline',
              isScheduleActive
                ? 'bg-primary/10 text-primary'
                : 'text-foreground/80 hover:text-primary hover:bg-muted/50'
            )}
          >
            <Calendar className="mr-3 h-4 w-4 shrink-0" />
            Schedule
          </AccordionTrigger>
          <AccordionContent className="pb-0 pt-1">
            <div className="ml-4 space-y-0.5 border-l-2 border-border/30 pl-3">
              <Link
                href="/calendar"
                className={cn(
                  'flex items-center px-2 py-2 text-xs font-bold rounded-xl transition-colors',
                  pathname.startsWith('/calendar')
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground/70 hover:text-primary hover:bg-muted/50'
                )}
              >
                <Calendar className="mr-2 h-3.5 w-3.5" />
                Calendar
              </Link>
              <Link
                href="/gantt"
                className={cn(
                  'flex items-center px-2 py-2 text-xs font-bold rounded-xl transition-colors',
                  pathname.startsWith('/gantt')
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground/70 hover:text-primary hover:bg-muted/50'
                )}
              >
                <GanttChart className="mr-2 h-3.5 w-3.5" />
                Gantt
              </Link>
              <Link
                href="/jobs/team-map"
                className={cn(
                  'flex items-center px-2 py-2 text-xs font-bold rounded-xl transition-colors',
                  pathname.startsWith('/jobs/team-map')
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground/70 hover:text-primary hover:bg-muted/50'
                )}
              >
                <MapPin className="mr-2 h-3.5 w-3.5" />
                Map
              </Link>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Link href="/gallery" className={linkClass('/gallery')}>
        <Camera className="mr-3 h-4 w-4" />
        Gallery
      </Link>
      <Link href="/timesheets" className={linkClass('/timesheets')}>
        <Clock className="mr-3 h-4 w-4" />
        Timesheets
      </Link>
    </>
  );
}
