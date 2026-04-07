import { createClient } from '@/lib/supabase/server';
import TimesheetAdminClient from './components/TimesheetAdminClient';

export default async function TimesheetsAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div>Auth error</div>;

  // Fetch all time entries for this user's team
  const { data: timeEntries } = await supabase
    .from('time_entries')
    .select(`
      *,
      team_members(*),
      proformas(project_name, number)
    `)
    .eq('proformas.user_id', user.id)
    .order('created_at', { ascending: false });

  // Check if they have an active QBO integration
  const { data: qbIntegration } = await supabase
    .from('user_integrations')
    .select('id')
    .eq('user_id', user.id)
    .eq('service_name', 'quickbooks')
    .single();

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto flex flex-col space-y-6">
      <div className="flex justify-between items-center bg-card p-6 rounded-xl border border-border/50 shadow-sm">
        <div>
          <h1 className="text-3xl  text-[#0D3B47] mb-1">Timesheets</h1>
          <p className="text-muted-foreground text-sm">Review your team's hours and sync them securely to QuickBooks.</p>
        </div>
      </div>

      <TimesheetAdminClient
        initialEntries={timeEntries || []}
        hasQuickbooks={!!qbIntegration}
      />
    </div>
  );
}
