import { createClient, createAdminClient } from '@/lib/supabase/server';
import { Clock, CheckCircle, Calendar, X, AlertTriangle, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import FormattedTimeRange from './components/FormattedTimeRange';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

function formatDuration(seconds: number | null) {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default async function TeamTimesheetsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: teamMember, error: tmError } = await supabase
    .from('team_members')
    .select('id, name, user_id, auth_user_id')
    .or(`auth_user_id.eq.${user?.id},user_id.eq.${user?.id}`)
    .maybeSingle();

  if (!teamMember) {
    console.error('No team member found for user:', user?.id, 'Error:', tmError);
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-10 text-center">
        <div className="h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Worker Profile Not Found</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs">Please contact your administrator to link your account.</p>
      </div>
    );
  }

  const admin = createAdminClient();
  const { data: entries, error: entriesError } = await admin
    .from('time_entries')
    .select(`
      id, start_time, end_time, duration_seconds, status, notes,
      proformas ( id, project_name, number, clients ( name, last_name, company_name ) ),
      job_tasks:task_id(id, title)
    `)
    .eq('team_member_id', teamMember.id)
    .order('start_time', { ascending: false });

  if (entriesError) console.error('Error fetching entries:', entriesError);

  const rawEntries = (entries || []).filter(e => e.status !== 'active');

  const groupByJobTaskDay = (raw: any[]) => {
    const jobs: Record<string, any> = {};
    raw.forEach(entry => {
      const jobKey = entry.proformas?.id || 'general';
      const jobName = entry.proformas ? `${entry.proformas.project_name} - #${entry.proformas.number}` : 'General / Unlinked';
      if (!jobs[jobKey]) jobs[jobKey] = { name: jobName, tasks: {}, totalSeconds: 0 };

      const taskKey = entry.job_tasks?.id || 'general';
      const taskTitle = entry.job_tasks?.title || 'General Task';
      if (!jobs[jobKey].tasks[taskKey]) jobs[jobKey].tasks[taskKey] = { title: taskTitle, days: {}, totalSeconds: 0 };

      const dayKey = new Date(entry.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      if (!jobs[jobKey].tasks[taskKey].days[dayKey]) jobs[jobKey].tasks[taskKey].days[dayKey] = { date: dayKey, entries: [], totalSeconds: 0 };

      if (entry.status === 'approved' || entry.status === 'synced') {
        jobs[jobKey].totalSeconds += (entry.duration_seconds || 0);
        jobs[jobKey].tasks[taskKey].totalSeconds += (entry.duration_seconds || 0);
        jobs[jobKey].tasks[taskKey].days[dayKey].totalSeconds += (entry.duration_seconds || 0);
      }
      jobs[jobKey].tasks[taskKey].days[dayKey].entries.push(entry);
    });
    return jobs;
  };

  const groupedJobs = groupByJobTaskDay(rawEntries);
  const totalApprovedSeconds = rawEntries.reduce(
    (acc, e) => (e.status === 'approved' || e.status === 'synced' ? acc + (e.duration_seconds || 0) : acc),
    0
  );

  const statusConfig: Record<string, { label: string; variant: 'success' | 'default' | 'warning' | 'destructive' | 'secondary' }> = {
    completed: { label: 'Pending Approval', variant: 'warning' },
    approved:  { label: 'Approved',         variant: 'default' },
    synced:    { label: 'Synced to QBO',    variant: 'success' },
    rejected:  { label: 'Rejected',         variant: 'destructive' },
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <Clock className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Timesheets</h1>
          <p className="text-[11px] text-muted-foreground">
            {rawEntries.length} entries
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="border-border/40 bg-primary/5 mb-6">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Approved</p>
            <p className="text-3xl font-black font-mono tracking-tighter text-primary">{formatDuration(totalApprovedSeconds)}</p>
          </div>
          <Separator orientation="vertical" className="h-10" />
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Entries</p>
            <p className="text-2xl font-bold text-foreground">{rawEntries.length}</p>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {rawEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
          <Clock className="h-12 w-12 opacity-10" />
          <p className="font-medium">No time entries recorded yet.</p>
        </div>
      ) : (
        /* Jobs — all collapsed by default */
        <Accordion multiple={true} defaultValue={[]} className="space-y-3">
          {Object.entries(groupedJobs).map(([jobId, job]: [string, any]) => (
            <AccordionItem
              key={jobId}
              value={jobId}
              className="border border-border/40 rounded-xl overflow-hidden bg-card"
            >
              <AccordionTrigger className="px-4 py-3.5 hover:bg-muted/30 hover:no-underline transition-colors rounded-xl">
                <div className="flex items-center gap-3 flex-1 text-left">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Hash className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-xs text-foreground uppercase tracking-tight truncate">{job.name}</p>
                    <p className="text-[10px] text-muted-foreground">Approved total</p>
                  </div>
                </div>
                <span className="font-mono font-black text-sm text-primary mr-3">{formatDuration(job.totalSeconds)}</span>
              </AccordionTrigger>

              <AccordionContent className="border-t border-border/40 bg-muted/10 px-3 py-3">
                <Accordion multiple={true} defaultValue={[]} className="space-y-2">
                  {Object.entries(job.tasks).map(([taskId, task]: [string, any]) => (
                    <AccordionItem
                      key={taskId}
                      value={`${jobId}-${taskId}`}
                      className="border border-border/30 rounded-xl overflow-hidden bg-card"
                    >
                      <AccordionTrigger className="px-4 py-2.5 hover:bg-muted/50 hover:no-underline transition-colors rounded-xl">
                        <div className="flex items-center gap-2 flex-1 text-left">
                          <p className="font-bold text-xs text-foreground uppercase tracking-wide">{task.title}</p>
                        </div>
                        <span className="font-mono font-black text-xs text-muted-foreground mr-3">{formatDuration(task.totalSeconds)}</span>
                      </AccordionTrigger>

                      <AccordionContent className="border-t border-border/30 px-3 py-3">
                        <div className="space-y-3">
                          {Object.entries(task.days).map(([dayId, day]: [string, any]) => (
                            <div key={dayId} className="space-y-2">
                              {/* Day sub-header */}
                              <div className="flex items-center justify-between px-2 py-1 rounded-md bg-muted/50">
                                <span className="text-[9px] font-black text-muted-foreground uppercase">{day.date}</span>
                                <span className="text-[9px] font-black text-primary/60 uppercase">Approved: {formatDuration(day.totalSeconds)}</span>
                              </div>

                              {/* Entry cards */}
                              <div className="space-y-2">
                                {day.entries.map((entry: any) => {
                                  const cfg = statusConfig[entry.status] || statusConfig.completed;
                                  return (
                                    <Card key={entry.id} className={cn(
                                      "border-border/20 shadow-none",
                                      entry.status === 'rejected' && 'opacity-50 grayscale'
                                    )}>
                                      <CardContent className="p-3">
                                        <div className="flex items-start justify-between">
                                          <div className="space-y-1.5">
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                              <Calendar className="h-3 w-3" />
                                              <FormattedTimeRange startTime={entry.start_time} endTime={entry.end_time} />
                                            </div>
                                            <Badge variant={cfg.variant} className="text-[9px] h-4">
                                              {cfg.label}
                                            </Badge>
                                          </div>
                                          <p className={cn(
                                            "text-lg font-mono font-black",
                                            entry.status === 'synced' ? 'text-primary' :
                                            entry.status === 'approved' ? 'text-foreground' :
                                            entry.status === 'rejected' ? 'text-destructive' :
                                            'text-muted-foreground'
                                          )}>
                                            {formatDuration(entry.duration_seconds)}
                                          </p>
                                        </div>
                                        {entry.notes && (
                                          <p className="mt-2 pt-2 border-t border-border/10 text-[11px] text-muted-foreground italic leading-relaxed">
                                            &ldquo;{entry.notes}&rdquo;
                                          </p>
                                        )}
                                      </CardContent>
                                    </Card>
                                  );
                                })}
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
    </div>
  );
}
