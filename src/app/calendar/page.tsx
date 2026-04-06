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
      number,
      project_name,
      job_start_at,
      job_end_at,
      clients (
        name,
        company_name,
        street_1
      )
    `)
    .notIn('status', ['job_terminated', 'rejected', 'draft'])
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

  // Fetch service requests
  const { data: requests, error: requestsError } = await supabase
    .from('service_requests')
    .select(`
      *,
      proformas (
        id,
        number,
        project_name,
        clients (
          name,
          company_name,
          street_1
        )
      )
    `)
    .order('schedule_date', { ascending: true });

  // Fetch job visits
  const { data: visits, error: visitsError } = await supabase
    .from('job_visits')
    .select(`
      *,
      proformas (
        id,
        number,
        project_name,
        clients (
          name,
          company_name,
          street_1
        )
      )
    `)
    .order('visit_date', { ascending: true });

  if (error || tasksError || requestsError || visitsError) {
    console.error('Error fetching calendar data:', error || tasksError || requestsError || visitsError);
    return <div>Error loading calendar data.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-2">Calendario de Jobs</h1>
          <p className="text-muted-foreground">Visualiza y gestiona las fechas de tus proyectos programados.</p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <JobCalendarView
          jobs={(jobs as any) || []}
          tasks={(tasks as any) || []}
          requests={(requests as any) || []}
          visits={(visits as any) || []}
        />
      </div>
    </div>
  );
}
