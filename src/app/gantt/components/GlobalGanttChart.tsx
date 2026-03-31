'use client';

import React, { useMemo, useState } from 'react';
import { format, addDays, startOfWeek, addWeeks, isSameDay, isBefore, isAfter, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { User, Calendar, Briefcase, CheckCircle2, CircleDashed, ChevronRight, ChevronDown, Plus, Trash2, Loader2, Sparkles, Tag } from 'lucide-react';
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

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  due_date: string | null; // Used as Start Date
  end_date: string | null; // Used as End Date
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

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta tarea?")) return;
    const { error } = await supabase.from('job_tasks').delete().eq('id', taskId);
    if (error) {
      toast.error('Error al eliminar tarea');
    } else {
      toast.success('Tarea eliminada');
      router.refresh();
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const { error } = await supabase.from('job_tasks').update({ status: newStatus }).eq('id', task.id);
    if (error) {
      toast.error('Error al actualizar estado');
    } else {
      router.refresh();
      toast.success(newStatus === 'completed' ? 'Tarea completada' : 'Tarea pendiente');
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
      uniqueProjectsMap.set(job.id, { id: job.id, name: job.project_name || 'Sin Nombre' });
      
      const client = job.clients;
      const clientName = client ? (client.company_name || [client.name, client.last_name].filter(Boolean).join(' ') || 'Unknown Client') : 'No Client';
      
      const start = job.job_start_at ? new Date(job.job_start_at) : new Date();
      const end = job.job_end_at ? new Date(job.job_end_at) : addDays(start, 30);

      projMap.set(job.id, {
        projectId: job.id,
        projectName: job.project_name || 'Sin Nombre',
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
          projectName: task.proformas?.project_name || 'Tareas sin Proyecto',
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
        <p className="font-medium">No hay proyectos activos para mostrar.</p>
        <p className="text-sm opacity-70">Ajusta los filtros o añade nuevas tareas.</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col h-[70vh] bg-[#fafafa]">
      {/* Header Controls */}
      <div className="bg-card px-6 py-4 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            {tasks.length} Tareas Totales
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {filteredProjects.length} Proyectos
          </Badge>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 text-xs">
                {selectedProjectFilters.length === 0 
                  ? 'Ver Todos los Proyectos' 
                  : `${selectedProjectFilters.length} Proyectos Seleccionados`}
                <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[240px]">
              <div className="px-2 py-1.5 text-sm font-semibold text-foreground">Filtrar por Proyecto</div>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={selectedProjectFilters.length === 0}
                onCheckedChange={() => setSelectedProjectFilters([])}
                className="font-bold"
              >
                Todos los Proyectos
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

          <Button 
            onClick={() => setAiModalOpen(true)}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generar Tareas IA
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Names and Info) */}
        <div className="w-[380px] shrink-0 border-r border-border/40 bg-card flex flex-col overflow-y-auto no-scrollbar z-10 shadow-[4px_0_12px_-6px_rgba(0,0,0,0.1)] relative">
          <div className="h-14 border-b border-border/40 bg-card sticky top-0 px-4 flex items-center shadow-sm z-20">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Proyecto / Tarea</span>
          </div>

          <div className="pb-8">
            {filteredProjects.map(proj => (
              <React.Fragment key={proj.projectId}>
                {/* Project Header Row */}
                <div className="px-4 py-3 border-b border-border/40 bg-muted/5 flex items-center gap-2 group">
                  <button 
                    onClick={() => toggleProject(proj.projectId)}
                    className="p-1 -ml-1 text-muted-foreground/50 hover:text-foreground transition-colors shrink-0"
                  >
                    {isProjectExpanded(proj.projectId) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <Link href={`/proforma/${proj.projectId}`} className="flex-1 overflow-hidden hover:opacity-80 transition-opacity">
                    <h3 className="font-bold text-foreground text-sm truncate">{proj.projectName}</h3>
                    {proj.clientName && (
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{proj.clientName} • {proj.status}</p>
                    )}
                  </Link>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setAddingTaskForProject(proj.projectId); }} 
                    className="p-1.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 rounded-md transition-all shrink-0"
                    title="Añadir tarea a este proyecto"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Task Rows */}
                {isProjectExpanded(proj.projectId) && proj.tasks.map(task => (
                  <div key={task.id} className="px-4 py-2 border-b border-border/20 pl-10 hover:bg-muted/5 transition-colors flex flex-col justify-center min-h-[56px] py-1.5 group">
                    <div className="flex items-center justify-between">
                      <p 
                        className="text-sm font-medium text-foreground truncate max-w-[240px] cursor-pointer hover:underline"
                        onClick={() => setEditingTask(task)}
                      >
                        {task.title}
                      </p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} 
                        className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all shrink-0"
                        title="Eliminar tarea"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Associated Proforma Item badge/text */}
                    {task.proforma_items && (
                      <div className="flex gap-1 items-center mt-1">
                        <Tag className="h-3 w-3 text-indigo-500" />
                        <span className="text-[10px] text-indigo-700 font-medium truncate max-w-[220px]">
                          {task.proforma_items.description}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleToggleStatus(task); }} 
                        className="focus:outline-none transition-transform active:scale-95"
                        title={task.status === 'completed' ? 'Marcar como pendiente' : 'Marcar como completada'}
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 hover:text-emerald-600" />
                        ) : (
                          <CircleDashed className="h-3.5 w-3.5 text-muted-foreground hover:text-emerald-500" />
                        )}
                      </button>
                      {task.team_members && (
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[150px]">{task.team_members.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Right Timelines Area */}
        <div className="flex-1 overflow-auto bg-muted/5 relative">
          <div style={{ width: `${timelineWidthPx}px`, minWidth: '100%' }}>
            {/* Timeline Header */}
            <div className="h-14 border-b border-border/40 bg-card sticky top-0 flex items-end relative z-10">
              <div className="absolute inset-0 flex">
                {daysArr.map((day, i) => {
                  const isToday = isSameDay(day, new Date());
                  const isFirstOfMonth = day.getDate() === 1;
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "flex shrink-0 flex-col justify-end pb-1 relative border-r border-border/20",
                        isWeekend && "bg-muted/10",
                        isToday && "bg-emerald-50/50"
                      )}
                      style={{ width: `${DAY_WIDTH}px` }}
                    >
                      {/* Month label */}
                      {(isFirstOfMonth || i === 0) && (
                        <div className="absolute top-1 left-2 text-[10px] font-black uppercase tracking-widest text-[#0D3B47] whitespace-nowrap z-20">
                          {format(day, 'MMM yyyy', { locale: es })}
                        </div>
                      )}
                      <div className="flex flex-col items-center">
                        <span className={cn(
                          "text-[9px] font-bold",
                          isToday ? "text-emerald-600" : "text-muted-foreground/60"
                        )}>
                          {format(day, 'eeeee', { locale: es })}
                        </span>
                        <span className={cn(
                          "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mt-0.5",
                          isToday && "bg-emerald-600 text-white shadow-sm font-bold"
                        )}>
                          {format(day, 'd')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timelines Body */}
            <div className="relative pb-8">
              {/* Background vertical division grid */}
              <div className="absolute inset-0 flex pointer-events-none">
                {daysArr.map(day => (
                  <div
                    key={`bg-${day.toISOString()}`}
                    className={cn(
                      "shrink-0 h-full border-r border-border/20",
                      (day.getDay() === 0 || day.getDay() === 6) && "bg-muted/10",
                      isSameDay(day, new Date()) && "border-r-emerald-500/30 bg-emerald-50/20"
                    )}
                    style={{ width: `${DAY_WIDTH}px` }}
                  />
                ))}
              </div>

              {/* Today line indicator */}
              <div
                className="absolute top-0 bottom-0 border-l-2 border-dashed border-emerald-500 z-10 pointer-events-none"
                style={{ left: `${getTaskLeftPx(new Date()) + (DAY_WIDTH / 2)}px` }}
              />

              {/* Rows */}
              <div className="relative z-20">
                {filteredProjects.map(proj => (
                  <React.Fragment key={`timeline-${proj.projectId}`}>
                    {/* Project empty track row */}
                    <div className="h-[52px] border-b border-border/40 relative group">
                      {/* Project wrapper bar (Optional, shows full duration of project) */}
                      <div
                        className="absolute h-1.5 bg-foreground/20 rounded-full top-1/2 -translate-y-1/2 group-hover:bg-foreground/30 transition-colors"
                        style={{
                          left: `${getTaskLeftPx(proj.startDate)}px`,
                          width: `${getTaskWidthPx(proj.startDate, proj.endDate)}px`
                        }}
                      />
                    </div>

                    {/* Tasks */}
                    {isProjectExpanded(proj.projectId) && proj.tasks.map(task => {
                      const start = new Date(task.due_date!);
                      const end = task.end_date ? new Date(task.end_date) : addDays(start, 1);
                      const isCompleted = task.status === 'completed';

                      return (
                        <div key={`track-${task.id}`} className="min-h-[56px] py-1.5 border-b border-border/20 relative group hover:bg-muted/5 transition-colors">
                          {/* Task Bar */}
                          <div
                            className={cn(
                              "absolute border rounded-full h-8 top-1/2 -translate-y-1/2 shadow-sm flex items-center px-3 cursor-pointer transition-all hover:brightness-95 hover:shadow-md",
                              isCompleted
                                ? "bg-emerald-100 border-emerald-300 text-emerald-800 shrink-0"
                                : "bg-[#0D3B47]/10 border-[#0D3B47]/20 text-[#0D3B47] shrink-0"
                            )}
                            style={{
                              left: `${getTaskLeftPx(start)}px`,
                              width: `${getTaskWidthPx(start, end)}px`
                            }}
                            title={`${task.title} (${format(start, 'd MMM')} - ${format(end, 'd MMM')})`}
                            onClick={() => setEditingTask(task)}
                          >
                            <span className="text-xs font-bold truncate">
                              {task.title}
                            </span>
                          </div>
                        </div>
                      )
                    })}
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
      toast.error('Debes seleccionar un proyecto');
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
      toast.error(isEdit ? 'Error al actualizar tarea' : 'Error al crear tarea');
    } else {
      toast.success(isEdit ? 'Tarea actualizada' : 'Tarea creada correctamente');
      onSuccess();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md shadow-2xl border-none h-fit max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-[#0D3B47] text-white rounded-t-xl sticky top-0 z-10">
          <CardTitle className="text-lg">{isEdit ? 'Editar Tarea' : 'Nueva Tarea Programada'}</CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-card rounded-b-xl border border-t-0 border-border/40">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="proforma_id">Proyecto</Label>
              <select
                id="proforma_id"
                name="proforma_id"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                required
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                disabled={isEdit && !!proformaId} // Disable if editing and locked to a project
              >
                <option value="">Seleccionar Proyecto...</option>
                {allProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proforma_item_id">Item Asociado (Opcional)</Label>
              <select
                id="proforma_item_id"
                name="proforma_item_id"
                defaultValue={taskToEdit?.proforma_item_id || ''}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={!selectedProjectId}
              >
                <option value="">Sin asociar (Tarea General)</option>
                {availableItems.map(item => (
                  <option key={item.id} value={item.id}>{item.description}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título de la Tarea</Label>
              <Input id="title" name="title" placeholder="Ej: Comprar pintura" defaultValue={taskToEdit?.title || ''} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_to">Asignar a</Label>
              <select
                id="assigned_to"
                name="assigned_to"
                defaultValue={taskToEdit?.team_members?.id || ''}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Sin asignar</option>
                {teamMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="due_date">Fecha de Inicio</Label>
                <Input id="due_date" name="due_date" type="datetime-local" defaultValue={formatForInput(taskToEdit?.due_date)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Fecha de Fin</Label>
                <Input id="end_date" name="end_date" type="datetime-local" defaultValue={formatForInput(taskToEdit?.end_date)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción (Opcional)</Label>
              <textarea
                id="description"
                name="description"
                defaultValue={taskToEdit?.description || ''}
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Detalles adicionales..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" className="h-10 px-6 rounded-lg font-bold" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" className="h-10 px-6 rounded-lg font-bold bg-[#0D3B47] hover:bg-[#072a33]" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEdit ? 'Guardar Cambios' : 'Crear Tarea')}
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
      toast.error('Selecciona un proyecto');
      setIsGenerating(false);
      return;
    }

    try {
      // 1. Call AI endpoint
      toast.info('Analizando proyecto y generando tareas...', { duration: 4500 });
      const res = await fetch('/api/tasks/generate', {
        method: 'POST',
        body: JSON.stringify({
          projectId,
          projectName: projectNameStr,
          projectDescription: description,
          startDate: startDate || new Date().toISOString()
        })
      });

      if (!res.ok) throw new Error('Error en el servicio de IA');
      const data = await res.json();
      const generatedTasks = data.tasks;

      if (!generatedTasks || generatedTasks.length === 0) {
        throw new Error('No se generaron tareas');
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

      toast.success(`¡${generatedTasks.length} Tareas generadas con éxito!`);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error('Hubo un error al generar las tareas con IA.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md shadow-2xl border-none overflow-hidden h-fit max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-indigo-600 text-white sticky top-0 z-10">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> Auto-Generar Tareas con IA
          </CardTitle>
          <CardDescription className="text-indigo-100">
            OpenAI analizará tu proyecto y armará un cronograma.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 bg-card">
          <form onSubmit={handleGenerate} className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="project_id">Selecciona el Proyecto</Label>
              <select
                id="project_id"
                name="project_id"
                required
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Elegir proyecto...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground">La IA revisará TODOS los productos o servicios (Line Items) vendidos en este proyecto para crear tareas específicas.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Fecha de Arranque Aproximada</Label>
              <Input id="start_date" name="start_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Instrucciones Adicionales para la IA (Opcional)</Label>
              <textarea
                id="description"
                name="description"
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ej: Remodelación completa de baño y pintura de cuartos secundarios..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" className="h-10 px-6 rounded-lg font-bold" onClick={onClose} disabled={isGenerating}>
                Cancelar
              </Button>
              <Button type="submit" className="h-10 px-6 rounded-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isGenerating}>
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                {isGenerating ? 'Generando...' : 'Autocompletar Tareas'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
