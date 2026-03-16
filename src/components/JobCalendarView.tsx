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
  Edit2
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
  getDay
} from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface Job {
  id: string
  project_name: string
  job_start_at: string
  job_end_at: string
  clients: {
    name: string
    company_name?: string
  }
}

interface CalendarViewProps {
  jobs: Job[]
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function JobCalendarView({ jobs }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [view, setView] = React.useState<'month' | 'week' | 'day'>('week')

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

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

  // Calculate event position and height
  const getEventStyle = (start: string, end: string) => {
    const startDate = parseISO(start)
    const endDate = parseISO(end)

    // Minutes from start of day (midnight)
    const startMinutes = getHours(startDate) * 60 + getMinutes(startDate)
    const endMinutes = getHours(endDate) * 60 + getMinutes(endDate)
    const durationMinutes = Math.max(endMinutes - startMinutes, 30) // Min 30 mins

    // Each hour is 64px high (h-16)
    const top = (startMinutes / 60) * 64
    const height = (durationMinutes / 60) * 64

    return {
      top: `${top}px`,
      height: `${height}px`,
      minHeight: '24px'
    }
  }

  return (
    <div className="flex flex-col h-full bg-background border border-border/50 rounded-xl overflow-hidden shadow-xl animate-in fade-in duration-500">

      {/* Premium Header */}
      <header className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 bg-card border-b border-border/40 gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <h2 className="text-xl font-bold font-serif min-w-[150px]">
              {format(currentDate, view === 'month' ? 'MMMM yyyy' : 'MMMM yyyy', { locale: es }).replace(/^\w/, (c) => c.toUpperCase())}
            </h2>
            <div className="flex items-center bg-muted/30 rounded-lg p-0.5 border border-border/50">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={prev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={next}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" className="ml-2 h-9 font-medium" onClick={goToToday}>
              Hoy
            </Button>
          </div>

          <Button className="bg-[#306C3E] hover:bg-[#265832] text-white h-9 font-semibold gap-2 hidden lg:flex">
            <Plus className="h-4 w-4" />
            Encontrar Hora
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-muted/30 rounded-lg p-0.5 border border-border/50">
            {[
              { label: 'Mes', value: 'month' },
              { label: 'Semana', value: 'week' },
              { label: 'Día', value: 'day' }
            ].map((v) => (
              <Button
                key={v.value}
                variant={view === v.value ? 'secondary' : 'ghost'}
                size="sm"
                className={cn(
                  "h-8 px-4 text-xs font-semibold rounded-md transition-all",
                  view === v.value && "bg-background shadow-sm border border-border/20"
                )}
                onClick={() => setView(v.value as any)}
              >
                {v.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-1 border-l border-border/50 pl-3">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {view === 'month' ? (
          <MonthView jobs={jobs} currentDate={currentDate} />
        ) : view === 'week' ? (
          <WeekView jobs={jobs} currentDate={currentDate} days={days} getEventStyle={getEventStyle} />
        ) : (
          <DayView jobs={jobs} currentDate={currentDate} getEventStyle={getEventStyle} />
        )}

        {/* Right Panel - Unscheduled / Upcoming */}
        <aside className="hidden xl:flex w-72 flex-col border-l border-border/40 bg-card">
          <div className="p-4 border-b border-border/40 flex items-center justify-between">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground/80">Sin Programar</h3>
            <Badge variant="secondary" className="rounded-full h-5 px-1.5 min-w-[20px] justify-center text-[10px]">
              0
            </Badge>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground/60">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <CalendarIcon className="h-8 w-8 text-muted/30" />
            </div>
            <p className="text-sm font-medium leading-relaxed">
              Arrastra elementos aquí para quitarlos de la programación
            </p>
          </div>
        </aside>

      </div>
    </div>
  )
}

function WeekView({ jobs, currentDate, days, getEventStyle }: { jobs: Job[], currentDate: Date, days: Date[], getEventStyle: any }) {
  return (
    <div className="flex-1 flex flex-col bg-[#F9F9F7]">
      {/* Days Header */}
      <div className="flex border-b border-border/40 bg-[#F9F9F7]/95 backdrop-blur-md z-20">
        <div className="w-16 border-r border-border/40 shrink-0" />
        <div className="flex-1 grid grid-cols-7 ">
          {days.map((day) => (
            <div key={day.toString()} className="px-2 py-4 text-center border-r border-border/20 last:border-r-0">
              <div className={cn(
                "text-[10px] uppercase tracking-wider font-bold mb-1",
                isToday(day) ? "text-primary" : "text-muted-foreground/60"
              )}>
                {format(day, 'eee', { locale: es })}
              </div>
              <div className={cn(
                "text-xl font-serif font-bold h-10 w-10 flex items-center justify-center mx-auto rounded-full transition-all",
                isToday(day) ? "bg-primary text-primary-foreground shadow-md" : (isSameMonth(day, currentDate) ? "text-foreground" : "text-muted-foreground/40")
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time Grid - Scrollable */}
      <div className="flex-1 overflow-y-auto relative bg-[#F9F9F7]">
        <div className="flex min-h-[1536px]"> {/* 24 * 64px */}
          {/* Hour Labels Column */}
          <div className="w-16 border-r border-border/40 shrink-0 bg-[#F9F9F7] sticky left-0 z-10">
            {HOURS.map((hour) => (
              <div key={hour} className="h-16 -mt-3 pr-3 text-right text-[10px] font-bold text-muted-foreground/50 tabular-nums">
                {hour === 0 ? '' : `${hour}:00`}
              </div>
            ))}
          </div>

          {/* Grid Columns for Days */}
          <div className="flex-1 grid grid-cols-7 relative">
            {days.map((day) => {
              const dayJobs = jobs.filter(j => isSameDay(parseISO(j.job_start_at), day))
              return (
                <div key={day.toString()} className="relative border-r border-border/20 last:border-r-0">
                  {HOURS.map((hour) => (
                    <div key={hour} className="h-16 border-b border-border/10 last:border-b-0" />
                  ))}
                  {dayJobs.map((job) => (
                    <JobCard key={job.id} job={job} style={getEventStyle(job.job_start_at, job.job_end_at)} />
                  ))}
                </div>
              )
            })}

            {/* Current Time Indicator Line */}
            {days.some(day => isToday(day)) && (
              <div
                className="absolute left-0 right-0 border-t-2 border-primary z-10 pointer-events-none after:content-[''] after:absolute after:-left-1.5 after:-top-1.5 after:h-3 after:w-3 after:rounded-full after:bg-primary"
                style={{
                  top: `${(getHours(new Date()) * 60 + getMinutes(new Date())) / 60 * 64}px`,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function DayView({ jobs, currentDate, getEventStyle }: { jobs: Job[], currentDate: Date, getEventStyle: any }) {
  const dayJobs = jobs.filter(j => isSameDay(parseISO(j.job_start_at), currentDate))

  return (
    <div className="flex-1 flex flex-col bg-[#F9F9F7]">
      <div className="flex border-b border-border/40 bg-[#F9F9F7]/95 backdrop-blur-md z-20">
        <div className="w-16 border-r border-border/40 shrink-0" />
        <div className="flex-1 px-4 py-4">
          <div className="text-[10px] uppercase tracking-wider font-bold mb-1 text-primary">
            {format(currentDate, 'EEEE', { locale: es })}
          </div>
          <div className="text-xl font-serif font-bold">
            {format(currentDate, 'd MMMM yyyy', { locale: es })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative bg-[#F9F9F7]">
        <div className="flex min-h-[1536px]">
          <div className="w-16 border-r border-border/40 shrink-0 bg-[#F9F9F7] sticky left-0 z-10">
            {HOURS.map((hour) => (
              <div key={hour} className="h-16 -mt-3 pr-3 text-right text-[10px] font-bold text-muted-foreground/50 tabular-nums">
                {hour === 0 ? '' : `${hour}:00`}
              </div>
            ))}
          </div>

          <div className="flex-1 relative">
            {HOURS.map((hour) => (
              <div key={hour} className="h-16 border-b border-border/10 last:border-b-0" />
            ))}
            {dayJobs.map((job) => (
              <JobCard key={job.id} job={job} style={getEventStyle(job.job_start_at, job.job_end_at)} />
            ))}
            {isToday(currentDate) && (
              <div
                className="absolute left-0 right-0 border-t-2 border-primary z-10 pointer-events-none after:content-[''] after:absolute after:-left-1.5 after:-top-1.5 after:h-3 after:w-3 after:rounded-full after:bg-primary"
                style={{
                  top: `${(getHours(new Date()) * 60 + getMinutes(new Date())) / 60 * 64}px`,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MonthView({ jobs, currentDate }: { jobs: Job[], currentDate: Date }) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  return (
    <div className="flex-1 flex flex-col overflow-auto bg-[#F9F9F7]">
      <div className="grid grid-cols-7 border-b border-border/40 bg-[#F9F9F7]/95 backdrop-blur-md sticky top-0 z-20">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <div key={day} className="py-2 text-center text-[10px] uppercase font-bold text-muted-foreground/60 border-r border-border/10 last:border-r-0">
            {day}
          </div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7 min-h-0 bg-border/5">
        {calendarDays.map((day) => {
          const dayJobs = jobs.filter(j => isSameDay(parseISO(j.job_start_at), day))
          return (
            <div key={day.toString()} className={cn(
              "p-2 border-r border-b border-border/10 min-h-[120px] bg-background transition-colors hover:bg-muted/5",
              !isSameMonth(day, currentDate) && "bg-muted/10 opacity-40"
            )}>
              <div className={cn(
                "text-sm font-medium mb-1 h-7 w-7 flex items-center justify-center rounded-full",
                isToday(day) ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground"
              )}>
                {format(day, 'd')}
              </div>
              <div className="space-y-1 mt-1 overflow-y-auto max-h-[80px] scrollbar-hide">
                {dayJobs.map(job => (
                  <JobCardCompact key={job.id} job={job} />
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
      <PopoverTrigger>
        <div className="px-2 py-1 rounded bg-[#0D3B47] text-white text-[10px] font-bold truncate cursor-pointer hover:bg-[#144D5D] transition-all shadow-sm">
          {format(parseISO(job.job_start_at), 'HH:mm')} {job.project_name}
        </div>
      </PopoverTrigger>
      <PopoverContent className="z-50 w-80 p-0 overflow-hidden border-none shadow-2xl rounded-xl" side="bottom" align="center" sideOffset={10}>
        <JobDetailContent job={job} />
      </PopoverContent>
    </Popover>
  )
}

function JobCard({ job, style }: { job: Job, style: React.CSSProperties }) {
  return (
    <Popover>
      <PopoverTrigger>
        <div
          className="absolute left-1 right-1 rounded-lg bg-[#0D3B47] text-white p-2 text-xs overflow-hidden shadow-md group cursor-pointer hover:bg-[#144D5D] transition-all hover:scale-[1.02] hover:z-30 border border-white/10"
          style={style}
          onClick={(e) => e.stopPropagation()} // Prevent accidental column clicks
        >
          <div className="font-bold truncate leading-tight">
            {job.project_name}
          </div>
          <div className="text-[10px] opacity-80 font-medium flex items-center mt-1">
            <Clock className="h-3 w-3 mr-1 shrink-0" />
            {format(parseISO(job.job_start_at), 'HH:mm')}
          </div>
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Maximize2 className="h-3 w-3 text-white/60" />
          </div>
        </div>
      </PopoverTrigger>
      {/* Portalled popover content with controlled side/align */}
      <PopoverContent className="z-50 w-80 p-0 overflow-hidden border-none shadow-2xl rounded-xl" side="right" align="start" sideOffset={12}>
        <JobDetailContent job={job} />
      </PopoverContent>
    </Popover>
  )
}

function JobDetailContent({ job }: { job: Job }) {
  return (
    <div className="bg-white">
      {/* Popover Header */}
      <div className="p-4 border-b border-border/10 bg-[#f8f9fa] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#0D3B47]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Detalle del Job</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>

      <div className="p-5 space-y-5">
        <div>
          <h4 className="text-lg font-bold text-[#0D3B47] leading-tight mb-1">{job.project_name}</h4>
          <Badge variant="outline" className="text-[10px] font-bold bg-green-50 text-green-700 border-green-200 gap-1.2 py-0 h-5">
            <CheckCircle2 className="h-3 w-3" />
            En Progreso
          </Badge>
        </div>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Cliente</p>
              <p className="text-sm font-semibold text-foreground">{job.clients?.company_name || job.clients?.name}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div className="grid grid-cols-2 gap-x-8">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Inicio</p>
                <p className="text-sm font-semibold text-foreground">{format(parseISO(job.job_start_at), 'MMM d, p')}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Fin</p>
                <p className="text-sm font-semibold text-foreground">{format(parseISO(job.job_end_at), 'MMM d, p')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <a
            href={`/proforma/${job.id}`}
            className={cn(buttonVariants({ variant: 'outline' }), "h-10 text-xs font-bold gap-2 hover:bg-muted/50 border-border/60")}
          >
            <Edit2 className="h-3.5 w-3.5" />
            Editar
          </a>
          <a
            href={`/proforma/${job.id}`}
            className={cn(buttonVariants({ variant: 'default' }), "h-10 text-xs font-bold gap-2 bg-[#306C3E] hover:bg-[#265832]")}
          >
            Ver Detalles
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  )
}
