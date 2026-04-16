'use client';

import React, { useMemo, useState } from 'react';
import { format, addDays, startOfWeek, addWeeks, isSameDay, isBefore, isAfter, differenceInDays } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { User, Calendar, Briefcase, CheckCircle2, CircleDashed, ChevronRight, ChevronDown, Plus, Trash2, Loader2, Sparkles, Tag, PanelLeft, PanelLeftClose, Pencil, Palette, Flag, Copy, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "@/components/ui/context-menu";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  due_date: string | null; // Used as Start Date
  end_date: string | null; // Used as End Date
  percentage?: number;
  color?: string;
  team_members?: { name: string; id: string };
  proforma_item_id?: string | null;
  proforma_items?: { id: string; description: string } | null;
  proformas?: {
    id: string;
    project_name: string;
    status: string;
    clients?: { company_name?: string, name?: string, last_name?: string }
  };
}

interface ProjectGroup {
  projectId: string;
  projectName: string;
  clientName: string;
  status: string;
  tasks: Task[];
  startDate: Date;
  endDate: Date;
}

const PREDEFINED_COLORS = [
  { name: 'Emerald', value: '#10b981' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Indigo', value: '#6366f1' },
];

const ProgressCircle = ({ percent, color, colorClass }: { percent: number, color?: string, colorClass?: string }) => {
  const radius = 6.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = Math.max(0, circumference - (percent / 100) * circumference);

  return (
    <svg width="18" height="18" viewBox="0 0 18 18" className="transform -rotate-90 shrink-0">
      <circle
        cx="9" cy="9" r={radius}
        stroke="currentColor" strokeWidth="2.5" fill="none"
        className="text-muted-foreground/20"
      />
      {percent > 0 && (
        <circle
          cx="9" cy="9" r={radius}
          stroke="currentColor" strokeWidth="2.5" fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn("transition-all duration-500 ease-out", colorClass)}
          style={color ? { color } : undefined}
        />
      )}
    </svg>
  );
};

export default function GlobalGanttChart({
  tasks,
  teamMembers,
  proformaItems,
  activeJobs
}: {
  tasks: Task[],
  teamMembers: any[],
  proformaItems: any[],
  activeJobs: any[]
}) {
  const router = useRouter();
  const supabase = createClient();
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [addingTaskForProject, setAddingTaskForProject] = useState<string | null>(null);
  const [selectedProjectFilters, setSelectedProjectFilters] = useState<string[]>([]);

  // New States for AI and Editing
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    const { error } = await supabase.from('job_tasks').delete().eq('id', taskId);
    if (error) {
      toast.error('Error deleting task');
    } else {
      toast.success('Task deleted');
      router.refresh();
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const newPercentage = newStatus === 'completed' ? 100 : 0;
    const { error } = await supabase.from('job_tasks').update({ status: newStatus, percentage: newPercentage }).eq('id', task.id);
    if (error) {
      toast.error('Error updating status');
    } else {
      router.refresh();
      toast.success(newStatus === 'completed' ? 'Task completed' : 'Task pending');
    }
  };

  const handleUpdatePercentage = async (task: Task, percentage: number) => {
    const status = percentage === 100 ? 'completed' : 'pending';
    const { error } = await supabase.from('job_tasks').update({ percentage, status }).eq('id', task.id);
    if (error) {
      toast.error('Error updating progress');
    } else {
      router.refresh();
      toast.success('Progress updated');
    }
  };

  const handleUpdateColor = async (task: Task, color: string) => {
    const { error } = await supabase.from('job_tasks').update({ color }).eq('id', task.id);
    if (error) {
      toast.error('Error updating color');
    } else {
      router.refresh();
      toast.success('Color updated');
    }
  };

  // 1. Process tasks into projects
  const { projects, timelineStart, timelineEnd, allProjects } = useMemo(() => {
    let globalStart = new Date();
    let globalEnd = addDays(new Date(), 30);
    const projMap = new Map<string, ProjectGroup>();
    const uniqueProjectsMap = new Map<string, { id: string, name: string }>();

    // Parse all active jobs first so empty ones show up
    activeJobs.forEach(job => {
      uniqueProjectsMap.set(job.id, { id: job.id, name: job.project_name || 'Unnamed' });

      const client = job.clients;
      const clientName = client ? (client.company_name || [client.name, client.last_name].filter(Boolean).join(' ') || 'Unknown Client') : 'No Client';

      const start = job.job_start_at ? new Date(job.job_start_at) : new Date();
      const end = job.job_end_at ? new Date(job.job_end_at) : addDays(start, 30);

      projMap.set(job.id, {
        projectId: job.id,
        projectName: job.project_name || 'Unnamed',
        clientName: clientName,
        status: job.status,
        tasks: [],
        startDate: start,
        endDate: end
      });

      if (isBefore(start, globalStart)) globalStart = start;
      if (isAfter(end, globalEnd)) globalEnd = end;
    });

    tasks.forEach(task => {
      // Collect unique projects for the AI modal dropdown
      if (task.proformas) {
        uniqueProjectsMap.set(task.proformas.id, { id: task.proformas.id, name: task.proformas.project_name });
      }

      // Ignore tasks without at least a start date
      if (!task.due_date) return;

      const start = new Date(task.due_date);
      // Default duration is 1 day if end_date doesn't exist or is invalid
      const end = task.end_date ? new Date(task.end_date) : addDays(start, 1);

      // Expand global bounds
      if (isBefore(start, globalStart)) globalStart = start;
      if (isAfter(end, globalEnd)) globalEnd = end;

      const pId = task.proformas?.id || 'unassigned';
      if (!projMap.has(pId)) {
        const client = task.proformas?.clients;
        const clientName = client ? (client.company_name || [client.name, client.last_name].filter(Boolean).join(' ') || 'Unknown Client') : 'No Client';

        projMap.set(pId, {
          projectId: pId,
          projectName: task.proformas?.project_name || 'Tasks without Project',
          clientName: clientName,
          status: task.proformas?.status || 'draft',
          tasks: [],
          startDate: start,
          endDate: end
        });
      }

      const pGroup = projMap.get(pId)!;
      pGroup.tasks.push(task);
      if (isBefore(start, pGroup.startDate)) pGroup.startDate = start;
      if (isAfter(end, pGroup.endDate)) pGroup.endDate = end;
    });

    // Pad timeline viewing bounds
    const startOfWeekBound = startOfWeek(addWeeks(globalStart, -1), { weekStartsOn: 1 });
    const endOfWeekBound = startOfWeek(addWeeks(globalEnd, +2), { weekStartsOn: 1 });

    return {
      projects: Array.from(projMap.values()).sort((a, b) => a.startDate.getTime() - b.startDate.getTime()),
      timelineStart: startOfWeekBound,
      timelineEnd: endOfWeekBound,
      allProjects: Array.from(uniqueProjectsMap.values())
    };
  }, [tasks, activeJobs]);

  const filteredProjects = useMemo(() => {
    return projects.filter(proj =>
      selectedProjectFilters.length === 0 || selectedProjectFilters.includes(proj.projectId)
    );
  }, [projects, selectedProjectFilters]);

  const toggleProjectFilter = (pId: string) => {
    setSelectedProjectFilters(prev =>
      prev.includes(pId) ? prev.filter(id => id !== pId) : [...prev, pId]
    );
  };

  // Generate Array of days for styling headers
  const daysInTimeline = differenceInDays(timelineEnd, timelineStart) + 1;
  const daysArr = Array.from({ length: daysInTimeline }).map((_, i) => addDays(timelineStart, i));

  const toggleProject = (pId: string) => {
    setExpandedProjects(prev => ({ ...prev, [pId]: prev[pId] !== undefined ? !prev[pId] : false }));
  };

  const isProjectExpanded = (pId: string) => {
    return expandedProjects[pId] !== false; // Default true
  };

  const DAY_WIDTH = 48; // fixed width per day
  const timelineWidthPx = daysInTimeline * DAY_WIDTH;

  const getTaskLeftPx = (date: Date) => {
    const diff = differenceInDays(date, timelineStart);
    return Math.max(0, diff * DAY_WIDTH);
  };

  const getTaskWidthPx = (start: Date, end: Date) => {
    // Ensure both dates start at midnight for accurate day diffs
    const s = new Date(start); s.setHours(0, 0, 0, 0);
    const e = new Date(end); e.setHours(0, 0, 0, 0);
    const duration = differenceInDays(e, s) + 1; // inclusive of end day
    return duration * DAY_WIDTH;
  };

  if (filteredProjects.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-muted-foreground bg-muted/5 relative">
        <Calendar className="h-12 w-12 mb-4 opacity-50" />
        <p className="font-medium">No active projects to display.</p>
        <p className="text-sm opacity-70">Adjust filters or add new tasks.</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col h-[70vh] bg-[#fafafa]">
      {/* Header Controls */}
      <div className="bg-card px-6 py-4 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 border border-border/40 bg-card rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-colors"
          >
            {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            {tasks.length} Total Tasks
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {filteredProjects.length} Projects
          </Badge>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 text-xs">
              {selectedProjectFilters.length === 0
                ? 'View All Projects'
                : `${selectedProjectFilters.length} Selected Projects`}
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[240px]">
              <div className="px-2 py-1.5 text-sm font-semibold text-foreground">Filter by Project</div>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={selectedProjectFilters.length === 0}
                onCheckedChange={() => setSelectedProjectFilters([])}
                className="font-bold"
              >
                All Projects
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto">
                {allProjects.map(p => (
                  <DropdownMenuCheckboxItem
                    key={p.id}
                    checked={selectedProjectFilters.includes(p.id)}
                    onCheckedChange={() => toggleProjectFilter(p.id)}
                  >
                    {p.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          {/*<Button
            onClick={() => setAiModalOpen(true)}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium pl-3 rounded-xl"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate AI Tasks
          </Button>*/}
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-card relative no-scrollbar">
        <div className="flex min-w-max min-h-max">
          {/* Left Sidebar Table */}
          <div className={cn(
            "shrink-0 border-r border-border/40 bg-card sticky left-0 z-30 flex flex-col transition-all duration-300",
            isSidebarOpen ? "w-[480px] md:w-[560px]" : "w-0 opacity-0 overflow-hidden border-r-0"
          )}>
            {/* Header */}
            <div className="h-14 border-b border-border/40 bg-card sticky top-0 flex items-center px-4 shrink-0 z-40 gap-4">
              <div className="flex-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Contributor</div>
              <div className="w-[100px] text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Status</div>
              <div className="w-[120px] text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Date range</div>
            </div>

            <div className="pb-8">
              {filteredProjects.map(proj => {
                const startStr = format(proj.startDate, 'MMM d');
                const endStr = format(proj.endDate, 'd');

                return (
                  <React.Fragment key={proj.projectId}>
                    {/* Project Group Row */}
                    <div
                      className="border-b border-border/40 bg-card flex items-stretch group cursor-pointer hover:bg-muted/5 transition-colors h-[52px]"
                      onClick={() => toggleProject(proj.projectId)}
                    >
                      <div className="flex-1 px-4 flex items-center gap-2 overflow-hidden">
                        <div className="text-muted-foreground transition-colors shrink-0">
                          {isProjectExpanded(proj.projectId) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                        <h3 className="font-bold text-foreground text-sm truncate">{proj.projectName}</h3>
                      </div>
                      <div className="w-[100px] flex items-center px-4 border-l border-border/10 shrink-0">
                        <div className="flex items-center gap-3 w-full">
                          <span className="text-[11px] font-bold text-foreground text-right flex-1 select-none">
                            {proj.tasks.length > 0
                              ? Math.round((proj.tasks.reduce((sum, t) => sum + (typeof t.percentage === 'number' ? t.percentage : (t.status === 'completed' ? 100 : 0)), 0) / proj.tasks.length))
                              : 0}%
                          </span>
                          <ProgressCircle
                            percent={proj.tasks.length > 0 ? (proj.tasks.reduce((sum, t) => sum + (typeof t.percentage === 'number' ? t.percentage : (t.status === 'completed' ? 100 : 0)), 0) / proj.tasks.length) : 0}
                            colorClass="text-blue-500"
                          />
                        </div>
                      </div>
                      <div className="w-[120px] flex items-center px-3 border-l border-border/10">
                        <span className="text-xs text-muted-foreground truncate">{startStr} - {endStr}</span>
                      </div>
                    </div>

                    {/* Task Rows */}
                    {isProjectExpanded(proj.projectId) && proj.tasks.map(task => {
                      const tStart = task.due_date ? new Date(task.due_date) : new Date();
                      const tEnd = task.end_date ? new Date(task.end_date) : addDays(tStart, 1);
                      const tStartStr = format(tStart, 'MMM d');
                      const isDiffMonth = tStart.getMonth() !== tEnd.getMonth();
                      const tEndStr = format(tEnd, isDiffMonth ? 'MMM d' : 'd');
                      const isCompleted = task.status === 'completed';
                      const taskPercent = typeof task.percentage === 'number' ? task.percentage : (isCompleted ? 100 : 0);
                      const taskColor = task.color || (isCompleted ? '#10b981' : '#f59e0b');

                      return (
                        <ContextMenu key={task.id}>
                          <ContextMenuTrigger className="h-[56px] border-b border-border/20 flex items-stretch group hover:bg-muted/5 transition-colors bg-card w-full">
                            <div className="flex-1 pl-10 pr-4 flex items-center gap-3 overflow-hidden">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleToggleStatus(task); }}
                                className="focus:outline-none transition-transform active:scale-95 shrink-0"
                                title={isCompleted ? 'Mark as pending' : 'Mark as completed'}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500 hover:text-emerald-600" />
                                ) : (
                                  <CircleDashed className="h-4 w-4 text-muted-foreground hover:text-emerald-500" />
                                )}
                              </button>
                              <div className="flex-1 flex flex-col justify-center overflow-hidden">
                                <p
                                  className="text-sm font-medium text-foreground truncate cursor-pointer hover:underline"
                                  onClick={() => setEditingTask(task)}
                                >
                                  {task.title}
                                </p>
                                {task.team_members && (
                                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                    {task.team_members.name}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                                className="ml-auto opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0"
                                title="Delete task"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="w-[100px] flex items-center px-4 border-l border-border/10 shrink-0">
                              <div className="flex items-center gap-3 w-full">
                                <span className="text-[11px] font-bold text-right flex-1 select-none text-foreground">
                                  {taskPercent}%
                                </span>
                                <ProgressCircle
                                  percent={taskPercent}
                                  color={taskColor}
                                />
                              </div>
                            </div>
                            <div className="w-[120px] flex items-center px-3 border-l border-border/10 shrink-0">
                              <span className="text-xs text-muted-foreground truncate">{tStartStr} - {tEndStr}</span>
                            </div>
                          </ContextMenuTrigger>
                          <ContextMenuContent className="w-56 font-manrope">
                            <ContextMenuItem onClick={() => handleToggleStatus(task)}>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              <span>{isCompleted ? 'Mark as pending' : 'Mark as done'}</span>
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => setEditingTask(task)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </ContextMenuItem>
                            <ContextMenuSub>
                              <ContextMenuSubTrigger>
                                <Palette className="mr-2 h-4 w-4" />
                                <span>Color</span>
                              </ContextMenuSubTrigger>
                              <ContextMenuSubContent className="w-32">
                                {PREDEFINED_COLORS.map(c => (
                                  <ContextMenuItem key={c.value} onClick={() => handleUpdateColor(task, c.value)}>
                                    <div className="w-3 h-3 rounded-xl mr-2" style={{ backgroundColor: c.value }} />
                                    <span>{c.name}</span>
                                  </ContextMenuItem>
                                ))}
                              </ContextMenuSubContent>
                            </ContextMenuSub>
                            <ContextMenuSub>
                              <ContextMenuSubTrigger>
                                <Flag className="mr-2 h-4 w-4" />
                                <span>Progress</span>
                              </ContextMenuSubTrigger>
                              <ContextMenuSubContent className="w-32">
                                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(perc => (
                                  <ContextMenuItem
                                    key={perc}
                                    onClick={() => handleUpdatePercentage(task, perc)}
                                  >
                                    {perc}%
                                  </ContextMenuItem>
                                ))}
                              </ContextMenuSubContent>
                            </ContextMenuSub>
                            <ContextMenuItem onClick={() => toast.info('To duplicate, create a new task')}>
                              <Copy className="mr-2 h-4 w-4" />
                              <span>Duplicate</span>
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?task=${task.id}`);
                              toast.success('Link copied');
                            }}>
                              <LinkIcon className="mr-2 h-4 w-4" />
                              <span>Copy link</span>
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem
                              className="text-red-500 focus:text-red-500 focus:bg-red-50"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      );
                    })}

                    {/* Add Task Button Row */}
                    {isProjectExpanded(proj.projectId) && (
                      <div className="h-[48px] border-b border-border/20 flex items-stretch bg-card">
                        <div className="flex-1 pl-10 pr-4 flex items-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); setAddingTaskForProject(proj.projectId); }}
                            className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" /> Add task
                          </button>
                        </div>
                        <div className="w-[100px] border-l border-border/10 flex items-center px-3"></div>
                        <div className="w-[120px] border-l border-border/10 flex items-center px-3"></div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Right Timelines Area */}
          <div className="flex-1 bg-card relative z-10" style={{ width: `${timelineWidthPx}px`, minWidth: `${timelineWidthPx}px` }}>
            {/* Timeline Header */}
            <div className="h-14 border-b border-border/40 bg-card sticky top-0 flex items-end relative z-20">
              <div className="absolute inset-0 flex">
                {daysArr.map((day, i) => {
                  const isToday = isSameDay(day, new Date());
                  const isFirstOfMonth = day.getDate() === 1;
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "flex shrink-0 flex-col justify-end pb-2 relative",
                        isWeekend && "bg-muted/10",
                        isToday && "bg-emerald-50/20"
                      )}
                      style={{ width: `${DAY_WIDTH}px` }}
                    >
                      {/* Month label */}
                      {(isFirstOfMonth || i === 0) && (
                        <div className="absolute top-2 left-2 text-[11px] font-bold text-foreground whitespace-nowrap z-20">
                          {format(day, 'MMMM')}
                        </div>
                      )}
                      <div className="flex flex-col items-center">
                        <span className={cn(
                          "text-[10px] font-bold",
                          isToday ? "text-emerald-600" : "text-muted-foreground"
                        )}>
                          {format(day, 'dd')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timelines Body */}
            <div className="relative pb-8 h-full">
              {/* Background vertical division grid */}
              <div className="absolute inset-0 flex pointer-events-none">
                {daysArr.map(day => (
                  <div
                    key={`bg-${day.toISOString()}`}
                    className={cn(
                      "shrink-0 h-full border-r border-border/40",
                      (day.getDay() === 0 || day.getDay() === 6) && "bg-muted/5",
                      isSameDay(day, new Date()) && "border-r-emerald-500/20"
                    )}
                    style={{ width: `${DAY_WIDTH}px` }}
                  />
                ))}
              </div>

              {/* Today line indicator */}
              <div
                className="absolute top-0 bottom-0 border-l border-indigo-500 z-10 pointer-events-none"
                style={{ left: `${getTaskLeftPx(new Date()) + (DAY_WIDTH / 2)}px` }}
              >
                <div className="absolute top-0 -translate-x-1/2 w-1.5 h-1.5 rounded-xl bg-indigo-500" />
              </div>

              {/* Rows */}
              <div className="relative z-20">
                {filteredProjects.map(proj => (
                  <React.Fragment key={`timeline-${proj.projectId}`}>
                    {/* Project empty track row */}
                    <div className="h-[52px] border-b border-border/40 relative flex items-center group">
                      {/* Project wrapper bar */}
                      <div
                        className="absolute h-1 bg-indigo-500/20 rounded-xl pointer-events-none transition-colors group-hover:bg-indigo-500/30"
                        style={{
                          left: `${getTaskLeftPx(proj.startDate) + DAY_WIDTH / 2}px`,
                          width: `${Math.max(0, getTaskWidthPx(proj.startDate, proj.endDate) - DAY_WIDTH)}px`
                        }}
                      />
                    </div>

                    {/* Tasks */}
                    {isProjectExpanded(proj.projectId) && proj.tasks.map(task => {
                      const start = new Date(task.due_date!);
                      const end = task.end_date ? new Date(task.end_date) : addDays(start, 1);
                      const isCompleted = task.status === 'completed';
                      const taskColor = task.color || undefined;

                      return (
                        <ContextMenu key={`track-${task.id}`}>
                          <ContextMenuTrigger className="h-[56px] border-b border-border/20 relative group hover:bg-muted/5 transition-colors flex items-center w-full">
                            {/* Task Bar */}
                            <div
                              className={cn(
                                "absolute rounded-xl h-4 cursor-pointer transition-all hover:brightness-95",
                                !taskColor && (isCompleted ? "bg-emerald-400" : "bg-amber-400")
                              )}
                              style={{
                                backgroundColor: taskColor,
                                left: `${getTaskLeftPx(start) + DAY_WIDTH / 2}px`,
                                width: `${Math.max(DAY_WIDTH / 2, getTaskWidthPx(start, end) - DAY_WIDTH / 2)}px`
                              }}
                              title={`${task.title} (${format(start, 'd MMM')} - ${format(end, 'd MMM')})`}
                              onClick={() => setEditingTask(task)}
                            />
                          </ContextMenuTrigger>
                          <ContextMenuContent className="w-56 font-manrope">
                            <ContextMenuItem onClick={() => handleToggleStatus(task)}>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              <span>{isCompleted ? 'Mark as pending' : 'Mark as done'}</span>
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => setEditingTask(task)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </ContextMenuItem>
                            <ContextMenuSub>
                              <ContextMenuSubTrigger>
                                <Palette className="mr-2 h-4 w-4" />
                                <span>Color</span>
                              </ContextMenuSubTrigger>
                              <ContextMenuSubContent className="w-32">
                                {PREDEFINED_COLORS.map(c => (
                                  <ContextMenuItem key={c.value} onClick={() => handleUpdateColor(task, c.value)}>
                                    <div className="w-3 h-3 rounded-xl mr-2" style={{ backgroundColor: c.value }} />
                                    <span>{c.name}</span>
                                  </ContextMenuItem>
                                ))}
                              </ContextMenuSubContent>
                            </ContextMenuSub>
                            <ContextMenuSub>
                              <ContextMenuSubTrigger>
                                <Flag className="mr-2 h-4 w-4" />
                                <span>Progress</span>
                              </ContextMenuSubTrigger>
                              <ContextMenuSubContent className="w-32">
                                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(perc => (
                                  <ContextMenuItem
                                    key={perc}
                                    onClick={() => handleUpdatePercentage(task, perc)}
                                  >
                                    {perc}%
                                  </ContextMenuItem>
                                ))}
                              </ContextMenuSubContent>
                            </ContextMenuSub>
                            <ContextMenuItem onClick={() => toast.info('To duplicate, create a new task')}>
                              <Copy className="mr-2 h-4 w-4" />
                              <span>Duplicate</span>
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?task=${task.id}`);
                              toast.success('Link copied');
                            }}>
                              <LinkIcon className="mr-2 h-4 w-4" />
                              <span>Copy link</span>
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem
                              className="text-red-500 focus:text-red-500 focus:bg-red-50"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      )
                    })}

                    {/* Empty row for the Add Task button */}
                    {isProjectExpanded(proj.projectId) && (
                      <div className="h-[48px] border-b border-border/20" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {addingTaskForProject && (
        <TaskFormModal
          proformaId={addingTaskForProject === 'default' ? null : addingTaskForProject}
          teamMembers={teamMembers}
          proformaItems={proformaItems}
          allProjects={allProjects}
          onClose={() => setAddingTaskForProject(null)}
          onSuccess={() => { setAddingTaskForProject(null); router.refresh(); }}
        />
      )}

      {editingTask && (
        <TaskFormModal
          proformaId={editingTask.proformas?.id || null}
          teamMembers={teamMembers}
          proformaItems={proformaItems}
          allProjects={allProjects}
          taskToEdit={editingTask}
          onClose={() => setEditingTask(null)}
          onSuccess={() => { setEditingTask(null); router.refresh(); }}
        />
      )}

      {aiModalOpen && (
        <AiTaskGeneratorModal
          projects={allProjects}
          onClose={() => setAiModalOpen(false)}
          onSuccess={() => { setAiModalOpen(false); router.refresh(); }}
        />
      )}

    </div>
  );
}

// ----------------------------------------------------------------------------
// Task Form Modal for CREATE and EDIT
function TaskFormModal({
  proformaId,
  teamMembers,
  proformaItems,
  allProjects,
  taskToEdit,
  onClose,
  onSuccess
}: {
  proformaId: string | null;
  teamMembers: any[];
  proformaItems: any[];
  allProjects: { id: string, name: string }[];
  taskToEdit?: Task | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(proformaId || (taskToEdit?.proformas?.id || ''));
  const supabase = createClient();

  const isEdit = !!taskToEdit;



  // Filter proforma items based on currently selected project
  // Useful if editing or creating unassociated task and we decide to switch projects
  const availableItems = proformaItems.filter(p => p.proforma_id === selectedProjectId);

  console.log('availableItems', availableItems);

  // Format dates for the native date-time picker (YYYY-MM-DDThh:mm)
  const formatForInput = (isoString?: string | null) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const finalProformaId = selectedProjectId;
    if (!finalProformaId) {
      toast.error('You must select a project');
      setIsSubmitting(false);
      return;
    }

    const dueDateStr = formData.get('due_date') as string;
    const endDateStr = formData.get('end_date') as string;

    const payload = {
      proforma_id: finalProformaId,
      assigned_to: (formData.get('assigned_to') as string) || null,
      proforma_item_id: (formData.get('proforma_item_id') as string) || null,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      due_date: dueDateStr ? new Date(dueDateStr).toISOString() : null,
      end_date: endDateStr ? new Date(endDateStr).toISOString() : null,
      status: taskToEdit ? taskToEdit.status : 'pending' // Preserve status on update
    };

    let error;

    if (isEdit && taskToEdit) {
      const { error: updateError } = await supabase
        .from('job_tasks')
        .update(payload)
        .eq('id', taskToEdit.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('job_tasks')
        .insert([payload]);
      error = insertError;
    }

    if (error) {
      toast.error(isEdit ? 'Error updating task' : 'Error creating task');
    } else {
      toast.success(isEdit ? 'Task updated' : 'Task created successfully');
      onSuccess();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md shadow-2xl border-none h-fit max-h-[90vh] overflow-y-auto">
        <CardHeader className="rounded-t-xl sticky top-0 z-10">
          <CardTitle className="text-3xl font-bold font-archivo">{isEdit ? 'Edit Task' : 'New Scheduled Task'}</CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-card rounded-b-xl border border-t-0 border-border/40">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="space-y-2">
              <Label htmlFor="proforma_id">Project</Label>
              <select
                id="proforma_id"
                name="proforma_id"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                required
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                disabled={isEdit && !!proformaId} // Disable if editing and locked to a project
              >
                <option value="">Select Project...</option>
                {allProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proforma_item_id">Associated Item (Optional)</Label>
              <select
                id="proforma_item_id"
                name="proforma_item_id"
                defaultValue={taskToEdit?.proforma_item_id || ''}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={!selectedProjectId}
              >
                <option value="">Unassociated (General Task)</option>
                {availableItems.map(item => (
                  <option key={item.id} value={item.id}>{item.description}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Task Title</Label>
              <Input id="title" name="title" placeholder="Ex: Buy paint" defaultValue={taskToEdit?.title || ''} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_to">Assign to</Label>
              <select
                id="assigned_to"
                name="assigned_to"
                defaultValue={taskToEdit?.team_members?.id || ''}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Unassigned</option>
                {teamMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="due_date">Start Date</Label>
                <Input id="due_date" name="due_date" type="datetime-local" defaultValue={formatForInput(taskToEdit?.due_date)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input id="end_date" name="end_date" type="datetime-local" defaultValue={formatForInput(taskToEdit?.end_date)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <textarea
                id="description"
                name="description"
                defaultValue={taskToEdit?.description || ''}
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Additional details..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" className="h-10 px-6 rounded-lg font-bold" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" className="h-10 px-6 rounded-lg font-bold" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEdit ? 'Save Changes' : 'Create Task')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ----------------------------------------------------------------------------
// AI Task Generator Modal
function AiTaskGeneratorModal({
  projects,
  onClose,
  onSuccess
}: {
  projects: { id: string, name: string }[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const supabase = createClient();

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsGenerating(true);

    const formData = new FormData(e.currentTarget);
    const projectId = formData.get('project_id') as string;
    const projectNameStr = projects.find(p => p.id === projectId)?.name || 'Proyecto';
    const description = formData.get('description') as string;
    const startDate = formData.get('start_date') as string;

    if (!projectId) {
      toast.error('Select a project');
      setIsGenerating(false);
      return;
    }

    try {
      // 1. Call AI endpoint
      toast.info('Analyzing project and generating tasks...', { duration: 4500 });
      const res = await fetch('/api/tasks/generate', {
        method: 'POST',
        body: JSON.stringify({
          projectId,
          projectName: projectNameStr,
          projectDescription: description,
          startDate: startDate || new Date().toISOString()
        })
      });

      if (!res.ok) throw new Error('Error in AI service');
      const data = await res.json();
      const generatedTasks = data.tasks;

      if (!generatedTasks || generatedTasks.length === 0) {
        throw new Error('No tasks generated');
      }

      // 2. Insert Tasks into Supabase
      const payload = generatedTasks.map((t: any) => ({
        proforma_id: projectId,
        title: t.title,
        description: t.description || '',
        status: 'pending',
        assigned_to: null,
        proforma_item_id: t.proforma_item_id || null, // Optional item association from AI
        due_date: new Date(t.due_date).toISOString(),
        end_date: new Date(t.end_date).toISOString(),
      }));

      const { error } = await supabase.from('job_tasks').insert(payload);
      if (error) throw error;

      toast.success(`${generatedTasks.length} tasks generated successfully!`);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error('There was an error generating tasks with AI.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md shadow-2xl border-none overflow-hidden h-fit max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-indigo-600 text-white sticky top-0 z-10">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> Auto-Generate AI Tasks
          </CardTitle>
          <CardDescription className="text-indigo-100">
            OpenAI will analyze your project and build a schedule.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 bg-card">
          <form onSubmit={handleGenerate} className="space-y-4">

            <div className="space-y-2">
              <Label htmlFor="project_id">Select the Project</Label>
              <select
                id="project_id"
                name="project_id"
                required
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose project...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground">AI will review ALL products or services (Line Items) sold in this project to create specific tasks.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Approximate Start Date</Label>
              <Input id="start_date" name="start_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Additional AI Instructions (Optional)</Label>
              <textarea
                id="description"
                name="description"
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ex: Full bathroom remodel and secondary rooms painting..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" className="h-10 px-6 rounded-lg font-bold" onClick={onClose} disabled={isGenerating}>
                Cancel
              </Button>
              <Button type="submit" className="h-10 px-6 rounded-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isGenerating}>
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                {isGenerating ? 'Generating...' : 'Autocomplete Tasks'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
