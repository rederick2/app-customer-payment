'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, RefreshCw, CheckCircle2, Clock, AlertTriangle, Hash, ChevronRight, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { fetchQBOEmployeesAndVendors, linkQBOTeamMember, syncTimeEntryToQB, updateTimeEntryStatus } from '../actions';

export default function TimesheetAdminClient({ initialEntries, hasQuickbooks }: { initialEntries: any[], hasQuickbooks: boolean }) {
  const [entries, setEntries] = useState(initialEntries);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [mappingEntry, setMappingEntry] = useState<any>(null);
  const [qboData, setQboData] = useState<{ employees: any[], vendors: any[] }>({ employees: [], vendors: [] });
  const [isLoadingQBO, setIsLoadingQBO] = useState(false);

  const [selectedQBOId, setSelectedQBOId] = useState<string>('');
  const [selectedQBOType, setSelectedQBOType] = useState<'Employee' | 'Vendor'>('Employee');

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ true: false });

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] !== false }));
  };

  // Default all to expanded if not explicitly set
  const isExpanded = (id: string) => expandedSections[id] !== false;

  const handleStatusUpdate = async (entryId: string, newStatus: 'approved' | 'rejected' | 'completed') => {
    setIsProcessing(entryId);
    const res = await updateTimeEntryStatus(entryId, newStatus);
    setIsProcessing(null);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Entry ${newStatus}`);
      setEntries(entries.map(e => e.id === entryId ? { ...e, status: newStatus } : e));
    }
  };

  const handleSyncButton = async (entry: any) => {
    if (!hasQuickbooks) {
      toast.error('Connect QuickBooks in Settings first.');
      return;
    }

    if (entry.status === 'active') {
      toast.error('Cannot sync an active timer.');
      return;
    }

    // Check if team member is already mapped
    if (entry.team_members.qbo_employee_id) {
      performSync(entry.id);
    } else {
      // Need to map them first
      setMappingEntry(entry);
      setMapModalOpen(true);
      fetchMappingData();
    }
  };

  const fetchMappingData = async () => {
    setIsLoadingQBO(true);
    const res = await fetchQBOEmployeesAndVendors();
    setIsLoadingQBO(false);
    if (res.error) {
      toast.error(res.error);
      setMapModalOpen(false);
    } else if (res.data) {
      setQboData(res.data);
    }
  };

  const handleSaveMappingAndSync = async () => {
    if (!selectedQBOId) {
      toast.error('Please select an employee or vendor');
      return;
    }

    setIsSyncing(mappingEntry.id);
    setMapModalOpen(false);

    // 1. Save mapping
    const mapRes = await linkQBOTeamMember(mappingEntry.team_member_id, selectedQBOId, selectedQBOType);
    if (mapRes.error) {
      toast.error(mapRes.error);
      setIsSyncing(null);
      return;
    }

    // 2. Perform Sync
    performSync(mappingEntry.id);
  };

  const performSync = async (entryId: string) => {
    setIsSyncing(entryId);
    const res = await syncTimeEntryToQB(entryId);
    setIsSyncing(null);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Synced to QuickBooks!');
      // Update local state to reflect synced status
      setEntries(entries.map(e => e.id === entryId ? { ...e, status: 'synced' } : e));
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0h 0m';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  const groupByJobTaskDay = (rawEntries: any[]) => {
    const jobs: Record<string, any> = {};
    rawEntries.forEach(entry => {
      const jobKey = entry.proformas?.id || 'general';
      const jobName = entry.proformas ? `${entry.proformas.project_name} - #${entry.proformas.number}` : 'General / Unlinked';
      if (!jobs[jobKey]) jobs[jobKey] = { name: jobName, tasks: {}, totalSeconds: 0 };

      const taskKey = entry.task_id || 'general';
      const taskTitle = entry.job_tasks?.title || 'General Task';
      if (!jobs[jobKey].tasks[taskKey]) jobs[jobKey].tasks[taskKey] = { title: taskTitle, days: {}, totalSeconds: 0 };

      const dayKey = new Date(entry.start_time).toLocaleDateString();
      if (!jobs[jobKey].tasks[taskKey].days[dayKey]) jobs[jobKey].tasks[taskKey].days[dayKey] = { date: dayKey, entries: [], totalSeconds: 0 };

      const isApproved = entry.status === 'approved' || entry.status === 'synced';
      if (isApproved) {
        jobs[jobKey].totalSeconds += (entry.duration_seconds || 0);
        jobs[jobKey].tasks[taskKey].totalSeconds += (entry.duration_seconds || 0);
        jobs[jobKey].tasks[taskKey].days[dayKey].totalSeconds += (entry.duration_seconds || 0);
      }
      jobs[jobKey].tasks[taskKey].days[dayKey].entries.push(entry);
    });
    return jobs;
  };

  const groupedJobs = groupByJobTaskDay(entries);
  const globalTotalSeconds = entries.reduce((acc, e) => (e.status === 'approved' || e.status === 'synced' ? acc + (e.duration_seconds || 0) : acc), 0);

  return (
    <div className="space-y-10">
      {/* Global Summary */}
      <div className="bg-[#0D3B47] text-white p-6 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-1">Approved Balance</p>
          <h2 className="text-4xl font-black font-mono tracking-tighter">{formatDuration(globalTotalSeconds)}</h2>
        </div>
        <div className="text-right">
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Total Entries</p>
          <p className="text-xl font-bold">{entries.length}</p>
        </div>
      </div>

      {Object.entries(groupedJobs).map(([jobId, job]: [string, any]) => (
        <div key={jobId} className="space-y-6">
          {/* Job Header */}
          <button
            onClick={() => toggleSection(jobId)}
            className="w-full flex items-center justify-between border-b border-border/60 pb-3 mt-8 hover:bg-muted/5 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Hash className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-black text-[#0D3B47] uppercase tracking-tight flex items-center gap-2">
                {job.name}
                <ChevronRight className={cn("h-5 w-5 text-muted-foreground transition-transform duration-300", isExpanded(jobId) ? "rotate-90" : "")} />
              </h2>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Job Total</p>
              <p className="text-lg font-mono font-black text-emerald-600">{formatDuration(job.totalSeconds)}</p>
            </div>
          </button>

          {isExpanded(jobId) && (
            <div className="pl-4 border-l-2 border-border/30 space-y-8">
              {Object.entries(job.tasks).map(([taskId, task]: [string, any]) => (
                <div key={taskId} className="space-y-4">
                  {/* Task Header */}
                  <button
                    onClick={() => toggleSection(`${jobId}-${taskId}`)}
                    className="w-full flex items-center justify-between bg-muted/50 p-3 rounded-xl border border-border/40 hover:bg-muted/80 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronRight className={cn("h-4 w-4 text-primary transition-transform duration-300", isExpanded(`${jobId}-${taskId}`) ? "rotate-90" : "")} />
                      <span className="font-bold text-sm text-foreground uppercase tracking-wide">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">Task Total:</span>
                      <span className="font-mono font-black text-sm text-emerald-600">{formatDuration(task.totalSeconds)}</span>
                    </div>
                  </button>

                  {isExpanded(`${jobId}-${taskId}`) && (
                    <div className="space-y-4">
                      {Object.values(task.days).map((day: any) => (
                        <div key={day.date} className="space-y-2">
                          {/* Day Sub-header */}
                          <div className="flex items-center justify-between px-3 py-1 bg-slate-50 border-y border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase">{day.date}</span>
                            <span className="text-[10px] font-black text-emerald-600/60 uppercase">Day: {formatDuration(day.totalSeconds)}</span>
                          </div>

                          <div className="grid gap-2">
                            {day.entries.map((entry: any) => (
                              <Card key={entry.id} className={cn(
                                "border-border/40 shadow-none overflow-hidden transition-all",
                                entry.status === 'rejected' ? 'opacity-50 line-through grayscale' : ''
                              )}>
                                <CardContent className="p-0 flex flex-col md:flex-row items-center">
                                  <div className="p-4 flex-1 flex items-center justify-between w-full">
                                    <div className="flex items-center gap-4">
                                      <div className="hidden sm:block h-8 w-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-[10px] font-black text-[#0D3B47] shadow-inner">
                                        {entry.team_members?.name?.[0]}
                                      </div>
                                      <div>
                                        <p className="font-bold text-sm text-[#0D3B47]">{entry.team_members?.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <Badge variant="outline" className={cn(
                                            "text-[8px] font-black uppercase tracking-widest h-4",
                                            entry.status === 'synced' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                              entry.status === 'approved' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                entry.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                  'bg-slate-50'
                                          )}>
                                            {entry.status}
                                          </Badge>
                                          {entry.status === 'synced' && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-lg font-mono font-black text-[#0D3B47] uppercase">
                                        {entry.status === 'active' ? '—' : formatDuration(entry.duration_seconds)}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex border-t md:border-t-0 md:border-l border-border/40 w-full md:w-auto shrink-0 bg-muted/5">
                                    {entry.status === 'synced' ? (
                                      <div className="px-6 py-4 flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase whitespace-nowrap">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Synchronized
                                      </div>
                                    ) : entry.status === 'active' ? (
                                      <div className="px-6 py-4 text-[10px] font-black text-amber-600 uppercase animate-pulse italic">
                                        Timer Running
                                      </div>
                                    ) : (
                                      <div className="flex w-full">
                                        {entry.status === 'completed' && (
                                          <>
                                            <button
                                              onClick={() => handleStatusUpdate(entry.id, 'approved')}
                                              disabled={isProcessing === entry.id}
                                              className="flex-1 px-4 py-4 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors flex items-center justify-center gap-2"
                                              title="Approve"
                                            >
                                              {isProcessing === entry.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                              <span className="md:hidden text-[10px] font-bold">APPROVE</span>
                                            </button>
                                            <button
                                              onClick={() => handleStatusUpdate(entry.id, 'rejected')}
                                              disabled={isProcessing === entry.id}
                                              className="flex-1 px-4 py-4 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center gap-2 border-l border-red-100"
                                              title="Reject"
                                            >
                                              <X className="h-4 w-4" />
                                              <span className="md:hidden text-[10px] font-bold">REJECT</span>
                                            </button>
                                          </>
                                        )}

                                        {(entry.status === 'approved' || entry.status === 'rejected') && (
                                          <button
                                            onClick={() => handleStatusUpdate(entry.id, 'completed')}
                                            disabled={isProcessing === entry.id}
                                            className="flex-1 px-4 py-4 text-muted-foreground hover:bg-slate-100 transition-colors text-[10px] font-bold uppercase tracking-widest"
                                          >
                                            Undo
                                          </button>
                                        )}

                                        {entry.status === 'approved' && (
                                          <button
                                            onClick={() => handleSyncButton(entry)}
                                            disabled={isSyncing === entry.id || !hasQuickbooks}
                                            className="px-6 py-4 bg-[#0D3B47] text-white hover:bg-[#082229] transition-colors flex items-center gap-2 border-l border-white/10"
                                          >
                                            {isSyncing === entry.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                            <span className="text-[10px] font-black uppercase">Sync</span>
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {entries.length === 0 && (
        <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border/50">
          <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-lg font-medium text-muted-foreground">No time entries found yet.</p>
        </div>
      )}

      {/* Mapping Modal */}
      <Dialog open={mapModalOpen} onOpenChange={setMapModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>MAP TEAM MEMBER</DialogTitle>
            <DialogDescription>
              Link "{mappingEntry?.team_members?.name}" to a QuickBooks record for synchronization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isLoadingQBO ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Type *</label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={selectedQBOType === 'Employee' ? 'default' : 'secondary'}
                        onClick={() => { setSelectedQBOType('Employee'); setSelectedQBOId(''); }}
                        className="flex-1"
                      >
                        Employee
                      </Button>
                      <Button
                        type="button"
                        variant={selectedQBOType === 'Vendor' ? 'default' : 'secondary'}
                        onClick={() => { setSelectedQBOType('Vendor'); setSelectedQBOId(''); }}
                        className="flex-1"
                      >
                        Vendor
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">QuickBooks Match *</label>
                  <Select onValueChange={(val) => setSelectedQBOId(val || '')} value={selectedQBOId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select one..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(selectedQBOType === 'Employee' ? qboData.employees : qboData.vendors).map(item => (
                        <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setMapModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveMappingAndSync} disabled={!selectedQBOId || isLoadingQBO} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl">
              Confirm & Sync
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
