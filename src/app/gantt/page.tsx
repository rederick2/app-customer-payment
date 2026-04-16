import { createClient } from '@/lib/supabase/server';
import GlobalGanttChart from './components/GlobalGanttChart';
import { GanttChart } from 'lucide-react';

export const revalidate = 0;

export default async function GanttPage() {
  const supabase = await createClient();

  // Get current user so we only see our own data
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('id, name')
    .eq('user_id', userId)
    .order('name');

  // Fetch active jobs WITH their nested tasks and items — scoped to this user
  const { data: jobs, error: jobsError } = await supabase
    .from('proformas')
    .select(`
      id,
      project_name,
      job_start_at,
      job_end_at,
      clients (company_name, name, last_name),
      proforma_items (id, description, proforma_id),
      job_tasks (
        id,
        title,
        description,
        status,
        due_date,
        end_date,
        percentage,
        color,
        assigned_to,
        proforma_id,
        team_members (id, name),
        proforma_item_id
      )
    `)
    //.eq('user_id', userId)
    .in('status', ['job', 'in_progress'])
    .order('job_start_at', { ascending: true });

  if (jobsError) {
    console.error('Error fetching jobs for gantt:', jobsError);
  }

  const activeJobs = (jobs || []) as any[];

  // Flatten tasks from inside jobs (so each task has its proforma context)
  const activeTasks = activeJobs.flatMap((job: any) =>
    (job.job_tasks || []).map((task: any) => ({
      ...task,
      proformas: {
        id: job.id,
        project_name: job.project_name,
        status: job.status,
        clients: job.clients,
      },
    }))
  );

  // Flatten proforma_items from all jobs
  const activeProformaItems = activeJobs.flatMap((job: any) => job.proforma_items || []);

  const activeTeamMembers = (teamMembers || []) as any[];

  return (
    <div className="container mx-auto px-4 py-8 max-w-[1600px] animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <GanttChart className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1">Gantt Chart</h1>
              <p className="text-muted-foreground text-sm">Visualize and plan the timeline of all tasks and projects.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden">
        <GlobalGanttChart
          tasks={activeTasks}
          teamMembers={activeTeamMembers}
          proformaItems={activeProformaItems}
          activeJobs={activeJobs}
        />
      </div>
    </div>
  );
}
