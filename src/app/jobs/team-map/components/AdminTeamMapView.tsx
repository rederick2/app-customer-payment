'use client';

import { useState, useRef, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { Badge } from '@/components/ui/badge';
import {
  MapPin, Calendar, User, FileText, ExternalLink,
  Navigation, ChevronLeft, Users, ChevronDown, ChevronUp,
  UserPlus, Check, Loader2, Eye
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { assignTask } from '../actions';
import { toast } from 'sonner';

const TaskMap = dynamic(() => import('../../../team/tasks/components/TaskMap'), { ssr: false });

const MEMBER_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#a855f7',
  '#f43f5e', '#06b6d4', '#84cc16', '#f97316',
];

// ── types ────────────────────────────────────────────────────────────
interface BaseItem {
  id: string;
  status: string;
  assigned_to?: string | null;
  lat?: number | null;
  lng?: number | null;
  proformas?: {
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

interface Task extends BaseItem {
  kind: 'task';
  title: string;
  description?: string;
  due_date?: string | null;
  end_date?: string | null;
}

interface Visit extends BaseItem {
  kind: 'visit';
  visit_date?: string | null;
  notes?: string | null;
}

type Item = Task | Visit;

interface TeamMember { id: string; name: string; }

interface AdminTeamMapViewProps {
  teamMembers: TeamMember[];
  tasksByMember: Record<string, any[]>;
  allTasks: any[];
  unassignedTasks: any[];
  visitsByMember: Record<string, any[]>;
  allVisits: any[];
  unassignedVisits: any[];
}

// ── helpers ──────────────────────────────────────────────────────────
function buildAddress(item: any) {
  const c = item.proformas?.clients;
  if (!c) return null;
  return [c.street_1, c.city, c.province, c.country, c.postal_code].filter(Boolean).join(', ') || null;
}
function buildGMapsUrl(a: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}`;
}
function getClientName(item: any) {
  const c = item.proformas?.clients;
  if (!c) return null;
  return c.company_name || [c.name, c.last_name].filter(Boolean).join(' ') || null;
}
function getItemDate(item: any) {
  return item.due_date || item.visit_date || null;
}
function getItemTitle(item: any) {
  return item.title || (item.proformas?.project_name ? `Visit – ${item.proformas.project_name}` : 'Visit');
}

interface LocationGroup {
  address: string; lat: number; lng: number;
  items: any[]; clientName: string | null; phone: string | null;
}
function groupByAddress(items: any[]): LocationGroup[] {
  const map = new Map<string, LocationGroup>();
  for (const item of items) {
    const address = buildAddress(item);
    if (!address || !item.lat || !item.lng) continue;
    const key = address.toLowerCase().trim();
    if (!map.has(key)) {
      map.set(key, { address, lat: item.lat, lng: item.lng, items: [], clientName: getClientName(item), phone: item.proformas?.clients?.phone || null });
    }
    map.get(key)!.items.push(item);
  }
  return Array.from(map.values());
}

// ── Assign dropdown ─────────────────────────────────────────────────
// Rendered in a portal-like position: uses fixed positioning to avoid overflow-hidden clipping
function AssignButton({ taskId, teamMembers, onAssigned }: { taskId: string; teamMembers: TeamMember[]; onAssigned: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [dropPos, setDropPos] = useState<{ top: number; left: number } | null>(null);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (open) { setOpen(false); return; }
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) setDropPos({ top: rect.bottom + 4, left: rect.left });
    setOpen(true);
  };

  const handleAssign = (memberId: string) => {
    startTransition(async () => {
      const result = await assignTask(taskId, memberId);
      if (result.error) toast.error(result.error);
      else { toast.success('Task assigned!'); onAssigned(memberId); setOpen(false); }
    });
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20 shrink-0"
      >
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
        Assign
      </button>
      {open && dropPos && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[998]" onClick={() => setOpen(false)} />
          {/* Dropdown */}
          <div
            className="fixed z-[999] bg-white border border-border/40 rounded-xl shadow-xl py-1 min-w-[180px]"
            style={{ top: dropPos.top, left: dropPos.left }}
          >
            <p className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Assign to</p>
            {teamMembers.map(m => (
              <button
                key={m.id}
                onClick={() => handleAssign(m.id)}
                className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-muted/30 flex items-center gap-2 transition-colors"
              >
                <User className="h-3 w-3 text-muted-foreground" />
                {m.name}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

// ── Unassigned item card ─────────────────────────────────────────────
function UnassignedCard({ item, teamMembers, onAssigned }: { item: any; teamMembers: TeamMember[]; onAssigned: (id: string) => void }) {
  const address = buildAddress(item);
  const clientName = getClientName(item);
  const date = getItemDate(item);
  const title = getItemTitle(item);
  const isVisit = !!item.visit_date;

  return (
    <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50/30 overflow-visible">
      <div className="px-3 py-2.5 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              {isVisit
                ? <Eye className="h-3 w-3 text-teal-500 shrink-0" />
                : <Check className="h-3 w-3 text-orange-500 shrink-0" />}
              <p className="font-bold text-sm text-foreground truncate">{title}</p>
            </div>
            {clientName && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="h-3 w-3 shrink-0" />
                <span className="truncate">{clientName}</span>
                {item.proformas?.clients?.phone && (
                  <a href={`tel:${item.proformas.clients.phone}`} onClick={e => e.stopPropagation()}
                    className="ml-auto text-blue-600 hover:underline font-semibold shrink-0">
                    {item.proformas.clients.phone}
                  </a>
                )}
              </div>
            )}
          </div>
          <AssignButton taskId={item.id} teamMembers={teamMembers} onAssigned={onAssigned} />
        </div>
        {item.proformas?.project_name && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <FileText className="h-3 w-3 shrink-0" />
            <span className="truncate">{item.proformas.project_name}{item.proformas.number ? ` · #${item.proformas.number}` : ''}</span>
          </div>
        )}
        {date && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>{new Date(date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
          </div>
        )}
        {address && (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{address}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────
export default function AdminTeamMapView({
  teamMembers, tasksByMember, allTasks, unassignedTasks,
  visitsByMember, allVisits, unassignedVisits
}: AdminTeamMapViewProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | 'all' | 'unassigned'>('all');
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});
  const [localUnassignedTasks, setLocalUnassignedTasks] = useState<any[]>(unassignedTasks);
  const [localUnassignedVisits, setLocalUnassignedVisits] = useState<any[]>(unassignedVisits);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const memberColorMap: Record<string, string> = {};
  teamMembers.forEach((m, i) => { memberColorMap[m.id] = MEMBER_COLORS[i % MEMBER_COLORS.length]; });

  // Combine tasks + visits for "All" and per-member views
  const allAssigned = [...allTasks, ...allVisits];
  const visibleItems = selectedMemberId === 'all'
    ? allAssigned
    : selectedMemberId === 'unassigned'
      ? [] // handled separately
      : [...(tasksByMember[selectedMemberId] || []), ...(visitsByMember[selectedMemberId] || [])];

  const groups = selectedMemberId !== 'unassigned' ? groupByAddress(visibleItems) : [];

  const locations = groups.map((g, i) => ({
    lat: g.lat, lng: g.lng,
    title: g.clientName || g.address,
    address: g.address, index: i,
  }));

  const allUnassigned = [...localUnassignedTasks, ...localUnassignedVisits];
  const totalUnassigned = allUnassigned.length;

  const getMemberName = (id?: string | null) => {
    if (!id) return 'Unassigned';
    return teamMembers.find(m => m.id === id)?.name || 'Unknown';
  };

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
    <div className="flex flex-col bg-[#f8fafc]" style={{ height: 'calc(100vh - 56px)', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div className="bg-white border-b border-border/30 px-4 py-2 flex flex-col gap-1.5 shrink-0">
        <div className="flex items-center gap-2">
          <Link href="/calendar" className="p-1.5 rounded-xl hover:bg-muted/30 transition-colors text-muted-foreground shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-archivo text-base font-bold text-foreground">Team Task Map</h1>
            <p className="text-[11px] text-muted-foreground">
              {allTasks.length} tasks · {allVisits.length} visits · {groupByAddress(allAssigned).length} loc · {teamMembers.length} members
              {totalUnassigned > 0 && ` · ${totalUnassigned} unassigned`}
            </p>
          </div>
        </div>
        {/* Filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          <button onClick={() => setSelectedMemberId('all')}
            className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0",
              selectedMemberId === 'all' ? 'bg-foreground text-background border-foreground' : 'bg-white text-muted-foreground border-border/40 hover:border-border'
            )}>
            <Users className="h-3 w-3" />All
          </button>

          {totalUnassigned > 0 && (
            <button onClick={() => setSelectedMemberId('unassigned')}
              className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0",
                selectedMemberId === 'unassigned' ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-rose-500 border-rose-200 hover:border-rose-300'
              )}>
              <UserPlus className="h-3 w-3" />
              Unassigned
              <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", selectedMemberId === 'unassigned' ? 'bg-white/20' : 'bg-rose-50')}>
                {totalUnassigned}
              </span>
            </button>
          )}

          {teamMembers.map((m, i) => {
            const color = MEMBER_COLORS[i % MEMBER_COLORS.length];
            const count = (tasksByMember[m.id] || []).length + (visitsByMember[m.id] || []).length;
            const isSelected = selectedMemberId === m.id;
            return (
              <button key={m.id} onClick={() => setSelectedMemberId(m.id)}
                className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0",
                  isSelected ? 'text-white border-transparent' : 'bg-white text-muted-foreground border-border/40 hover:border-border'
                )}
                style={isSelected ? { backgroundColor: color, borderColor: color } : {}}
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                {m.name}
                {count > 0 && (
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", isSelected ? 'bg-white/20' : 'bg-muted')}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">

        {/* Left panel */}
        <div
          className="w-full lg:w-[400px] lg:min-w-[400px] flex flex-col border-b lg:border-b-0 lg:border-r border-border/30 bg-white"
          style={{ maxHeight: '85vh', minHeight: 0 }}
        >
          <div className="px-4 py-2 border-b border-border/20 bg-muted/20 shrink-0">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              {selectedMemberId === 'unassigned'
                ? `${totalUnassigned} unassigned items`
                : `${groups.length} location${groups.length !== 1 ? 's' : ''}${selectedMemberId !== 'all' ? ` · ${getMemberName(selectedMemberId)}` : ''}`}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto py-2 px-2 space-y-2">

            {/* Unassigned list */}
            {selectedMemberId === 'unassigned' ? (
              allUnassigned.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
                  <Check className="h-8 w-8 opacity-30" />
                  <p>All items are assigned!</p>
                </div>
              ) : (
                allUnassigned.map(item => (
                  <UnassignedCard
                    key={item.id}
                    item={item}
                    teamMembers={teamMembers}
                    onAssigned={() => {
                      setLocalUnassignedTasks(p => p.filter(t => t.id !== item.id));
                      setLocalUnassignedVisits(p => p.filter(v => v.id !== item.id));
                    }}
                  />
                ))
              )
            ) : groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2 py-8">
                <Navigation className="h-8 w-8 opacity-30" />
                <p>No items with addresses.</p>
              </div>
            ) : (
              groups.map((group, gi) => {
                const isActive = activeGroupIndex === gi;
                const isExpanded = expandedGroups[gi] ?? false;
                const assigneeIds = [...new Set(group.items.map((t: any) => t.assigned_to).filter(Boolean))] as string[];

                return (
                  <div key={group.address}
                    ref={el => { cardRefs.current[gi] = el; }}
                    className={cn("rounded-xl border transition-all duration-200",
                      isActive ? 'ring-2 ring-primary/30 border-primary/40 shadow-md' : 'border-border/30 hover:border-border/60 hover:shadow-sm'
                    )}>
                    <div className="rounded-[inherit] overflow-hidden">

                      {/* Group header */}
                      <div onClick={() => setActiveGroupIndex(gi)}
                        className={cn("px-3 py-2.5 cursor-pointer flex items-start gap-2.5",
                          isActive ? 'bg-primary/5' : 'bg-muted/10 hover:bg-muted/20'
                        )}>
                        <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-[12px] font-bold text-white shrink-0 mt-0.5">
                          {gi + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">{group.clientName || 'Client'}</p>
                          <div className="flex items-start gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground leading-relaxed">{group.address}</p>
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {group.phone && (
                              <a href={`tel:${group.phone}`} onClick={e => e.stopPropagation()}
                                className="text-[11px] font-semibold text-blue-600 hover:underline">{group.phone}</a>
                            )}
                            <a href={buildGMapsUrl(group.address)} target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline">
                              <ExternalLink className="h-2.5 w-2.5" />Google Maps
                            </a>
                          </div>
                          {assigneeIds.length > 0 && (
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {assigneeIds.map(mid => (
                                <div key={mid} className="flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: memberColorMap[mid] || '#94a3b8' }} />
                                  <span className="text-[10px] text-muted-foreground">{getMemberName(mid)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[11px] font-bold bg-muted rounded-full px-2 py-0.5">
                            {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                          </span>
                          <button onClick={e => { e.stopPropagation(); setExpandedGroups(p => ({ ...p, [gi]: !p[gi] })); }}
                            className="text-muted-foreground hover:text-foreground p-0.5 transition-colors">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded items */}
                      {isExpanded && (
                        <div className="border-t border-border/20 divide-y divide-border/10">
                          {group.items.map((item: any) => {
                            const color = item.assigned_to ? memberColorMap[item.assigned_to] : '#94a3b8';
                            const isVisit = !!item.visit_date;
                            const date = getItemDate(item);
                            return (
                              <div key={item.id} className="px-4 py-2.5 bg-white space-y-1.5">
                                <div className="flex items-center gap-2">
                                  {isVisit
                                    ? <Eye className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                                    : <Check className="h-3.5 w-3.5 text-orange-500 shrink-0" />}
                                  <span className="text-sm font-bold text-foreground truncate flex-1">{getItemTitle(item)}</span>
                                  <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-bold shrink-0">
                                    {item.status?.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs">
                                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                  <span className="font-semibold" style={{ color }}>{getMemberName(item.assigned_to)}</span>
                                </div>
                                {item.proformas?.project_name && (
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <FileText className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{item.proformas.project_name}{item.proformas.number ? ` · #${item.proformas.number}` : ''}</span>
                                  </div>
                                )}
                                {date && (
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3 shrink-0" />
                                    <span>{new Date(date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
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
          {selectedMemberId === 'unassigned' ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-muted/10 text-muted-foreground gap-3">
              <UserPlus className="h-12 w-12 opacity-20" />
              <p className="font-semibold text-sm">Assign items to see them on the map</p>
            </div>
          ) : locations.length > 0 ? (
            <TaskMap
              locations={locations}
              onSelectMarker={handleMapSelect}
              activeIndex={activeGroupIndex}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-muted/10 text-muted-foreground gap-3">
              <MapPin className="h-12 w-12 opacity-20" />
              <p className="font-semibold">No geocoded locations</p>
              <p className="text-sm opacity-70">Tasks/visits need valid client addresses</p>
            </div>
          )}

          {/* Legend */}
          {/*selectedMemberId !== 'unassigned' && teamMembers.length > 0 && locations.length > 0 && (
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm border border-border/40 rounded-xl px-3 py-2.5 shadow-lg text-xs flex flex-col gap-1.5 max-w-[200px]">
              <p className="font-bold text-foreground/60 uppercase tracking-wider text-[10px]">Team</p>
              {teamMembers.map((m, i) => {
                const count = (tasksByMember[m.id] || []).length + (visitsByMember[m.id] || []).length;
                return (
                  <div key={m.id} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: MEMBER_COLORS[i % MEMBER_COLORS.length] }} />
                    <span className="text-muted-foreground font-medium truncate">{m.name}</span>
                    <span className="ml-auto text-muted-foreground/60">{count}</span>
                  </div>
                );
              })}
            </div>
          )*/}
        </div>
      </div>
    </div>
  );
}
