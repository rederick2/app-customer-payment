import { createClient, createAdminClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, MapPin, FileText, CalendarIcon } from 'lucide-react';
import TaskTimerClient from './components/TaskTimerClient';

export default async function TeamTasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: teamMember } = await supabase
    .from('team_members')
    .select('*, auth_user_id')
    .eq('auth_user_id', user?.id)
    .single();

  if (!teamMember) return <div className="p-6 text-center text-red-500 font-bold">Access error: You don't appear to be set up as a team member.</div>;

  const supabaseAdmin = createAdminClient();

  // Get tasks assigned to them
  const { data: tasks } = await supabaseAdmin
    .from('job_tasks')
    .select('*, proformas(*,clients(*))')
    .eq('assigned_to', teamMember.id)
    .neq('status', 'completed')
    .order('created_at', { ascending: false });

  // Get active time entry (if any)
  const { data: activeEntry } = await supabaseAdmin
    .from('time_entries')
    .select('*')
    .eq('team_member_id', teamMember.id)
    .eq('status', 'active')
    .maybeSingle();

  return (
    <div className="p-4 md:p-6 overflow-y-auto w-full max-w-4xl mx-auto pb-24">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl  text-[#0D3B47] mb-1 md:mb-2">Your Tasks</h1>
        <p className="text-sm md:text-base text-muted-foreground">Select a task and clock in when you begin.</p>
      </div>

      <div className="space-y-4 md:space-y-6">
        {(!tasks || tasks.length === 0) ? (
          <Card className="border-dashed bg-muted/10 pb-4">
            <CardContent className="pt-6 text-center text-muted-foreground text-sm">
              No active tasks assigned.
            </CardContent>
          </Card>
        ) : (
          tasks.map(task => (
            <Card key={task.id} className="shadow-sm border-border/50 overflow-hidden">
              <CardHeader className="pb-3 bg-muted/10">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-base font-bold text-[#0D3B47] leading-tight">
                    {task.title}
                  </CardTitle>
                  <Badge variant="outline" className={`shrink-0 uppercase tracking-widest text-[9px] font-black ${task.status === 'in_progress' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                    {task.status?.replace('_', ' ') || 'Pending'}
                  </Badge>
                </div>
                <div className="text-[11px] uppercase tracking-wider font-extrabold text-primary flex items-center gap-1.5 mt-2">
                  <FileText className="h-3 w-3" />
                  {task.proformas?.project_name} - #{task.proformas?.number}
                </div>
              </CardHeader>

              <CardContent className="pt-4 flex flex-col space-y-4">
                {task.description && (
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{task.description}</p>
                )}

                {task.proformas?.clients?.street_1 && (
                  <div className="flex gap-2 text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-lg border border-border/40">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium">{task.proformas.clients.street_1}</span>
                  </div>
                )}

                {/* TIMER INJECTED HERE */}
                {task.proforma_id && (
                  <TaskTimerClient
                    teamMemberId={teamMember.id}
                    proformaId={task.proforma_id}
                    globalActiveEntry={activeEntry}
                  />
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
