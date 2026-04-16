import { createClient } from '@/lib/supabase/server';
import JobCalendarView from '@/components/JobCalendarView';

export const revalidate = 0;

export default async function CalendarPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  // Get proforma IDs for this user to scope tasks, visits, and requests
  const { data: userProformas } = await supabase
    .from('proformas')
    .select('id')
    .eq('user_id', userId);

  const proformaIds = (userProformas || []).map((p: any) => p.id);

  // Fetch this user's jobs for the calendar
  const { data: jobs } = await supabase
    .from('proformas')
    .select(`
      id, number, project_name, job_start_at, job_end_at,
      clients ( name, company_name, street_1, city, province )
    `)
    .eq('user_id', userId)
    .notIn('status', ['job_terminated', 'rejected', 'draft'])
    .order('job_start_at', { ascending: true });

  // Tasks scoped by proforma ownership
  const { data: tasks } = proformaIds.length > 0
    ? await supabase
        .from('job_tasks')
        .select(`*, team_members (name), proformas (clients (street_1, city, province))`)
        .in('proforma_id', proformaIds)
        .order('due_date', { ascending: true })
    : { data: [] };

  // Service requests scoped by proforma ownership
  const { data: requests } = proformaIds.length > 0
    ? await supabase
        .from('service_requests')
        .select(`
          *,
          proformas ( id, number, project_name, clients ( name, company_name, street_1, city, province ) )
        `)
        .in('proforma_id', proformaIds)
        .not('status', 'eq', 'cancelled')
        .order('schedule_date', { ascending: true })
    : { data: [] };

  // Job visits scoped by proforma ownership
  const { data: visits } = proformaIds.length > 0
    ? await supabase
        .from('job_visits')
        .select(`
          *,
          team_members (name),
          proformas ( id, number, project_name, clients ( name, company_name, street_1, city, province ) )
        `)
        .in('proforma_id', proformaIds)
        .order('visit_date', { ascending: true })
    : { data: [] };

  // Team members scoped to this admin
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

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
