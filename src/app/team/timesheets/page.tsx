import { createClient, createAdminClient } from '@/lib/supabase/server';
import { Clock, CheckCircle, Calendar, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import FormattedTimeRange from './components/FormattedTimeRange';

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
      <div className="p-10 text-center">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-foreground">Worker Profile Not Found</h2>
        <p className="text-sm text-muted-foreground mt-2">Please contact your administrator to link your account.</p>
      </div>
    );
  }

  // Use admin client to ensure we see all entries regardless of RLS complexity on joins
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

  if (entriesError) {
    console.error('Error fetching entries:', entriesError);
  }

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

      // Sum only approved/synced for the "Total Approved" but track everything
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
  const totalApprovedSeconds = rawEntries.reduce((acc, e) => (e.status === 'approved' || e.status === 'synced' ? acc + (e.duration_seconds || 0) : acc), 0);

  return (
    <div className="flex flex-col bg-[#f8fafc] overflow-y-auto" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Header */}
      <div className="bg-white border-b border-border/30 px-5 py-4 shrink-0 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-archivo text-lg font-bold text-foreground">My Timesheets</h1>
              <p className="text-[11px] text-muted-foreground">
                {rawEntries.length} entries · <span className="text-emerald-600 font-bold">Total Approved: {formatDuration(totalApprovedSeconds)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-10 max-w-2xl w-full mx-auto">
        {rawEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-sm gap-2">
            <Clock className="h-12 w-12 opacity-10" />
            <p className="font-medium">No time entries recorded yet.</p>
          </div>
        ) : (
          Object.entries(groupedJobs).map(([jobId, job]: [string, any]) => (
            <div key={jobId} className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <h2 className="text-sm font-black text-[#0D3B47] uppercase tracking-wide">{job.name}</h2>
                <span className="text-xs font-mono font-bold text-emerald-600">{formatDuration(job.totalSeconds)}</span>
              </div>

              <div className="space-y-6 pl-2 border-l border-border/40 ml-1">
                {Object.entries(job.tasks).map(([taskId, task]: [string, any]) => (
                  <div key={taskId} className="space-y-3">
                    <div className="flex items-center justify-between bg-white/50 px-3 py-1.5 rounded-lg border border-border/30">
                      <h3 className="text-[11px] font-bold text-muted-foreground uppercase">{task.title}</h3>
                      <span className="text-[11px] font-mono font-black text-emerald-600/70">{formatDuration(task.totalSeconds)}</span>
                    </div>

                    <div className="space-y-4">
                      {Object.entries(task.days).map(([dayId, day]: [string, any]) => (
                        <div key={dayId} className="space-y-2">
                          <div className="flex items-center justify-between px-3 h-6 bg-slate-100/50 rounded-md">
                            <span className="text-[9px] font-black text-slate-400 uppercase">{day.date}</span>
                            <span className="text-[9px] font-black text-emerald-600/40 uppercase">Day Approved: {formatDuration(day.totalSeconds)}</span>
                          </div>

                          <div className="space-y-2">
                            {day.entries.map((entry: any) => {
                              const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
                                completed: { label: 'Pending Approval', color: 'text-amber-600', icon: Clock },
                                approved: { label: 'Approved', color: 'text-blue-600', icon: CheckCircle },
                                synced: { label: 'Synced to QBO', color: 'text-emerald-600', icon: CheckCircle },
                                rejected: { label: 'Rejected', color: 'text-red-500', icon: X }
                              };
                              const config = statusConfig[entry.status as string] || statusConfig.completed;
                              const StatusIcon = config.icon;

                              return (
                                <div key={entry.id} className={cn(
                                  "bg-white rounded-xl border border-border/20 p-3 shadow-sm transition-all",
                                  entry.status === 'rejected' && 'opacity-50 grayscale line-through'
                                )}>
                                  <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                                        <Calendar className="h-3 w-3" />
                                        <FormattedTimeRange startTime={entry.start_time} endTime={entry.end_time} />
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <StatusIcon className={cn("h-3 w-3", config.color)} />
                                        <span className={cn("text-[10px] font-bold uppercase tracking-wider", config.color)}>{config.label}</span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className={cn("text-lg font-mono font-black", config.color)}>
                                        {formatDuration(entry.duration_seconds)}
                                      </p>
                                    </div>
                                  </div>
                                  {entry.notes && (
                                    <p className="mt-2 pt-2 border-t border-border/10 text-[11px] text-muted-foreground italic leading-relaxed">
                                      "{entry.notes}"
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
