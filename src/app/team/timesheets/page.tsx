import { createClient, createAdminClient } from '@/lib/supabase/server';
import { Clock, CheckCircle, Calendar } from 'lucide-react';

function formatDuration(seconds: number | null) {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default async function TeamTimesheetsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: teamMember } = await supabase
    .from('team_members')
    .select('id, name, user_id')
    .eq('auth_user_id', user?.id)
    .single();

  if (!teamMember) {
    return <div className="p-6 text-red-500 font-bold">Access error: not set up as a team member.</div>;
  }

  const admin = createAdminClient();

  const { data: entries } = await admin
    .from('time_entries')
    .select(`
      id, start_time, end_time, duration_seconds, status,
      proformas ( project_name, number, clients ( name, last_name, company_name ) )
    `)
    .eq('team_member_id', teamMember.id)
    .eq('status', 'completed')
    .order('start_time', { ascending: false });

  const totalSeconds = (entries || []).reduce((sum: number, e: any) => sum + (e.duration_seconds || 0), 0);

  return (
    <div className="flex flex-col bg-[#f8fafc] overflow-y-auto" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Header */}
      <div className="bg-white border-b border-border/30 px-5 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-archivo text-lg font-bold text-foreground">My Timesheets</h1>
            <p className="text-[11px] text-muted-foreground">
              {(entries || []).length} entries · Total: {formatDuration(totalSeconds)}
            </p>
          </div>
        </div>
      </div>

      {/* Entries */}
      <div className="flex-1 px-4 py-4 space-y-2 max-w-2xl w-full mx-auto">
        {(entries || []).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm gap-2">
            <Clock className="h-10 w-10 opacity-20" />
            <p>No completed time entries yet.</p>
          </div>
        ) : (
          (entries as any[]).map(entry => {
            const client = entry.proformas?.clients;
            const clientName = client?.company_name || [client?.name, client?.last_name].filter(Boolean).join(' ') || null;
            return (
              <div key={entry.id} className="bg-white rounded-xl border border-border/30 px-4 py-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">
                      {entry.proformas?.project_name || 'General'}
                      {entry.proformas?.number ? ` · #${entry.proformas.number}` : ''}
                    </p>
                    {clientName && (
                      <p className="text-xs text-muted-foreground truncate">{clientName}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-emerald-600 font-mono">
                      {formatDuration(entry.duration_seconds)}
                    </p>
                    <div className="flex items-center gap-1 justify-end">
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                      <span className="text-[10px] text-emerald-600 font-bold uppercase">Completed</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span>
                    {entry.start_time && new Date(entry.start_time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    {entry.end_time && ` → ${new Date(entry.end_time).toLocaleString('en-US', { timeStyle: 'short' })}`}
                  </span>
                </div>
                {entry.notes && (
                  <p className="text-xs text-muted-foreground italic border-t border-border/20 pt-2">{entry.notes}</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
