import { createClient } from '@/lib/supabase/server';
import GlobalGanttChart from './components/GlobalGanttChart';
import { GanttChart } from 'lucide-react';

export const revalidate = 0;

export default async function GanttPage() {
  const supabase = await createClient();

  // Fetch job tasks with their associated project (proforma) and team member
  const { data: tasks, error: tasksError } = await supabase
    .from('job_tasks')
    .select(`
      *,
      team_members (name, id),
      proformas (id, project_name, status, clients (company_name, name, last_name)),
      proforma_items:proforma_item_id (id, description)
    `)
    .order('due_date', { ascending: true });

  if (tasksError) {
    console.error('Error fetching tasks for gantt:', tasksError);
  }

  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('id, name')
    .order('name');

  // Fetch proforma items to allow manual associations in modales
  const { data: proformaItems } = await supabase
    .from('proforma_items')
    .select('id, description, proforma_id');

  // Fetch all active jobs (projects) even if they have no tasks
  const { data: jobs } = await supabase
    .from('proformas')
    .select('id, project_name, status, job_start_at, job_end_at, clients (company_name, name, last_name)')
    .in('status', ['job', 'in_progress']); // Assuming active jobs are not draft
  //.not('status', 'eq', 'rejected');

  const activeTasks = (tasks || []) as any[];
  const activeTeamMembers = (teamMembers || []) as any[];
  const activeProformaItems = (proformaItems || []) as any[];
  const activeJobs = (jobs || []) as any[];

  return (
    <div className="container mx-auto px-4 py-8 max-w-[1600px] animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <GanttChart className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-1">Diagrama de Gantt</h1>
              <p className="text-muted-foreground text-sm">Visualiza y planifica la línea de tiempo de todas las tareas y proyectos.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border/40 shadow-sm overflow-hidden">
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
