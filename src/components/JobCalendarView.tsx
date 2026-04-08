'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Search,
  Plus,
  Filter,
  MoreVertical,
  Maximize2,
  CheckCircle2,
  MapPin,
  ExternalLink,
  Edit2,
  Loader2,
  Check,
  ChevronsUpDown,
  FileText,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { deleteRequest } from '@/app/requests/components/actions'
import { deleteJobVisit, updateEventDate, updateJobVisit, updateJobTask, updateServiceRequest } from '@/app/calendar/actions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'

import {
  format,
  addDays,
  subDays,
  startOfWeek,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isSameDay,
  parseISO,
  startOfDay,
  eachDayOfInterval,
  endOfWeek,
  getHours,
  getMinutes,
  isToday,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  getDay,
  endOfDay
} from 'date-fns'
import { enUS } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

const getGoogleCalendarUrl = (title: string, description: string, start: string, end: string, address: string) => {
  const formatGoogleDate = (d: string) => format(parseISO(d), "yyyyMMdd'T'HHmmss");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatGoogleDate(start)}/${formatGoogleDate(end)}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(address)}`;
};

const getAppleCalendarData = (title: string, description: string, start: string, end: string, address: string) => {
  const formatICSDate = (d: string) => format(parseISO(d), "yyyyMMdd'T'HHmmss");
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${formatICSDate(start)}`,
    `DTEND:${formatICSDate(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${address}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\n');
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
};

const getRequestDisplayTime = (scheduleDate: string, preference?: string) => {
  const date = parseISO(scheduleDate);
  if (getHours(date) === 0 && getMinutes(date) === 0) {
    if (preference === 'morning') return 'Morning';
    if (preference === 'afternoon') return 'Afternoon';
    if (preference === 'anytime') return 'Anytime';
  }
  return format(date, 'p');
};

const getRequestVirtualDates = (scheduleDate: string, preference?: string) => {
  const [year, month, day] = scheduleDate.split('-').map(Number);
  const start = new Date(year, month - 1, day);
  let virtualStart = start;

  if (preference === 'morning') virtualStart = new Date(year, month - 1, day, 9, 0, 0);
  else if (preference === 'afternoon') virtualStart = new Date(year, month - 1, day, 14, 0, 0);
  else if (preference === 'anytime') virtualStart = new Date(year, month - 1, day, 10, 0, 0);
  else virtualStart = new Date(year, month - 1, day, 0, 0, 0);

  const virtualEnd = new Date(virtualStart.getTime() + 60 * 60 * 4000); // 1 hour duration
  return {
    start: format(virtualStart, "yyyy-MM-dd'T'HH:mm:ss"),
    end: format(virtualEnd, "yyyy-MM-dd'T'HH:mm:ss")
  };
};

const getFullAddress = (client: any) => {
  if (!client) return '';
  const parts = [client.street_1, client.city, client.province].filter(Boolean);
  return parts.join(', ');
};

const getClientData = (item: any) => {
  const clients = item?.clients || item?.proformas?.clients;
  if (Array.isArray(clients)) return clients[0];
  return clients;
};

interface Job {
  id: string
  project_name: string
  number: string
  job_start_at: string
  job_end_at: string
  clients: {
    name: string
    company_name?: string,
    street_1?: string,
    city?: string,
    province?: string
  }
}

interface Task {
  id: string
  proforma_id: string
  title: string
  description: string
  due_date: string
  end_date?: string
  status: 'pending' | 'completed'
  job_id: string
  assigned_to?: string
  team_members?: {
    name: string
  },
  proformas?: {
    clients?: {
      street_1?: string,
      city?: string,
      province?: string
    }
  }
}

interface ServiceRequest {
  id: string
  proforma_id: string
  details: string
  schedule_date: string
  status: string
  time_preference?: string
  proformas?: {
    project_name: string
    clients?: {
      name: string
      company_name?: string
      street_1?: string
      city?: string
      province?: string
    } | { name: string, company_name?: string, street_1?: string, city?: string, province?: string }[]
  }
}

interface JobVisit {
  id: string
  proforma_id: string
  visit_date: string
  assigned_to?: string
  assigned_name?: string
  status: string
  notes?: string
  team_members?: {
    name: string
  }
  proformas?: {
    id: string
    number: string
    project_name: string
    clients?: {
      name: string
      company_name?: string
      street_1?: string
      city?: string
      province?: string
    } | { name: string, company_name?: string, street_1?: string, city?: string, province?: string }[]
  }
}

interface CalendarViewProps {
  jobs: Job[]
  teamMembers: any[]
  tasks: Task[]
  requests: ServiceRequest[]
  visits: JobVisit[]
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function JobCalendarView({ jobs: initialJobs, teamMembers, tasks: initialTasks, requests: initialRequests, visits: initialVisits }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [view, setView] = React.useState<'month' | 'week' | 'day'>('week')
  const [isAddingVisit, setIsAddingVisit] = React.useState(false)
  
  const [jobs, setJobs] = React.useState(initialJobs)
  const [tasks, setTasks] = React.useState(initialTasks)
  const [requests, setRequests] = React.useState(initialRequests)
  const [visits, setVisits] = React.useState(initialVisits)

  React.useEffect(() => setJobs(initialJobs), [initialJobs])
  React.useEffect(() => setTasks(initialTasks), [initialTasks])
  React.useEffect(() => setRequests(initialRequests), [initialRequests])
  React.useEffect(() => setVisits(initialVisits), [initialVisits])

  const onOptimisticUpdate = React.useCallback((type: string, id: string, start: string, end?: string) => {
    if (type === 'job') {
      setJobs(prev => prev.map(j => j.id === id ? { ...j, job_start_at: start, job_end_at: end || j.job_end_at } : j))
    } else if (type === 'task') {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, due_date: start, end_date: end || t.end_date } : t))
    } else if (type === 'request') {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, schedule_date: start.split('T')[0] } : r))
    } else if (type === 'visit') {
      setVisits(prev => prev.map(v => v.id === id ? { ...v, visit_date: start } : v))
    }
  }, [])

  const router = useRouter()

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const dayEvents = [
    ...jobs.filter(j => {
      const s = parseISO(j.job_start_at || '');
      const e = parseISO(j.job_end_at || '');
      return s <= endOfDay(currentDate) && e >= startOfDay(currentDate);
    }).map(j => ({ ...j, type: 'job' as const })),
    ...tasks.filter(t => t.due_date && isSameDay(parseISO(t.due_date), currentDate)).map(t => ({ ...t, type: 'task' as const })),
    ...requests.filter(r => isSameDay(parseISO(r.schedule_date || ''), currentDate)).map(r => ({ ...r, type: 'request' as const })),
    ...visits.filter(v => isSameDay(parseISO(v.visit_date || ''), currentDate)).map(v => ({ ...v, type: 'visit' as const }))
  ].sort((a, b) => {
    const timeA = a.type === 'job' ? a.job_start_at : (a.type === 'task' ? a.due_date : (a.type === 'request' ? a.schedule_date : a.visit_date));
    const timeB = b.type === 'job' ? b.job_start_at : (b.type === 'task' ? b.due_date : (b.type === 'request' ? b.schedule_date : b.visit_date));
    return new Date(timeA || '').getTime() - new Date(timeB || '').getTime();
  });

  const next = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1))
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1))
    else setCurrentDate(addDays(currentDate, 1))
  }

  const prev = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1))
    else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1))
    else setCurrentDate(subDays(currentDate, 1))
  }
  const goToToday = () => setCurrentDate(new Date())

  const getEventStyle = (start: string, end: string, currentDay?: Date) => {
    const startDate = parseISO(start)
    //console.log('startDate', startDate)
    let endDate = parseISO(end)
    if (isNaN(endDate.getTime()) || endDate < startDate) endDate = new Date(startDate.getTime() + 60 * 60 * 1000)

    let visualStart = startDate;
    let visualEnd = endDate;

    if (currentDay) {
      const dayStart = startOfDay(currentDay);
      const dayEnd = endOfDay(currentDay);
      if (visualStart < dayStart) visualStart = dayStart;
      if (visualEnd > dayEnd) visualEnd = dayEnd;
    }

    const startMinutes = getHours(visualStart) * 60 + getMinutes(visualStart)
    const endMinutes = getHours(visualEnd) * 60 + getMinutes(visualEnd) + (getHours(visualEnd) === 23 && getMinutes(visualEnd) === 59 ? 1 : 0)

    let durationMinutes = endMinutes - startMinutes;
    if (durationMinutes < 30) durationMinutes = 30;

    const top = (startMinutes / 60) * 64
    const height = (durationMinutes / 60) * 64

    return {
      top: `${top}px`,
      height: `${height}px`,
      minHeight: '24px'
    }
  }

  return (
    <div className="flex flex-col h-full bg-background border border-border/50 rounded-xl overflow-hidden animate-in fade-in duration-500">
      <header className="flex flex-col p-4 bg-card border-b border-border/40 gap-4">
        {/* Top Row: Date and Main Controls */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <div className="flex items-center gap-2 shrink-0">
            <h2 className="text-lg md:text-xl font-bold whitespace-nowrap">
              {format(currentDate, 'MMMM yyyy', { locale: enUS }).replace(/^\w/, (c) => c.toUpperCase())}
            </h2>
            <div className="flex items-center bg-muted/30 rounded-lg p-0.5 border border-border/50 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={prev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={next}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" className="h-8 md:h-9 font-medium px-3" onClick={goToToday}>
              Today
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Desktop Create Button */}
            <Button
              className="bg-[#306C3E] hover:bg-[#265832] text-white h-9 font-semibold gap-2 hidden sm:flex"
              onClick={() => setIsAddingVisit(true)}
            >
              <Plus className="h-4 w-4" />
              Create Visit
            </Button>

            {/* Mobile Actions Dropdown */}
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'icon' }),
                    "h-9 w-9 text-white border-none shadow-md hover:bg-[#265832] transition-colors"
                  )}
                >
                  <Plus className="h-5 w-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 p-2 z-[100]">
                  <DropdownMenuItem onClick={() => setIsAddingVisit(true)} className="font-bold py-2.5 cursor-pointer">
                    <Plus className="mr-2 h-4 w-4" />
                    New Visit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={goToToday} className="font-bold py-2.5 cursor-pointer">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Go to Today
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* View Toggles Section */}
        <div className="flex items-center justify-center sm:justify-start">
          <div className="flex items-center bg-muted/30 rounded-xl p-1 border border-border/50 w-full sm:w-auto">
            {[
              { label: 'Month', value: 'month' },
              { label: 'Week', value: 'week' },
              { label: 'Day', value: 'day' }
            ].map((v) => (
              <Button
                key={v.value}
                variant={view === v.value ? 'secondary' : 'ghost'}
                size="sm"
                className={cn(
                  "flex-1 sm:flex-none h-9 px-6 text-xs font-bold rounded-lg transition-all",
                  view === v.value && "bg-background shadow-sm border border-border/20 text-foreground"
                )}
                onClick={() => setView(v.value as any)}
              >
                {v.label}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {view === 'month' ? (
          <MonthView jobs={jobs} tasks={tasks} requests={requests} visits={visits} currentDate={currentDate} onOptimisticUpdate={onOptimisticUpdate} teamMembers={teamMembers} />
        ) : view === 'week' ? (
          <WeekView jobs={jobs} tasks={tasks} requests={requests} visits={visits} currentDate={currentDate} days={days} getEventStyle={getEventStyle} onOptimisticUpdate={onOptimisticUpdate} teamMembers={teamMembers} />
        ) : (
          <DayView jobs={jobs} tasks={tasks} requests={requests} visits={visits} currentDate={currentDate} getEventStyle={getEventStyle} onOptimisticUpdate={onOptimisticUpdate} teamMembers={teamMembers} />
        )}

        {/* Right Panel - Agenda / Upcoming Events */}
        <aside className="hidden xl:flex w-72 flex-col border-l border-border/40 bg-card overflow-hidden">
          <div className="p-4 border-b border-border/40 flex items-center justify-between shrink-0">
            <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground/80">Upcoming Events</h3>
            <Badge variant="secondary" className="rounded-full h-5 px-1.5 min-w-[20px] justify-center text-[10px] font-black">
              {dayEvents.length}
            </Badge>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {dayEvents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground/60">
                <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
                  <CalendarIcon className="h-5 w-5 text-muted/30" />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wider leading-relaxed opacity-60">
                  Day without scheduled activities
                </p>
              </div>
            ) : (
              dayEvents.map((event, idx) => {
                const colors = {
                  job: 'bg-[#0D3B47] text-white',
                  task: event.type === 'task' && (event as any).status === 'completed' ? 'bg-emerald-600 text-white' : 'bg-orange-500 text-white',
                  request: 'bg-purple-600 text-white',
                  visit: 'bg-teal-600 text-white'
                }[event.type];

                const time = event.type === 'job' ? (event as any).job_start_at : (event.type === 'task' ? (event as any).due_date : (event.type === 'request' ? (event as any).schedule_date : (event as any).visit_date));
                const title = event.type === 'job' ? (event as any).project_name : (event.type === 'task' ? (event as any).title : (event.type === 'request' ? ((event as any).proformas?.project_name || 'Request') : ((event as any).team_members?.name || 'Visit')));

                return (
                  <Popover key={`${event.type}-${(event as any).id}`}>
                    <PopoverTrigger className="w-full text-left">
                      <div className={cn(
                        "p-3 rounded-xl shadow-sm border border-border/50 group transition-all hover:scale-[1.02] cursor-pointer",
                        "bg-background hover:shadow-md"
                      )}>
                        <div className="flex items-start gap-3">
                          <div className={cn("mt-0.5 h-2 w-2 rounded-full shrink-0",
                            event.type === 'job' ? 'bg-[#0D3B47]' : (event.type === 'task' ? 'bg-orange-500' : (event.type === 'request' ? 'bg-purple-600' : 'bg-teal-600'))
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{event.type}</span>
                              <span className="text-[10px] font-black tabular-nums text-foreground/80">{format(parseISO(time || ''), 'HH:mm')}</span>
                            </div>
                            <h4 className="text-xs font-bold leading-snug truncate group-hover:text-primary transition-colors">
                              {title}
                            </h4>
                            {event.type === 'visit' && (
                              <p className="text-[10px] text-muted-foreground mt-1 truncate">
                                Assigned: {(event as any).team_members?.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="z-50 w-80 p-0 overflow-hidden border-none shadow-2xl rounded-xl" side="left" align="start" sideOffset={10}>
                      {event.type === 'job' && <JobDetailContent job={event as any} />}
                      {event.type === 'task' && <TaskDetailContent task={event as any} teamMembers={teamMembers} />}
                      {event.type === 'request' && <RequestDetailContent request={event as any} />}
                      {event.type === 'visit' && <VisitDetailContent visit={event as any} teamMembers={teamMembers} />}
                    </PopoverContent>
                  </Popover>
                );
              })
            )}
          </div>
        </aside>
      </div>

      {isAddingVisit && (
        <VisitFormModal
          jobs={jobs}
          teamMembers={teamMembers}
          onClose={() => setIsAddingVisit(false)}
          onSuccess={() => {
            setIsAddingVisit(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

function CurrentTimeIndicator() {
  const [top, setTop] = React.useState(0)

  React.useEffect(() => {
    const update = () => {
      const now = new Date()
      setTop((now.getHours() * 60 + now.getMinutes()) / 60 * 64)
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="absolute left-0 right-0 z-40 flex items-center pointer-events-none"
      style={{ top: `${top}px` }}
    >
      <div className="h-2 w-2 rounded-full bg-red-500 -ml-1 border-2 border-white shadow-sm" />
      <div className="flex-1 h-[2px] bg-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
    </div>
  )
}

function WeekView({ jobs, tasks, requests, visits, currentDate, days, getEventStyle, onOptimisticUpdate, teamMembers }: { jobs: Job[], tasks: Task[], requests: ServiceRequest[], visits: JobVisit[], currentDate: Date, days: Date[], getEventStyle: any, onOptimisticUpdate: any, teamMembers: any[] }) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [dropTarget, setDropTarget] = React.useState<{dateStr: string, hour: number} | null>(null);

  React.useEffect(() => {
    const scrollToCurrentTime = () => {
      if (scrollRef.current) {
        const hour = new Date().getHours()
        const scrollOffset = Math.max(0, (hour * 64) - 150)
        scrollRef.current.scrollTop = scrollOffset
      }
    }
    const timer = setTimeout(scrollToCurrentTime, 100)
    return () => clearTimeout(timer)
  }, [currentDate])

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex border-b border-border/40 backdrop-blur-md z-20">
        <div className="w-16 border-r border-border/40 shrink-0" />
        <div className="flex-1 grid grid-cols-7 ">
          {days.map((day) => (
            <div key={day.toString()} className="px-2 py-4 text-center border-r border-border/20 last:border-r-0">
              <div className={cn(
                "text-[10px] uppercase tracking-wider font-bold mb-1",
                isToday(day) ? "text-primary" : "text-muted-foreground/60"
              )}>
                {format(day, 'eee', { locale: enUS })}
              </div>
              <div className={cn(
                "text-xl font-bold h-10 w-10 flex items-center justify-center mx-auto rounded-full transition-all",
                isToday(day) ? "bg-primary text-primary-foreground shadow-md" : (isSameMonth(day, currentDate) ? "text-foreground" : "text-muted-foreground/40")
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto relative">
        <div className="flex">
          <div className="w-16 border-r border-border/40 shrink-0 sticky left-0 z-10">
            {HOURS.map((hour) => (
              <div key={hour} className="h-16 relative pr-2 border-b border-border/5">
                {hour !== 0 && (
                  <span className="absolute -top-[7px] right-2 text-[10px] font-bold text-muted-foreground/40 tabular-nums">
                    {hour}:00
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="flex-1 grid grid-cols-7 relative">
            {days.map((day) => {
              const isTodayDay = isToday(day)
              const dayJobs = jobs.filter(j => {
                const s = parseISO(j.job_start_at || '');
                const e = parseISO(j.job_end_at || '');
                return s <= endOfDay(day) && e >= startOfDay(day);
              })
              const dayTasks = tasks.filter(t => {
                if (!t.due_date) return false;
                const s = parseISO(t.due_date);
                const e = parseISO(t.end_date || t.due_date);
                return s <= endOfDay(day) && e >= startOfDay(day);
              })
              const dayRequests = requests.filter(r => isSameDay(parseISO(r.schedule_date || ''), day))
              const dayVisits = visits.filter(v => isSameDay(parseISO(v.visit_date), day))

              return (
                <div key={day.toString()} className="flex-1 relative border-r border-border/10"
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!e.dataTransfer.types.includes('text/plain')) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    const hour = Math.min(23, Math.max(0, Math.floor(y / 64))); // 64px per hour
                    const dateStr = day.toISOString();
                    setDropTarget(prev => (prev?.dateStr === dateStr && prev?.hour === hour ? prev : { dateStr, hour }));
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setDropTarget(null);
                    }
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setDropTarget(null);
                    if (!e.dataTransfer.getData('text/plain')) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    const hour = Math.min(23, Math.max(0, Math.floor(y / 64))); // 64px per hour
                    
                    try {
                      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                      const newStart = new Date(day);
                      const oldStart = parseISO(data.start);
                      newStart.setHours(hour, oldStart.getMinutes(), 0, 0);
                      
                      let newEnd: Date | undefined;
                      if (data.end) {
                        const oldEnd = parseISO(data.end);
                        const duration = oldEnd.getTime() - oldStart.getTime();
                        newEnd = new Date(newStart.getTime() + duration);
                      }
                      
                      const newStartStr = newStart.toISOString();
                      const newEndStr = newEnd?.toISOString();
                      
                      onOptimisticUpdate(data.type, data.id, newStartStr, newEndStr);
                      const res = await updateEventDate(data.type, data.id, newStartStr, newEndStr);
                      if (res.error) toast.error(res.error);
                      else toast.success('Date updated');
                    } catch(err) {
                      console.error(err);
                    }
                  }}
                >
                  {dropTarget?.dateStr === day.toISOString() && (
                    <div 
                      className="absolute left-1 right-1 z-0 bg-primary/20 border-2 border-primary/40 rounded-lg pointer-events-none transition-all duration-75"
                      style={{ top: `${dropTarget.hour * 64}px`, height: '64px' }}
                    />
                  )}
                  {HOURS.map((hour) => (
                    <div key={hour} className="h-16 border-b border-border/40 last:border-b-0" />
                  ))}
                  {dayJobs.map(job => (
                    <JobCard key={job.id} job={job} style={getEventStyle(job.job_start_at, job.job_end_at, day)} />
                  ))}
                  {dayTasks.map(task => (
                    <TaskCard key={task.id} task={task} style={getEventStyle(task.due_date, task.due_date, day)} teamMembers={teamMembers} />
                  ))}
                  {dayRequests.map((request, idx) => {
                    const { start, end } = getRequestVirtualDates(request.schedule_date, request.time_preference);
                    return (
                      <RequestCard key={request.id} request={request} style={{
                        ...getEventStyle(start, end, day),
                        left: `${10 + (idx * 5)}%`,
                        width: `${100}%`,
                        zIndex: 35
                      }} />
                    );
                  })}
                  {dayVisits.map((visit, idx) => (
                    <VisitCard key={visit.id} visit={visit} style={{
                      ...getEventStyle(visit.visit_date, new Date(parseISO(visit.visit_date).getTime() + 60 * 60 * 1000).toISOString(), day),
                      left: `${15 + (idx * 5)}%`,
                      width: `${80 - (idx * 2)}%`,
                      zIndex: 38
                    }} teamMembers={teamMembers} />
                  ))}
                  {isTodayDay && <CurrentTimeIndicator />}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function DayView({ jobs, tasks, requests, visits, currentDate, getEventStyle, onOptimisticUpdate, teamMembers }: { jobs: Job[], tasks: Task[], requests: ServiceRequest[], visits: JobVisit[], currentDate: Date, getEventStyle: any, onOptimisticUpdate: any, teamMembers: any[] }) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [dropTarget, setDropTarget] = React.useState<{dateStr: string, hour: number} | null>(null);

  React.useEffect(() => {
    const scrollToCurrentTime = () => {
      if (scrollRef.current) {
        const hour = new Date().getHours()
        const scrollOffset = Math.max(0, (hour * 64) - 150)
        scrollRef.current.scrollTop = scrollOffset
      }
    }
    const timer = setTimeout(scrollToCurrentTime, 100)
    return () => clearTimeout(timer)
  }, [currentDate])

  const dayJobs = jobs.filter(j => {
    const s = parseISO(j.job_start_at || '');
    const e = parseISO(j.job_end_at || '');
    return s <= endOfDay(currentDate) && e >= startOfDay(currentDate);
  })
  const dayTasks = tasks.filter(t => {
    if (!t.due_date) return false;
    const s = parseISO(t.due_date);
    const e = parseISO(t.end_date || t.due_date);
    return s <= endOfDay(currentDate) && e >= startOfDay(currentDate);
  })
  const dayRequests = requests.filter(r => isSameDay(parseISO(r.schedule_date || ''), currentDate))
  const dayVisits = visits.filter(v => isSameDay(parseISO(v.visit_date || ''), currentDate))

  return (
    <div className="flex-1 flex flex-col">
      <header className="flex border-b border-border/40 backdrop-blur-md z-20">
        <div className="w-16 border-r border-border/40 shrink-0" />
        <div className="flex-1 px-4 py-4">
          <div className="text-[10px] uppercase tracking-wider font-bold mb-1 text-primary">
            {format(currentDate, 'EEEE', { locale: enUS })}
          </div>
          <div className="text-xl font-bold">
            {format(currentDate, 'd MMMM yyyy', { locale: enUS })}
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto relative">
        <div className="flex">
          <div className="w-16 border-r border-border/40 shrink-0 sticky left-0 z-10">
            {HOURS.map((hour) => (
              <div key={hour} className="h-16 relative pr-2 border-b border-border/5">
                {hour !== 0 && (
                  <span className="absolute -top-[7px] right-2 text-[10px] font-bold text-muted-foreground/40 tabular-nums">
                    {hour}:00
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="flex-1 relative"
            onDragOver={(e) => {
              e.preventDefault();
              if (!e.dataTransfer.types.includes('text/plain')) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const y = e.clientY - rect.top;
              const hour = Math.min(23, Math.max(0, Math.floor(y / 64))); // 64px per hour
              const dateStr = currentDate.toISOString();
              setDropTarget(prev => (prev?.dateStr === dateStr && prev?.hour === hour ? prev : { dateStr, hour }));
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDropTarget(null);
              }
            }}
            onDrop={async (e) => {
              e.preventDefault();
              setDropTarget(null);
              if (!e.dataTransfer.getData('text/plain')) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const y = e.clientY - rect.top;
              const hour = Math.min(23, Math.max(0, Math.floor(y / 64))); // 64px per hour
              
              try {
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                const newStart = new Date(currentDate);
                const oldStart = parseISO(data.start);
                newStart.setHours(hour, oldStart.getMinutes(), 0, 0);
                
                let newEnd: Date | undefined;
                if (data.end) {
                  const oldEnd = parseISO(data.end);
                  const duration = oldEnd.getTime() - oldStart.getTime();
                  newEnd = new Date(newStart.getTime() + duration);
                }
                
                const newStartStr = newStart.toISOString();
                const newEndStr = newEnd?.toISOString();
                
                onOptimisticUpdate(data.type, data.id, newStartStr, newEndStr);
                const res = await updateEventDate(data.type, data.id, newStartStr, newEndStr);
                if (res.error) toast.error(res.error);
                else toast.success('Date updated');
              } catch(err) {
                console.error(err);
              }
            }}
          >
            {dropTarget?.dateStr === currentDate.toISOString() && (
              <div 
                className="absolute left-1 right-1 z-0 bg-primary/20 border-2 border-primary/40 rounded-lg pointer-events-none transition-all duration-75"
                style={{ top: `${dropTarget.hour * 64}px`, height: '64px' }}
              />
            )}
            {isToday(currentDate) && <CurrentTimeIndicator />}
            {HOURS.map((hour) => (
              <div key={hour} className="h-16 border-b border-border/40 last:border-b-0" />
            ))}
            {dayJobs.map((job) => (
              <JobCard key={job.id} job={job} style={getEventStyle(job.job_start_at, job.job_end_at, currentDate)} />
            ))}
            {dayTasks.map((task) => (
              <TaskCard key={task.id} task={task} style={getEventStyle(task.due_date, task.end_date || task.due_date, currentDate)} teamMembers={teamMembers} />
            ))}
            {dayRequests.map((request, idx) => {
              const { start, end } = getRequestVirtualDates(request.schedule_date, request.time_preference);
              return (
                <RequestCard key={request.id} request={request} style={{
                  ...getEventStyle(start, end, currentDate),
                  left: `${10 + (idx * 15)}%`,
                  width: '42%',
                  zIndex: 35
                }} />
              );
            })}
            {dayVisits.map((visit, idx) => (
              <VisitCard key={visit.id} visit={visit} style={{
                ...getEventStyle(visit.visit_date, new Date(parseISO(visit.visit_date).getTime() + 60 * 60 * 1000).toISOString(), currentDate),
                left: `${15 + (idx * 5)}%`,
                width: `${82 - (idx * 2)}%`,
                zIndex: 38
              }} teamMembers={teamMembers} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MonthView({ jobs, tasks, requests, visits, currentDate, onOptimisticUpdate, teamMembers }: { jobs: Job[], tasks: Task[], requests: ServiceRequest[], visits: JobVisit[], currentDate: Date, onOptimisticUpdate: any, teamMembers: any[] }) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const [dropTarget, setDropTarget] = React.useState<string | null>(null);

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <div className="grid grid-cols-7 border-b border-border/40 backdrop-blur-md sticky top-0 z-20">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-2 text-center text-[10px] uppercase font-bold text-muted-foreground/60 border-r border-border/10 last:border-r-0">
            {day}
          </div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7 min-h-0 bg-border/5">
        {calendarDays.map((day) => {
          const dayJobs = jobs.filter(j => {
            const s = parseISO(j.job_start_at || '');
            const e = parseISO(j.job_end_at || '');
            return s <= endOfDay(day) && e >= startOfDay(day);
          })
          const dayTasks = tasks.filter(t => isSameDay(parseISO(t.due_date || ''), day))
          const dayRequests = requests.filter(r => isSameDay(parseISO(r.schedule_date || ''), day))
          const dayVisits = visits.filter(v => isSameDay(parseISO(v.visit_date || ''), day))

          return (
            <div key={day.toString()} className={cn(
              "p-2 border-r border-b border-border/10 min-h-[120px] bg-background transition-colors hover:bg-muted/5 relative",
              !isSameMonth(day, currentDate) && "bg-muted/10 opacity-40",
              dropTarget === day.toISOString() && "bg-primary/5 ring-inset ring-2 ring-primary/40 rounded-xl m-0.5 z-10"
            )}
              onDragOver={(e) => {
                e.preventDefault();
                if (e.dataTransfer.types.includes('text/plain')) {
                  const ds = day.toISOString();
                  if (dropTarget !== ds) setDropTarget(ds);
                }
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDropTarget(null);
                }
              }}
              onDrop={async (e) => {
                e.preventDefault();
                setDropTarget(null);
                if (!e.dataTransfer.getData('text/plain')) return;
                try {
                  const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                  const newStart = new Date(day);
                  const oldStart = parseISO(data.start);
                  newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0);
                  
                  let newEnd: Date | undefined;
                  if (data.end) {
                    const oldEnd = parseISO(data.end);
                    const duration = oldEnd.getTime() - oldStart.getTime();
                    newEnd = new Date(newStart.getTime() + duration);
                  }
                  
                  const newStartStr = newStart.toISOString();
                  const newEndStr = newEnd?.toISOString();
                  
                  onOptimisticUpdate(data.type, data.id, newStartStr, newEndStr);
                  const res = await updateEventDate(data.type, data.id, newStartStr, newEndStr);
                  if (res.error) toast.error(res.error);
                  else toast.success('Date updated');
                } catch(err) {
                  console.error(err);
                }
              }}
            >
              <div className={cn(
                "text-sm font-medium mb-1 h-7 w-7 flex items-center justify-center rounded-full",
                isToday(day) ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground"
              )}>
                {format(day, 'd')}
              </div>
              <div className="space-y-1 mt-1 overflow-y-auto max-h-[80px] scrollbar-hide">
                {dayJobs.map(job => (
                  <JobCardCompact key={`job-${job.id}-${day.toString()}`} job={job} />
                ))}
                {dayTasks.map(task => (
                  <TaskCardCompact key={`task-${task.id}-${day.toString()}`} task={task} teamMembers={teamMembers} />
                ))}
                {dayRequests.map(request => (
                  <RequestCardCompact key={`request-${request.id}-${day.toString()}`} request={request} />
                ))}
                {dayVisits.map(visit => (
                  <VisitCardCompact key={`visit-${visit.id}-${day.toString()}`} visit={visit} teamMembers={teamMembers} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function JobCardCompact({ job }: { job: Job }) {
  return (
    <Popover>
      <PopoverTrigger render={
          <div 
            draggable
            onDragStart={(e) => { e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'job', id: job.id, start: job.job_start_at, end: job.job_end_at })); }}
            className="px-2 py-1 rounded bg-[#0D3B47] text-white text-[10px] font-bold truncate cursor-pointer hover:bg-[#144D5D] transition-all shadow-sm"
          >
            {format(parseISO(job.job_start_at), 'HH:mm')} {job.project_name}
          </div>
      } />
      <PopoverContent className="z-50 w-80 p-0 overflow-hidden border-none shadow-2xl rounded-xl" side="bottom" align="center" sideOffset={10}>
        <JobDetailContent job={job} />
      </PopoverContent>
    </Popover>
  )
}

function TaskCardCompact({ task, teamMembers }: { task: Task, teamMembers: any[] }) {
  return (
    <Popover>
      <PopoverTrigger render={
          <div 
            draggable
            onDragStart={(e) => { e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'task', id: task.id, start: task.due_date, end: task.end_date || task.due_date })); }}
            className={cn(
              "px-2 py-1 rounded text-white text-[10px] font-bold truncate cursor-pointer transition-all shadow-sm",
              task.status === 'completed' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-orange-500 hover:bg-orange-600"
            )}
          >
            {format(parseISO(task.due_date), 'HH:mm')} {task.title}
          </div>
      } />
      <PopoverContent className="z-50 w-80 p-0 overflow-hidden border-none shadow-2xl rounded-xl" side="bottom" align="center" sideOffset={10}>
        <TaskDetailContent task={task} teamMembers={teamMembers} />
      </PopoverContent>
    </Popover>
  )
}

function RequestCardCompact({ request }: { request: ServiceRequest }) {
  return (
    <Popover>
      <PopoverTrigger render={
          <div 
            draggable
            onDragStart={(e) => { e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'request', id: request.id, start: request.schedule_date, end: request.schedule_date })); }}
            className="px-2 py-1 rounded bg-purple-600 text-white text-[10px] font-bold truncate cursor-pointer hover:bg-purple-700 transition-all shadow-sm"
          >
            {getRequestDisplayTime(request.schedule_date, request.time_preference)} {request.proformas?.project_name || 'Request'}
          </div>
      } />
      <PopoverContent className="z-50 w-80 p-0 overflow-hidden border-none shadow-2xl rounded-xl" side="bottom" align="center" sideOffset={10}>
        <RequestDetailContent request={request} />
      </PopoverContent>
    </Popover>
  )
}

function VisitCardCompact({ visit, teamMembers }: { visit: JobVisit, teamMembers: any[] }) {
  return (
    <Popover>
      <PopoverTrigger render={
          <div 
            draggable
            onDragStart={(e) => { e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'visit', id: visit.id, start: visit.visit_date, end: visit.visit_date })); }}
            className="px-2 py-1 rounded bg-teal-600 text-white text-[10px] font-bold truncate cursor-pointer hover:bg-teal-700 transition-all shadow-sm"
          >
            {format(parseISO(visit.visit_date), 'HH:mm')} Visit - {visit.assigned_name}
          </div>
      } />
      <PopoverContent className="z-50 w-80 p-0 overflow-hidden border-none shadow-2xl rounded-xl" side="bottom" align="center" sideOffset={10}>
        <VisitDetailContent visit={visit} teamMembers={teamMembers} />
      </PopoverContent>
    </Popover>
  )
}

function JobCard({ job, style }: { job: Job, style: React.CSSProperties }) {
  return (
    <Popover>
      <PopoverTrigger render={
          <div
            draggable
            onDragStart={(e) => { e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'job', id: job.id, start: job.job_start_at, end: job.job_end_at })); }}
            className="absolute left-1 right-1 rounded-lg bg-[#0D3B47] text-white p-2 text-xs overflow-hidden shadow-md group cursor-pointer hover:bg-[#144D5D] transition-all hover:scale-[1.02] hover:z-30 border border-white/10"
            style={style}
          >
            <div className="font-bold truncate leading-tight">
              {job.project_name}
            </div>
            <div className="text-[10px] opacity-80 font-medium flex items-center mt-1">
              <Clock className="h-3 w-3 mr-1 shrink-0" />
              {format(parseISO(job.job_start_at), 'HH:mm')}
            </div>
          </div>
      } />
      <PopoverContent className="z-50 w-80 p-0 overflow-hidden border-none shadow-2xl rounded-xl" side="bottom" align="center" sideOffset={12}>
        <JobDetailContent job={job} />
      </PopoverContent>
    </Popover>
  )
}

function TaskCard({ task, style, teamMembers }: { task: Task, style: React.CSSProperties, teamMembers: any[] }) {
  return (
    <Popover>
      <PopoverTrigger render={
          <div
            draggable
            onDragStart={(e) => { e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'task', id: task.id, start: task.due_date, end: task.end_date || task.due_date })); }}
            className={cn(
              "absolute left-1 right-1 rounded-lg text-white p-2 text-xs overflow-hidden shadow-md group cursor-pointer transition-all hover:scale-[1.02] hover:z-50 border border-white/10",
              task.status === 'completed' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-orange-500 hover:bg-orange-600"
            )}
            style={style}
          >
            <div className="font-bold truncate leading-tight">
              {task.title}
            </div>
            <div className="text-[10px] opacity-80 font-medium flex items-center mt-1">
              <Clock className="h-3 w-3 mr-1 shrink-0" />
              {format(parseISO(task.due_date), 'HH:mm')}
            </div>
          </div>
      } />
      <PopoverContent className="z-50 w-80 p-0 overflow-hidden border-none shadow-2xl rounded-xl" side="bottom" align="center" sideOffset={12}>
        <TaskDetailContent task={task} teamMembers={teamMembers} />
      </PopoverContent>
    </Popover>
  )
}

function RequestCard({ request, style }: { request: ServiceRequest, style: React.CSSProperties }) {
  return (
    <Popover>
      <PopoverTrigger render={
          <div
            draggable
            onDragStart={(e) => { e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'request', id: request.id, start: request.schedule_date, end: request.schedule_date })); }}
            className="absolute rounded-lg bg-purple-600 text-white p-2 text-xs overflow-hidden shadow-md group cursor-pointer hover:bg-purple-700 transition-all hover:scale-[1.02] border border-white/10"
            style={style}
          >
            <div className="font-bold truncate leading-tight">
              {request.proformas?.project_name || 'Request'}
            </div>
            <div className="text-[10px] opacity-80 font-medium flex items-center mt-1">
              <Clock className="h-3 w-3 mr-1 shrink-0" />
              {getRequestDisplayTime(request.schedule_date, request.time_preference)}
            </div>
          </div>
      } />
      <PopoverContent className="z-50 w-80 p-0 overflow-hidden border-none shadow-2xl rounded-xl" side="bottom" align="center" sideOffset={12}>
        <RequestDetailContent request={request} />
      </PopoverContent>
    </Popover>
  )
}

function VisitCard({ visit, style, teamMembers }: { visit: JobVisit, style: React.CSSProperties, teamMembers: any[] }) {
  return (
    <Popover>
      <PopoverTrigger render={
          <div
            draggable
            onDragStart={(e) => { e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'visit', id: visit.id, start: visit.visit_date, end: visit.visit_date })); }}
            className="absolute left-1 right-1 rounded-lg bg-teal-600 text-white p-2 text-xs overflow-hidden shadow-md group cursor-pointer hover:bg-teal-700 transition-all hover:scale-[1.02] hover:z-40 border border-white/10"
            style={style}
          >
            <div className="font-bold border-b border-white/20 pb-1 mb-1 truncate leading-tight flex items-center gap-1.5 uppercase tracking-tighter text-[9px]">
              <User className="h-2.5 w-2.5" /> Visit
            </div>
            <div className="font-bold truncate leading-tight">
              {visit.team_members?.name}
            </div>
            <div className="text-[10px] opacity-80 font-medium flex items-center mt-1">
              <Clock className="h-3 w-3 mr-1 shrink-0" />
              {format(parseISO(visit.visit_date), 'HH:mm')}
            </div>
          </div>
      } />
      <PopoverContent className="z-50 w-80 p-0 overflow-hidden border-none shadow-2xl rounded-xl" side="bottom" align="center" sideOffset={12}>
        <VisitDetailContent visit={visit} teamMembers={teamMembers} />
      </PopoverContent>
    </Popover>
  )
}


function JobDetailContent({ job }: { job: Job }) {
  const client = getClientData(job);

  return (
    <div className="bg-card">
      <div className="p-4 border-b border-border/10 bg-[#f8f9fa] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#0D3B47]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Job Details</span>
        </div>
        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 py-0 h-4.5 bg-green-50 text-green-700 border-green-100">
          In Progress
        </Badge>
      </div>

      <div className="p-5 space-y-5">
        <div>
          <h4 className="text-lg font-bold text-[#0D3B47] leading-tight mb-1">{job.project_name}</h4>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Job #{job.number}</p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Customer</p>
              <p className="text-sm font-semibold text-foreground">{client?.company_name || client?.name || 'Unknown'}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div className="grid grid-cols-2 gap-x-8">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Start</p>
                <p className="text-sm font-semibold text-foreground">{format(parseISO(job.job_start_at), 'MMM d, p')}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">End</p>
                <p className="text-sm font-semibold text-foreground">{format(parseISO(job.job_end_at), 'MMM d, p')}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Address</p>
              <div>
                {getFullAddress(client) ? (
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getFullAddress(client))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                  >
                    {getFullAddress(client)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="text-sm font-semibold text-foreground">No address provided</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border/10">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Reminders</p>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={getGoogleCalendarUrl(job.project_name, `Job: ${job.project_name}`, job.job_start_at, job.job_end_at, client?.street_1 || '')}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: 'outline' }), "h-9 text-[10px] font-bold gap-1.5 border-blue-100 hover:bg-blue-50 hover:text-blue-700 text-blue-600 transition-colors")}
            >
              <CalendarIcon className="h-3 w-3" />
              Google Calendar
            </a>
            <a
              href={getAppleCalendarData(job.project_name, `Job: ${job.project_name}`, job.job_start_at, job.job_end_at, client?.street_1 || '')}
              download={`${job.project_name.replace(/\s+/g, '_')}.ics`}
              className={cn(buttonVariants({ variant: 'outline' }), "h-9 text-[10px] font-bold gap-1.5 border-slate-100 hover:bg-slate-50 hover:text-slate-700 text-slate-600 transition-colors")}
            >
              <CalendarIcon className="h-3 w-3" />
              Apple Calendar
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <a
            href={`/proforma/${job.id}`}
            className={cn(buttonVariants({ variant: 'outline' }), "h-10 text-xs font-bold gap-2 hover:bg-muted/50 border-border/60")}
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </a>
          <a
            href={`/proforma/${job.id}`}
            className={cn(buttonVariants({ variant: 'default' }), "h-10 text-xs font-bold gap-2 bg-[#306C3E] hover:bg-[#265832]")}
          >
            View Details
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  )
}

function TaskDetailContent({ task, teamMembers }: { task: Task, teamMembers: any[] }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [assignedTo, setAssignedTo] = React.useState(task.assigned_to || "");
  const selectedMemberName = React.useMemo(() => {
    if (!assignedTo) return "Unassigned";
    const m = teamMembers.find(t => t.id === assignedTo);
    return m ? m.name : "Unassigned";
  }, [assignedTo, teamMembers]);
  
  const client = getClientData(task);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const startInput = formData.get('due_date') as string;
    const endInput = formData.get('end_date') as string;
    
    // ISO string from datetime-local
    const due_date = startInput ? new Date(startInput).toISOString() : task.due_date;
    const end_date = endInput ? new Date(endInput).toISOString() : (task.end_date || due_date);
    const assigned_to_val = formData.get('assigned_to') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    
    const update = {
      title,
      description,
      due_date,
      end_date,
      assigned_to: assigned_to_val || null,
    };
    
    const res = await updateJobTask(task.id, update);
    setIsSubmitting(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success('Task updated');
      setIsEditing(false);
      window.location.reload();
    }
  }

  if (isEditing) {
    return (
      <div className="bg-card">
        <div className="p-4 border-b border-border/10 bg-[#f8f9fa] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full", task.status === 'completed' ? "bg-emerald-500" : "bg-orange-500")} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Edit Task</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Title</Label>
            <Input name="title" defaultValue={task.title} className="h-9" required />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Description</Label>
            <Input name="description" defaultValue={task.description || ''} className="h-9" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Start</Label>
              <Input type="datetime-local" name="due_date" defaultValue={format(parseISO(task.due_date), "yyyy-MM-dd'T'HH:mm")} className="h-9" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">End</Label>
              <Input type="datetime-local" name="end_date" defaultValue={task.end_date ? format(parseISO(task.end_date), "yyyy-MM-dd'T'HH:mm") : format(parseISO(task.due_date), "yyyy-MM-dd'T'HH:mm")} className="h-9" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Assigned To</Label>
            <Select name="assigned_to" value={assignedTo} onValueChange={(val) => setAssignedTo(val || "")}>
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder="Unassigned">
                  {selectedMemberName}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="z-[3000]">
                <SelectItem value="">Unassigned</SelectItem>
                {teamMembers.map(member => (
                   <SelectItem key={`member-${member.id}`} value={member.id}>{member.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="pt-3 border-t border-border/10 flex gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="flex-1 font-bold h-9 text-xs">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-[#306C3E] hover:bg-[#265832] font-bold h-9 text-xs text-white">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Save
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-card">
      <div className="p-4 border-b border-border/10 bg-[#f8f9fa] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", task.status === 'completed' ? "bg-emerald-500" : "bg-orange-500")} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Task Details</span>
        </div>
        <Badge variant={task.status === 'completed' ? 'secondary' : 'outline'} className={cn(
          "text-[9px] font-black uppercase tracking-widest px-2 py-0 h-4.5",
          task.status === 'completed' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-orange-50 text-orange-700 border-orange-100"
        )}>
          {task.status}
        </Badge>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h4 className="text-lg font-bold text-foreground leading-tight">{task.title}</h4>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{task.description}</p>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Schedule</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{format(parseISO(task.due_date), 'MMM d, p')}</p>
                {task.end_date && (
                  <>
                    <span className="text-muted-foreground">→</span>
                    <p className="text-sm font-semibold text-foreground">{format(parseISO(task.end_date), 'p')}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Assigned to</p>
              <p className="text-sm font-semibold text-foreground">{task.team_members?.name || 'Unassigned'}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Address</p>
              {getFullAddress(client) ? (
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getFullAddress(client))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                >
                  {getFullAddress(client)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <p className="text-sm font-semibold text-foreground">Unassigned</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/10 mt-4">
          <Button
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="h-10 text-xs font-bold gap-2 hover:bg-muted/50 border-border/60"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </Button>
          <a
            href={`/proforma/${task.proforma_id}`}
            className={cn(buttonVariants({ variant: 'default' }), "h-10 text-xs font-bold gap-2 bg-[#306C3E] hover:bg-[#265832]")}
          >
            View Job
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  )
}

function RequestDetailContent({ request }: { request: ServiceRequest }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [year, month, day] = request.schedule_date.split('-').map(Number);
  const localDate = new Date(year, month - 1, day);
  const displayDate = format(localDate, 'MMM d');
  const hasTime = !(getHours(parseISO(request.schedule_date)) === 0 && getMinutes(parseISO(request.schedule_date)) === 0);
  const displayTime = hasTime ? format(parseISO(request.schedule_date), 'p') : '';

  const client = getClientData(request);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const dateInput = formData.get('schedule_date') as string;
    
    const schedule_date = dateInput || request.schedule_date;
    const time_preference = formData.get('time_preference') as string;
    const details = formData.get('details') as string;
    
    const update = {
      schedule_date,
      time_preference,
      details,
    };
    
    const res = await updateServiceRequest(request.id, update);
    setIsSubmitting(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success('Request updated');
      setIsEditing(false);
      window.location.reload();
    }
  }

  if (isEditing) {
    return (
      <div className="bg-card">
        <div className="p-4 border-b border-border/10 bg-[#f8f9fa] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-purple-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Edit Request</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Schedule Date</Label>
            <Input type="date" name="schedule_date" defaultValue={request.schedule_date.split('T')[0]} className="h-9" required />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Time Preference</Label>
            <Select name="time_preference" defaultValue={request.time_preference || 'anytime'}>
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder="Select Preference" />
              </SelectTrigger>
              <SelectContent className="z-[3000]">
                <SelectItem value="morning">Morning (9AM - 12PM)</SelectItem>
                <SelectItem value="afternoon">Afternoon (12PM - 5PM)</SelectItem>
                <SelectItem value="anytime">Anytime</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Details</Label>
            <Input name="details" defaultValue={request.details || ''} className="h-9" />
          </div>
          <div className="pt-3 border-t border-border/10 flex gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="flex-1 font-bold h-9 text-xs">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-purple-600 hover:bg-purple-700 font-bold h-9 text-xs text-white">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Save
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-card">
      <div className="p-4 border-b border-border/10 bg-[#f8f9fa] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-purple-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Request Details</span>
        </div>
        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 py-0 h-4.5 bg-purple-50 text-purple-700 border-purple-100">
          {request.status}
        </Badge>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h4 className="text-lg font-bold text-foreground leading-tight">{request.proformas?.project_name || 'Service Request'}</h4>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{request.details}</p>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Proposed Schedule</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {displayDate}{displayTime ? `, ${displayTime}` : ''}
                </p>
                {request.time_preference && (
                  <Badge variant="secondary" className="text-[9px] uppercase">{request.time_preference}</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Customer</p>
              <p className="text-sm font-semibold text-foreground">{client?.company_name || client?.name || 'Unknown'}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Address</p>
              {getFullAddress(client) ? (
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getFullAddress(client))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                >
                  {getFullAddress(client)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <p className="text-sm font-semibold text-foreground">No address provided</p>
              )}
            </div>
          </div>
        </div>
        <div className="pt-4 border-t border-border/10">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Reminders</p>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={getGoogleCalendarUrl(request.proformas?.project_name || '', `Job: ${request.proformas?.project_name}`, request.schedule_date, request.schedule_date, client?.street_1 || '')}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: 'outline' }), "h-9 text-[10px] font-bold gap-1.5 border-blue-100 hover:bg-blue-50 hover:text-blue-700 text-blue-600 transition-colors")}
            >
              <CalendarIcon className="h-3 w-3" />
              Google Calendar
            </a>
            <a
              href={getAppleCalendarData(request.proformas?.project_name || '', `Job: ${request.proformas?.project_name}`, request.schedule_date, request.schedule_date, client?.street_1 || '')}
              download={`${request.proformas?.project_name.replace(/\s+/g, '_')}.ics`}
              className={cn(buttonVariants({ variant: 'outline' }), "h-9 text-[10px] font-bold gap-1.5 border-slate-100 hover:bg-slate-50 hover:text-slate-700 text-slate-600 transition-colors")}
            >
              <CalendarIcon className="h-3 w-3" />
              Apple Calendar
            </a>
          </div>
        </div>
        <div className="pt-3 border-t border-border/10 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="h-10 text-xs font-bold gap-2 hover:bg-muted/50 border-border/60"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit
            </Button>
            <a
              href={`/proforma/${request.proforma_id}`}
              className={cn(buttonVariants({ variant: 'default' }), "h-10 text-xs font-bold gap-2 bg-[#306C3E] hover:bg-[#265832]")}
            >
              Review Request
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <DeleteConfirmModal
            title="Delete Request?"
            description="Are you sure you want to delete this service request? This action cannot be undone."
            onConfirm={async () => {
              const res = await deleteRequest(request.id);
              if (res.error) toast.error(res.error);
              else {
                toast.success('Request deleted');
                window.location.reload();
              }
            }}
            trigger={
              <Button variant="ghost" className="w-full h-9 text-[10px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5 transition-colors">
                <Trash2 className="h-3 w-3" />
                Delete Request
              </Button>
            }
          />
        </div>
      </div>
    </div>
  )
}

function DeleteConfirmModal({ title, description, onConfirm, trigger }: { title: string, description: string, onConfirm: () => Promise<void>, trigger: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}>
        {trigger}
      </div>
      <DialogContent className="sm:max-w-[400px] z-[2000]" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle className="text-center text-xl">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button variant="outline" className="flex-1" onClick={() => setIsOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1 font-bold"
            disabled={isDeleting}
            onClick={async () => {
              setIsDeleting(true);
              await onConfirm();
              setIsDeleting(false);
              setIsOpen(false);
            }}
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Confirm Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VisitDetailContent({ visit, teamMembers }: { visit: JobVisit, teamMembers: any[] }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [assignedTo, setAssignedTo] = React.useState(visit.assigned_to || "");
  const selectedMemberName = React.useMemo(() => {
    if (!assignedTo) return "Unassigned";
    const m = teamMembers.find(t => t.id === assignedTo);
    return m ? m.name : "Unassigned";
  }, [assignedTo, teamMembers]);
  
  const client = getClientData(visit);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const dateInput = formData.get('visit_date') as string;
    
    // ISO string from datetime-local
    const visit_date = dateInput ? new Date(dateInput).toISOString() : visit.visit_date;
    const assigned_to_val = formData.get('assigned_to') as string;
    const notes = formData.get('notes') as string;
    
    const update = {
      visit_date,
      assigned_to: assigned_to_val || null,
      notes: notes || null,
    };
    
    const res = await updateJobVisit(visit.id, update);
    setIsSubmitting(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success('Visit updated');
      setIsEditing(false);
      window.location.reload();
    }
  }

  if (isEditing) {
    return (
      <div className="bg-card">
        <div className="p-4 border-b border-border/10 bg-[#f8f9fa] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-teal-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Edit Visit</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Schedule</Label>
            <Input type="datetime-local" name="visit_date" defaultValue={format(parseISO(visit.visit_date), "yyyy-MM-dd'T'HH:mm")} className="h-9" />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Assigned To</Label>
            <Select name="assigned_to" value={assignedTo} onValueChange={(val) => setAssignedTo(val || "")}>
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder="Unassigned">
                  {selectedMemberName}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="z-[3000]">
                <SelectItem value="">Unassigned</SelectItem>
                {teamMembers.map(member => (
                   <SelectItem key={`member-${member.id}`} value={member.id}>{member.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Notes</Label>
            <Input name="notes" defaultValue={visit.notes || ''} className="h-9" />
          </div>
          <div className="pt-3 border-t border-border/10 flex gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="flex-1 font-bold h-9 text-xs">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-teal-600 hover:bg-teal-700 font-bold h-9 text-xs text-white">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Save
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-card">
      <div className="p-4 border-b border-border/10 bg-[#f8f9fa] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-teal-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Visit Details</span>
        </div>
        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 py-0 h-4.5 bg-teal-50 text-teal-700 border-teal-100">
          {visit.status}
        </Badge>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h4 className="text-lg font-bold text-foreground leading-tight">
            {visit.proformas?.project_name || 'Site Visit'}
          </h4>
          {visit.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{visit.notes}</p>}
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Schedule</p>
              <p className="text-sm font-semibold text-foreground">{format(parseISO(visit.visit_date), 'MMM d, p')}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Assigned to</p>
              <p className="text-sm font-semibold text-foreground">{visit.team_members?.name || 'Unassigned'}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Address</p>
              {getFullAddress(client) ? (
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getFullAddress(client))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                >
                  {getFullAddress(client)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <p className="text-sm font-semibold text-foreground">Unassigned</p>
              )}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-border/10 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="h-10 text-xs font-bold gap-2 hover:bg-muted/50 border-border/60"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit
            </Button>
            <a
              href={`/proforma/${visit.proforma_id}`}
              className={cn(buttonVariants({ variant: 'default' }), "h-10 text-xs font-bold gap-2 bg-[#306C3E] hover:bg-[#265832]")}
            >
              Go to job
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <DeleteConfirmModal
            title="Delete Visit?"
            description="Are you sure you want to delete this scheduled visit? This action cannot be undone."
            onConfirm={async () => {
              const res = await deleteJobVisit(visit.id);
              if (res.error) toast.error(res.error);
              else {
                toast.success('Visit deleted');
                window.location.reload();
              }
            }}
            trigger={
              <Button variant="ghost" className="w-full h-9 text-[10px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5 transition-colors">
                <Trash2 className="h-3 w-3" />
                Delete Visit
              </Button>
            }
          />
        </div>
      </div>
    </div>
  )
}

function VisitFormModal({ jobs, teamMembers, onClose, onSuccess }: { jobs: Job[], teamMembers: any[], onClose: () => void, onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedJobId, setSelectedJobId] = React.useState('');
  const [selectedTeamMember, setSelectedTeamMember] = React.useState('');
  const [comboboxOpen, setComboboxOpen] = React.useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    if (!selectedJobId) {
      toast.error('Please select a job');
      setIsSubmitting(false);
      return;
    }
    const rawValue = formData.get('visit_date'); // Ejemplo: "2026-04-06T14:00"
    const localDate = new Date(rawValue as string);

    // .toISOString() convierte CUALQUIER hora local a UTC automáticamente.
    // Si el usuario está en Perú (14:00), enviará "19:00Z"
    // Si el usuario está en Nueva York (14:00), enviará "18:00Z" (por el horario de verano)
    const dateToSave = localDate.toISOString();

    const { error } = await supabase
      .from('job_visits')
      .insert([{
        proforma_id: selectedJobId,
        assigned_to: formData.get('assigned_to'),
        visit_date: dateToSave,
        status: formData.get('status'),
        notes: formData.get('notes')
      }]);

    if (error) {
      toast.error('Error scheduling visit');
    } else {
      toast.success('Visit scheduled successfully');
      onSuccess();
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule New Visit</DialogTitle>
          <DialogDescription>Plan an on-site visit for a customer job.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="job_id">Select Job / Customer</Label>
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxOpen}
                    className="w-full justify-between font-normal h-10 hover:bg-background border-input"
                  >
                    {selectedJobId
                      ? (jobs.find((job) => job.id === selectedJobId)?.project_name || 'Project') + ' - ' + (
                        (() => {
                          const job = jobs.find((j) => j.id === selectedJobId);
                          const client = getClientData(job);
                          return client?.company_name || client?.name || 'Unknown Client';
                        })()
                      )
                      : "Select a project..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                }
              />
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-[1000]" align="start">
                <Command>
                  <CommandInput placeholder="Search projects..." />
                  <CommandList>
                    <CommandEmpty>No projects found.</CommandEmpty>
                    <CommandGroup>
                      {jobs.map((job) => {
                        const client = getClientData(job);
                        return (
                          <CommandItem
                            key={job.id}
                            value={`${job.project_name} ${client?.name || ''} ${job.number || ''} ${job.id}`}
                            onSelect={() => {
                              setSelectedJobId(job.id);
                              setComboboxOpen(false);
                            }}
                            className="flex flex-col items-start py-2"
                          >
                            <div className="flex w-full items-center justify-between">
                              <span className="font-bold text-sm">{job.project_name} - {job.number}</span>
                              {selectedJobId === job.id && <Check className="h-4 w-4" />}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {client?.company_name || client?.name}
                            </span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="w-full space-y-2">
            <Label htmlFor="assigned_to">Assign To</Label>
            <Select id="assigned_to" name="assigned_to" defaultValue={'unassigned'} onValueChange={(value) => { const member = teamMembers.find((member) => member.id === value); setSelectedTeamMember(member?.name || 'Unassigned'); }} disabled={isSubmitting}>
              <SelectTrigger
                id="proforma_id"
                className="w-full h-12"
              >
                <SelectValue placeholder="Unassigned">
                  {selectedTeamMember}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map(member => (
                  <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visit_date">Date & Time</Label>
              <Input id="visit_date" name="visit_date" type="datetime-local" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Visit instructions or details..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 font-bold text-primary-foreground" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Schedule Visit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
