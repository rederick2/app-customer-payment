'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  MapPin, Calendar, Clock, User, FileText, ExternalLink,
  ChevronRight, Navigation
} from 'lucide-react';

const TaskMap = dynamic(() => import('./TaskMap'), { ssr: false });

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  due_date?: string | null;
  end_date?: string | null;
  proforma_id?: string | null;
  proformas?: {
    project_name?: string;
    number?: string | number;
    clients?: {
      name?: string;
      last_name?: string;
      company_name?: string;
      phone?: string;
      email?: string;
      street_1?: string;
      city?: string;
      province?: string;
      country?: string;
      postal_code?: string;
    };
  } | null;
  lat?: number | null;
  lng?: number | null;
}

interface MapLocation {
  lat: number;
  lng: number;
  title: string;
  address: string;
  index: number;
}

interface TasksMapViewProps {
  tasks: Task[];
  teamMemberId: string;
  activeEntry: any;
}

function buildAddress(proformas: Task['proformas']) {
  if (!proformas) return null;
  const parts = [proformas.clients?.street_1, proformas.clients?.city, proformas.clients?.province, proformas.clients?.country, proformas.clients?.postal_code].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

function buildGoogleMapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'in_progress': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    default: return 'bg-blue-100 text-blue-700 border-blue-200';
  }
}

export default function TasksMapView({ tasks, teamMemberId, activeEntry }: TasksMapViewProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Build map locations — geocode on the fly if no lat/lng stored
  // We will use the address string for display; real geocoding happens in TaskMap via labels
  const locations: MapLocation[] = tasks
    .map((task, i) => {
      const address = buildAddress(task.proformas);
      if (!address) return null;
      // Use stored coordinates if available, otherwise we'll use a fallback center
      // The parent page should pass geocoded coords; for now we display pins with labels
      return {
        lat: task.lat ?? 0,
        lng: task.lng ?? 0,
        title: task.title,
        address,
        index: i,
      } as MapLocation;
    })
    .filter((l): l is MapLocation => l !== null && (l.lat !== 0 || l.lng !== 0));

  const handleMapSelect = (index: number) => {
    setActiveIndex(index);
    cardRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-0 h-full min-h-screen bg-[#f8fafc]">

      {/* ── Left Panel: Task Cards ── */}
      <div className="w-full lg:w-[400px] lg:min-w-[400px] flex flex-col h-screen overflow-hidden border-r border-border/30 bg-white">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border/20 bg-white">
          <h1 className="font-archivo text-2xl font-bold text-foreground">Your Tasks</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned · Select to view on map
          </p>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-2">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm gap-2">
              <Navigation className="h-8 w-8 opacity-30" />
              <p>No tasks assigned right now.</p>
            </div>
          ) : (
            tasks.map((task, i) => {
              const address = buildAddress(task.proformas);
              const mapsUrl = address ? buildGoogleMapsUrl(address) : null;
              const clientName = task.proformas?.clients?.company_name ||
                [task.proformas?.clients?.name, task.proformas?.clients?.last_name].filter(Boolean).join(' ') || null;
              const isActive = activeIndex === i;

              return (
                <div
                  key={task.id}
                  ref={el => { cardRefs.current[i] = el; }}
                  onClick={() => setActiveIndex(i)}
                  className={`rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden
                    ${isActive
                      ? 'border-emerald-400 ring-2 ring-emerald-400/30 shadow-md'
                      : 'border-border/30 hover:border-border/60 hover:shadow-sm bg-white'
                    }`}
                >
                  {/* Number badge + status */}
                  <div className={`px-4 py-3 flex items-center justify-between gap-2 ${isActive ? 'bg-emerald-50' : 'bg-muted/20'}`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                        ${isActive ? 'bg-emerald-500 text-white' : 'bg-muted-foreground/20 text-foreground'}`}>
                        {i + 1}
                      </div>
                      <span className="font-bold text-sm text-foreground truncate max-w-[200px]">{task.title}</span>
                    </div>
                    <Badge variant="outline" className={`text-[10px] uppercase tracking-wider font-bold shrink-0 ${getStatusColor(task.status)}`}>
                      {task.status?.replace('_', ' ') || 'Pending'}
                    </Badge>
                  </div>

                  <div className="px-4 py-3 space-y-2.5 bg-white">
                    {/* Project */}
                    {task.proformas?.project_name && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                        <span className="font-semibold text-foreground/70 truncate">
                          {task.proformas.project_name}
                          {task.proformas.number ? ` · #${task.proformas.number}` : ''}
                        </span>
                      </div>
                    )}

                    {/* Client */}
                    {clientName && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                        <span className="truncate">{clientName}</span>
                        {task.proformas?.clients?.phone && (
                          <a href={`tel:${task.proformas.clients.phone}`}
                            onClick={e => e.stopPropagation()}
                            className="ml-auto text-blue-600 hover:underline font-medium shrink-0">
                            {task.proformas.clients.phone}
                          </a>
                        )}
                      </div>
                    )}

                    {/* Dates */}
                    {(task.due_date || task.end_date) && (
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary/60" />
                        <div className="flex flex-col gap-0.5">
                          {task.due_date && (
                            <span><span className="font-semibold text-foreground/60">Start:</span> {new Date(task.due_date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          )}
                          {task.end_date && (
                            <span><span className="font-semibold text-foreground/60">End:</span> {new Date(task.end_date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Address */}
                    {address && (
                      <div className="flex items-start gap-2 text-xs">
                        <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground/80 leading-relaxed">{address}</p>
                          {mapsUrl && (
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="inline-flex items-center gap-1 mt-1 text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Open in Google Maps
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {task.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/20 pt-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right Panel: Map ── */}
      <div className="flex-1 relative min-h-[50vh] lg:min-h-screen">
        {locations.length > 0 ? (
          <TaskMap locations={locations} onSelectMarker={handleMapSelect} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-muted/10 text-muted-foreground gap-3">
            <MapPin className="h-12 w-12 opacity-20" />
            <div className="text-center">
              <p className="font-semibold">No map locations available</p>
              <p className="text-sm opacity-70 mt-1">Tasks need coordinates stored to appear on the map</p>
            </div>
          </div>
        )}
        {/* Floating legend */}
        {locations.length > 0 && (
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm border border-border/40 rounded-xl px-4 py-2.5 shadow-lg text-xs flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground font-medium">Task location</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full bg-amber-400" />
              <span className="text-muted-foreground font-medium">Selected</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
