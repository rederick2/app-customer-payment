import { createClient } from '@/lib/supabase/server';
import JobCalendarView from '@/components/JobCalendarView';
import { Calendar as CalendarIcon } from 'lucide-react';

export const revalidate = 0;

export default async function CalendarPage() {
  const supabase = await createClient();

  // Fetch all proformas with status 'job', including client info
  const { data: jobs, error } = await supabase
    .from('proformas')
    .select(`
      id,
      project_name,
      job_start_at,
      job_end_at,
      clients (
        name,
        company_name,
        street_1
      )
    `)
    .eq('status', 'job')
    .order('job_start_at', { ascending: true });

  if (error) {
    console.error('Error fetching jobs for calendar:', error);
  }

  // Fetch job tasks
  const { data: tasks, error: tasksError } = await supabase
    .from('job_tasks')
    .select(`
      *,
      team_members (name),
      proformas (clients (street_1))
    `)
    .order('due_date', { ascending: true });

  //console.log(tasks)

  if (tasksError) {
    console.error('Error fetching tasks for calendar:', tasksError);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-2">Calendario de Jobs</h1>
          <p className="text-muted-foreground">Visualiza y gestiona las fechas de tus proyectos programados.</p>
        </div>
      </div>

      <JobCalendarView jobs={(jobs as any) || []} tasks={(tasks as any) || []} />
    </div>
  );
}
