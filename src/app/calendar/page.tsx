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
    .not('status', 'eq', 'cancelled')
    .order('schedule_date', { ascending: true });

  // Fetch job visits
  const { data: visits, error: visitsError } = await supabase
    .from('job_visits')
    .select(`
      *,
      team_members (name),
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

  // Fetch team members
  const { data: teamMembers, error: teamMembersError } = await supabase
    .from('team_members')
    .select('*')
    .order('name', { ascending: true });

  if (error || tasksError || requestsError || visitsError || teamMembersError) {
    console.error('Error fetching calendar data:', error || tasksError || requestsError || visitsError || teamMembersError);
    return <div>Error loading calendar data.</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full mx-auto px-4 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 uppercase tracking-tighter">Calendar</h1>
          <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">Jobs and Schedule Overview</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <JobCalendarView
          teamMembers={(teamMembers as any) || []}
          jobs={(jobs as any) || []}
          tasks={(tasks as any) || []}
          requests={(requests as any) || []}
          visits={(visits as any) || []}
        />
      </div>
    </div>
  );
}
