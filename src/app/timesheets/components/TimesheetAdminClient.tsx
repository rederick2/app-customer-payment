'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, RefreshCw, CheckCircle2, Clock, Hash, Check, X, Timer } from 'lucide-react';
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
    if (!hasQuickbooks) { toast.error('Connect QuickBooks in Settings first.'); return; }
    if (entry.status === 'active') { toast.error('Cannot sync an active timer.'); return; }
    if (entry.team_members.qbo_employee_id) {
      performSync(entry.id);
    } else {
      setMappingEntry(entry);
      setMapModalOpen(true);
      fetchMappingData();
    }
  };

  const fetchMappingData = async () => {
    setIsLoadingQBO(true);
    const res = await fetchQBOEmployeesAndVendors();
    setIsLoadingQBO(false);
    if (res.error) { toast.error(res.error); setMapModalOpen(false); }
    else if (res.data) setQboData(res.data);
  };

  const handleSaveMappingAndSync = async () => {
    if (!selectedQBOId) { toast.error('Please select an employee or vendor'); return; }
    setIsSyncing(mappingEntry.id);
    setMapModalOpen(false);
    const mapRes = await linkQBOTeamMember(mappingEntry.team_member_id, selectedQBOId, selectedQBOType);
    if (mapRes.error) { toast.error(mapRes.error); setIsSyncing(null); return; }
    performSync(mappingEntry.id);
  };

  const performSync = async (entryId: string) => {
    setIsSyncing(entryId);
    const res = await syncTimeEntryToQB(entryId);
    setIsSyncing(null);
    if (res.error) toast.error(res.error);
    else {
      toast.success('Synced to QuickBooks!');
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

  const statusVariant = (status: string): 'success' | 'warning' | 'destructive' | 'secondary' | 'default' => {
    if (status === 'synced') return 'success';
    if (status === 'approved') return 'default';
    if (status === 'rejected') return 'destructive';
    if (status === 'completed') return 'warning';
    return 'secondary';
  };

  const statusLabel = (status: string) => {
    if (status === 'synced') return 'Synced';
    if (status === 'approved') return 'Approved';
    if (status === 'rejected') return 'Rejected';
    if (status === 'completed') return 'Pending';
    if (status === 'active') return 'Running';
    return status;
  };

  return (
    <div className="space-y-6">
      {/* Global Summary Card */}
      <Card className="border-border/40 bg-primary/5">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Approved Balance</p>
            <h2 className="text-4xl font-black font-mono tracking-tighter text-primary">{formatDuration(globalTotalSeconds)}</h2>
          </div>
          <Separator orientation="vertical" className="h-12" />
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Entries</p>
            <p className="text-2xl font-bold text-foreground">{entries.length}</p>
          </div>
        </CardContent>
      </Card>

      {entries.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border/50">
          <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-lg font-medium text-muted-foreground">No time entries found yet.</p>
        </div>
      ) : (
        /* Jobs Accordion — all collapsed by default */
        <Accordion multiple={true} defaultValue={[]} className="space-y-3">
          {Object.entries(groupedJobs).map(([jobId, job]: [string, any]) => (
            <AccordionItem
              key={jobId}
              value={jobId}
              className="border border-border/40 rounded-xl overflow-hidden bg-card"
            >
              <AccordionTrigger className="px-5 py-4 hover:bg-muted/30 hover:no-underline transition-colors rounded-xl">
                <div className="flex items-center gap-3 flex-1 text-left">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Hash className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-foreground uppercase tracking-tight truncate">{job.name}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Job total (approved)</p>
                  </div>
                </div>
                <span className="font-mono font-black text-sm text-primary mr-3">{formatDuration(job.totalSeconds)}</span>
              </AccordionTrigger>

              <AccordionContent className="border-t border-border/40 bg-muted/10 px-4 py-4">
                {/* Tasks Accordion — also collapsed */}
                <Accordion multiple={true} defaultValue={[]} className="space-y-2">
                  {Object.entries(job.tasks).map(([taskId, task]: [string, any]) => (
                    <AccordionItem
                      key={taskId}
                      value={`${jobId}-${taskId}`}
                      className="border border-border/30 rounded-xl overflow-hidden bg-card"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 hover:no-underline transition-colors rounded-xl">
                        <div className="flex items-center gap-2 flex-1 text-left">
                          <p className="font-bold text-sm text-foreground uppercase tracking-wide">{task.title}</p>
                        </div>
                        <span className="font-mono font-black text-xs text-muted-foreground mr-3">
                          {formatDuration(task.totalSeconds)}
                        </span>
                      </AccordionTrigger>

                      <AccordionContent className="border-t border-border/30 px-3 py-3">
                        <div className="space-y-3">
                          {Object.values(task.days).map((day: any) => (
                            <div key={day.date} className="space-y-2">
                              {/* Day sub-header */}
                              <div className="flex items-center justify-between px-2 py-1 rounded-md bg-muted/50">
                                <span className="text-[10px] font-black text-muted-foreground uppercase">{day.date}</span>
                                <span className="text-[10px] font-black text-primary/60 uppercase">Approved: {formatDuration(day.totalSeconds)}</span>
                              </div>

                              {/* Entries */}
                              <div className="grid gap-2">
                                {day.entries.map((entry: any) => (
                                  <Card key={entry.id} className={cn(
                                    "border-border/40 shadow-none overflow-hidden",
                                    entry.status === 'rejected' && 'opacity-50 grayscale'
                                  )}>
                                    <CardContent className="p-0 flex flex-col md:flex-row items-stretch">
                                      {/* Entry info */}
                                      <div className="p-4 flex-1 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                          <Avatar className="h-8 w-8 shrink-0 hidden sm:flex">
                                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-black">
                                              {entry.team_members?.name?.[0]}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <p className="font-bold text-sm text-foreground">{entry.team_members?.name}</p>
                                            <Badge variant={statusVariant(entry.status)} className="text-[9px] mt-0.5 h-4">
                                              {statusLabel(entry.status)}
                                              {entry.status === 'synced' && <CheckCircle2 className="ml-1 h-2.5 w-2.5" />}
                                              {entry.status === 'active' && <Timer className="ml-1 h-2.5 w-2.5 animate-pulse" />}
                                            </Badge>
                                          </div>
                                        </div>
                                        <p className="text-lg font-mono font-black text-foreground">
                                          {entry.status === 'active' ? '—' : formatDuration(entry.duration_seconds)}
                                        </p>
                                      </div>

                                      {/* Action buttons */}
                                      <div className="flex border-t md:border-t-0 md:border-l border-border/40 shrink-0">
                                        {entry.status === 'synced' ? (
                                          <div className="px-5 py-4 flex items-center gap-2 text-primary font-black text-[10px] uppercase whitespace-nowrap">
                                            <CheckCircle2 className="h-4 w-4" />
                                            Synchronized
                                          </div>
                                        ) : entry.status === 'active' ? (
                                          <div className="px-5 py-4 text-[10px] font-black text-amber-600 uppercase animate-pulse italic">
                                            Timer Running
                                          </div>
                                        ) : (
                                          <div className="flex w-full">
                                            {entry.status === 'completed' && (
                                              <>
                                                <button
                                                  onClick={() => handleStatusUpdate(entry.id, 'approved')}
                                                  disabled={isProcessing === entry.id}
                                                  className="flex-1 px-4 py-4 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center gap-2"
                                                  title="Approve"
                                                >
                                                  {isProcessing === entry.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                  <span className="md:hidden text-[10px] font-bold">APPROVE</span>
                                                </button>
                                                <button
                                                  onClick={() => handleStatusUpdate(entry.id, 'rejected')}
                                                  disabled={isProcessing === entry.id}
                                                  className="flex-1 px-4 py-4 bg-destructive/5 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors flex items-center justify-center gap-2 border-l border-border/40"
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
                                                className="flex-1 px-4 py-4 text-muted-foreground hover:bg-muted/50 transition-colors text-[10px] font-bold uppercase tracking-widest"
                                              >
                                                Undo
                                              </button>
                                            )}
                                            {entry.status === 'approved' && (
                                              <button
                                                onClick={() => handleSyncButton(entry)}
                                                disabled={isSyncing === entry.id || !hasQuickbooks}
                                                className="px-5 py-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 border-l border-primary/20"
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
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Mapping Modal */}
      <Dialog open={mapModalOpen} onOpenChange={setMapModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Map Team Member</DialogTitle>
            <DialogDescription>
              Link &ldquo;{mappingEntry?.team_members?.name}&rdquo; to a QuickBooks record for synchronization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isLoadingQBO ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
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
            <Button onClick={handleSaveMappingAndSync} disabled={!selectedQBOId || isLoadingQBO}>
              Confirm &amp; Sync
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
