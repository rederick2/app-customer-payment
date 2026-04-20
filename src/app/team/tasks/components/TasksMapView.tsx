'use client';

import { useState, useRef, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { Badge } from '@/components/ui/badge';
import {
  MapPin, Calendar, User, FileText, ExternalLink, Navigation,
  Eye, CheckSquare, ChevronDown, ChevronUp, Loader2,
  Play, Square, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateTaskProgress, startTimeEntry, stopTimeEntry } from '../actions';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const TaskMap = dynamic(() => import('./TaskMap'), { ssr: false });

// ── Types ─────────────────────────────────────────────────────
interface BaseItem {
  id: string;
  status: string;
  proforma_id?: string | null;
  lat?: number | null;
  lng?: number | null;
  proformas?: {
    id?: string;
    project_name?: string;
    number?: string | number;
    clients?: {
      name?: string; last_name?: string; company_name?: string;
      phone?: string; email?: string;
      street_1?: string; city?: string; province?: string;
      country?: string; postal_code?: string;
    };
  } | null;
}
interface Task extends BaseItem { title: string; description?: string; due_date?: string | null; end_date?: string | null; percentage?: number | null; }
interface Visit extends BaseItem { visit_date?: string | null; notes?: string | null; }

interface TasksMapViewProps {
  tasks: Task[];
  visits: Visit[];
  teamMemberId: string;
  activeEntry: any;
  settings?: {
    showClientName: boolean;
    showClientPhone: boolean;
  };
}

interface LocationGroup {
  address: string; lat: number; lng: number;
  clientName: string | null; phone: string | null;
  tasks: Task[]; visits: Visit[];
}

// ── Helpers ───────────────────────────────────────────────────
function buildAddress(item: BaseItem) {
  const c = item.proformas?.clients;
  if (!c) return null;
  return [c.street_1, c.city, c.province, c.country, c.postal_code].filter(Boolean).join(', ') || null;
}
function buildGMapsUrl(a: string) { return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}`; }
function getClientName(item: BaseItem) {
  const c = item.proformas?.clients;
  if (!c) return null;
  return c.company_name || [c.name, c.last_name].filter(Boolean).join(' ') || null;
}
function groupByAddress(tasks: Task[], visits: Visit[]): LocationGroup[] {
  const map = new Map<string, LocationGroup>();
  const add = (item: any, isVisit: boolean) => {
    const address = buildAddress(item);
    if (!address || !item.lat || !item.lng) return;
    const key = address.toLowerCase().trim();
    if (!map.has(key)) {
      map.set(key, { address, lat: item.lat, lng: item.lng, clientName: getClientName(item), phone: item.proformas?.clients?.phone || null, tasks: [], visits: [] });
    }
    if (isVisit) map.get(key)!.visits.push(item);
    else map.get(key)!.tasks.push(item);
  };
  tasks.forEach(t => add(t, false));
  visits.forEach(v => add(v, true));
  return Array.from(map.values());
}

// ── Task Progress Control ──────────────────────────────────────
function TaskProgress({ 
  taskId, 
  value, 
  isPending, 
  setValue, 
  save 
}: { 
  taskId: string; 
  value: number;
  isPending: boolean;
  setValue: (v: number) => void;
  save: (v: number) => void;
}) {
  const isCompleted = value === 100;

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-black border transition-all active:scale-95",
          isCompleted 
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/20" 
            : "bg-blue-500/10 border-blue-500/30 text-blue-700 hover:bg-blue-500/20"
        )}
      >
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <span>{value}%</span>}
        <ChevronDown className="h-3 w-3 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-56 p-4 shadow-2xl border-border/40" align="start" side="bottom" sideOffset={8}>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Update Progress</span>
            <span className={cn(
              "text-xs font-mono font-black px-1.5 py-0.5 rounded",
              isCompleted ? "bg-emerald-500 text-white" : "bg-blue-500 text-white"
            )}>
              {value}%
            </span>
          </div>
          <div className="relative pt-1">
            <input
              type="range" min={0} max={100} step={5}
              value={value}
              onChange={e => setValue(Number(e.target.value))}
              onMouseUp={e => save(Number((e.target as HTMLInputElement).value))}
              onTouchEnd={e => save(Number((e.target as HTMLInputElement).value))}
              className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-blue-600 focus:outline-none"
            />
          </div>
          <div className="flex justify-between text-[9px] font-black text-muted-foreground/40 uppercase tracking-tighter">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TaskProgressWrapper({ taskId, initial }: { taskId: string; initial: number | null | undefined }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initial ?? 0);
  const [isPending, startTransition] = useTransition();

  const save = (v: number) => {
    setValue(v);
    startTransition(async () => {
      const r = await updateTaskProgress(taskId, v);
      if (r.error) toast.error(r.error);
    });
  };

  const isCompleted = value === 100;

  return (
    <div className="flex flex-col gap-2 w-full pr-1 overflow-visible">
      {/* Visual Progress Bar */}
      <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-500 ease-out",
            isCompleted ? "bg-emerald-500" : "bg-blue-500"
          )}
          style={{ width: `${value}%` }}
        />
      </div>
      
      {/* We expose the setOpen etc if we wanted, but let's keep it simple: 
          The button is handled inside the parent to keep the layout clean 
      */}
    </div>
  );
}

// ── Combined Progress + Timer Hook-like component ─────────────
function TaskActions({ taskId, initialPercentage, teamMemberId, proformaId, activeEntry }: {
  taskId: string;
  initialPercentage: number | null | undefined;
  teamMemberId: string;
  proformaId: string;
  activeEntry: any;
}) {
  const [value, setValue] = useState(initialPercentage ?? 0);
  const [isPending, startTransition] = useTransition();

  const save = (v: number) => {
    setValue(v);
    startTransition(async () => {
      const r = await updateTaskProgress(taskId, v);
      if (r.error) toast.error(r.error);
    });
  };

  const isCompleted = value === 100;

  return (
    <div className="flex flex-col gap-2 pt-1 w-full overflow-visible">
      <div className="flex items-center gap-2 overflow-visible">
        <TaskProgress 
          taskId={taskId} 
          value={value}
          isPending={isPending}
          setValue={setValue}
          save={save}
        />
        <TimerButton
          teamMemberId={teamMemberId}
          proformaId={proformaId}
          activeEntry={activeEntry}
        />
      </div>
      
      {/* Visual Progress Bar */}
      <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden mt-0.5">
        <div 
          className={cn(
            "h-full transition-all duration-500 ease-out",
            isCompleted ? "bg-emerald-500" : "bg-blue-500"
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ── Timer Button (compact inline) ────────────────────────────
function TimerButton({ teamMemberId, proformaId, activeEntry }: { teamMemberId: string; proformaId: string; activeEntry: any }) {
  const [isPending, startTransition] = useTransition();
  const [elapsed, setElapsed] = useState('00:00');
  const isActive = activeEntry?.proforma_id === proformaId;
  const isBusy = activeEntry && !isActive;

  useEffect(() => {
    if (!isActive) { setElapsed('00:00'); return; }
    const tick = () => {
      const diff = Math.floor((Date.now() - new Date(activeEntry.start_time).getTime()) / 1000);
      const h = Math.floor(diff / 3600).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
      setElapsed(`${h}:${m}`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [isActive, activeEntry]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isBusy) { toast.error('Stop the other timer first'); return; }
    startTransition(async () => {
      if (isActive) {
        const r = await stopTimeEntry(activeEntry.id);
        if (r.error) toast.error(r.error); else toast.success('Timer stopped');
      } else {
        const r = await startTimeEntry(teamMemberId, proformaId);
        if (r.error) toast.error(r.error); else toast.success('Timer started');
      }
    });
  };

  return (
    <button onClick={handleClick} disabled={isPending || isBusy}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-xl text-[11px] font-bold border transition-colors",
        isActive ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' :
          isBusy ? 'bg-muted text-muted-foreground border-border/30 opacity-50 cursor-not-allowed' :
            'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
      )}>
      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> :
        isActive ? <><Square className="h-3 w-3" />{elapsed}</> :
          <><Play className="h-3 w-3" />Timer</>
      }
    </button>
  );
}

// ── Main View ─────────────────────────────────────────────────
export default function TasksMapView({ tasks, visits, teamMemberId, activeEntry, settings }: TasksMapViewProps) {
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const showClientName = settings?.showClientName !== false;
  const showClientPhone = settings?.showClientPhone !== false;

  const groups = groupByAddress(tasks, visits);

  const locations = groups.map((g, i) => ({
    lat: g.lat, lng: g.lng,
    title: g.clientName || g.address,
    address: g.address, index: i,
  }));

  const handleMapSelect = (index: number) => {
    if (index === -1) {
      setActiveGroupIndex(null);
      return;
    }
    setActiveGroupIndex(index);
    setExpandedGroups(p => ({ ...p, [index]: true }));
    cardRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="flex flex-col lg:flex-row" style={{ height: 'calc(100vh - 56px)', overflow: 'hidden' }}>

      {/* Left panel */}
      <div className="w-full lg:w-[400px] lg:min-w-[400px] flex flex-col border-b lg:border-b-0 lg:border-r border-border/30 bg-white" style={{ maxHeight: '95vh', minHeight: 0 }}>

        <div className="px-5 py-3 border-b border-border/20 bg-white shrink-0">
          <h1 className="font-archivo text-lg font-bold text-foreground">My Schedule</h1>
          <p className="text-[11px] text-muted-foreground">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} · {visits.length} visit{visits.length !== 1 ? 's' : ''} · {groups.length} location{groups.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-2 min-h-0">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm gap-2">
              <Navigation className="h-8 w-8 opacity-30" />
              <p>No tasks or visits assigned.</p>
            </div>
          ) : (
            groups.map((group, gi) => {
              const isActive = activeGroupIndex === gi;
              const isExpanded = expandedGroups[gi] ?? false;
              const totalItems = group.tasks.length + group.visits.length;

              return (
                <div key={group.address}
                  ref={el => { cardRefs.current[gi] = el; }}
                  className={cn("rounded-xl border transition-all duration-200",
                    isActive ? 'ring-2 ring-primary/30 border-primary/40 shadow-md' : 'border-border/30 hover:border-border/60 hover:shadow-sm'
                  )}>
                  <div className="rounded-[inherit] overflow-visible">

                  {/* Header */}
                  <div onClick={() => setActiveGroupIndex(gi)}
                    className={cn("px-3 py-2.5 cursor-pointer flex items-start gap-2",
                      isActive ? 'bg-primary/10' : 'bg-muted/10 hover:bg-muted/20'
                    )}>
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0 mt-0.5",
                      isActive ? 'bg-primary' : 'bg-muted-foreground/30'
                    )}>
                      {gi + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">
                        {showClientName ? (group.clientName || 'Client') : 'Client'}
                      </p>
                      <div className="flex items-start gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground leading-relaxed">{group.address}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {group.phone && showClientPhone && (
                          <a href={`tel:${group.phone}`} onClick={e => e.stopPropagation()}
                            className="text-[11px] font-semibold text-blue-600 hover:underline">{group.phone}</a>
                        )}
                        <a href={buildGMapsUrl(group.address)} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline">
                          <ExternalLink className="h-2.5 w-2.5" />Google Maps
                        </a>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {group.tasks.length > 0 && (
                        <span className="text-[10px] font-bold bg-orange-100 text-orange-600 rounded-full px-2 py-0.5">{group.tasks.length} task{group.tasks.length !== 1 ? 's' : ''}</span>
                      )}
                      {group.visits.length > 0 && (
                        <span className="text-[10px] font-bold bg-teal-100 text-teal-600 rounded-full px-2 py-0.5">{group.visits.length} visit{group.visits.length !== 1 ? 's' : ''}</span>
                      )}
                      <button onClick={e => { e.stopPropagation(); setExpandedGroups(p => ({ ...p, [gi]: !p[gi] })); }}
                        className="text-muted-foreground hover:text-foreground p-0.5 transition-colors mt-0.5">
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded items */}
                  {isExpanded && (
                    <div className="border-t border-border/20 divide-y divide-border/10 overflow-visible">

                      {/* Tasks */}
                      {group.tasks.map(task => (
                        <div key={task.id} className="px-3 py-3 bg-white space-y-2 overflow-visible">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CheckSquare className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                            <span className="text-sm font-bold text-foreground truncate flex-1">{task.title}</span>
                            <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-bold shrink-0">
                              {task.status?.replace('_', ' ')}
                            </Badge>
                          </div>
                          {task.proformas?.project_name && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <FileText className="h-3 w-3 shrink-0" />
                              <span className="truncate">{task.proformas.project_name}{task.proformas.number ? ` · #${task.proformas.number}` : ''}</span>
                            </div>
                          )}
                          {(task.due_date || task.end_date) && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span>
                                {task.due_date && new Date(task.due_date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                                {task.end_date && ` → ${new Date(task.end_date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`}
                              </span>
                            </div>
                          )}
                          {/* Progress + Timer */}
                          {task.proformas?.id && (
                            <TaskActions 
                              taskId={task.id}
                              initialPercentage={task.percentage}
                              teamMemberId={teamMemberId}
                              proformaId={task.proformas.id}
                              activeEntry={activeEntry}
                            />
                          )}
                        </div>
                      ))}

                      {/* Visits */}
                      {group.visits.map(visit => (
                        <div key={visit.id} className="px-3 py-3 bg-teal-50/30 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Eye className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                            <span className="text-sm font-bold text-foreground truncate flex-1">
                              {visit.proformas?.project_name ? `Visit – ${visit.proformas.project_name}` : 'Visit'}
                            </span>
                            <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-bold shrink-0 border-teal-200 text-teal-700 bg-teal-50">
                              {visit.status?.replace('_', ' ')}
                            </Badge>
                          </div>
                          {visit.visit_date && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span>{new Date(visit.visit_date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                            </div>
                          )}
                          {visit.notes && (
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{visit.notes}</p>
                          )}
                          {/* Timer for visit */}
                          {visit.proformas?.id && (
                            <div className="pt-1">
                              <TimerButton
                                teamMemberId={teamMemberId}
                                proformaId={visit.proformas.id}
                                activeEntry={activeEntry}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: '300px' }}>
        {locations.length > 0 ? (
          <TaskMap
            locations={locations}
            onSelectMarker={handleMapSelect}
            activeIndex={activeGroupIndex}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-muted/10 text-muted-foreground gap-3">
            <MapPin className="h-12 w-12 opacity-20" />
            <p className="font-semibold">No locations on the map</p>
            <p className="text-sm opacity-70">Tasks need valid client addresses</p>
          </div>
        )}
        {locations.length > 0 && (
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm border border-border/40 rounded-xl px-3 py-2 shadow-lg text-xs flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-orange-400" />
              <span className="text-muted-foreground font-medium">Tasks</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-teal-400" />
              <span className="text-muted-foreground font-medium">Visits</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
