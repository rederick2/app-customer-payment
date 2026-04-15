import { createClient, createAdminClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, MapPin, FileText, CheckCircle } from 'lucide-react';

export default async function TeamDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: teamMember } = await supabase
    .from('team_members')
    .select('*, auth_user_id')
    .eq('auth_user_id', user?.id)
    .single();

  if (!teamMember) return <div>Auth error</div>;

  const supabaseAdmin = createAdminClient();

  // Get active visits assigned to them
  const { data: visits } = await supabaseAdmin
    .from('job_visits')
    .select('*, proformas(project_name, number, client_cache, street_1)')
    .eq('assigned_to', teamMember.id)
    .in('status', ['scheduled', 'in_progress'])
    .order('visit_date', { ascending: true });

  return (
    <div className="p-4 md:p-6 overflow-y-auto w-full max-w-4xl mx-auto pb-24">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl  text-[#0D3B47] mb-1 md:mb-2">Welcome, {teamMember.name}</h1>
        <p className="text-sm md:text-base text-muted-foreground">Here is your schedule for today.</p>
      </div>

      <div className="space-y-4 md:space-y-6">
        <h2 className="font-bold text-lg text-primary flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Your Scheduled Visits
        </h2>

        {(!visits || visits.length === 0) ? (
          <Card className="border-dashed bg-muted/10 pb-4">
            <CardContent className="pt-6 text-center text-muted-foreground text-sm">
              No active visits scheduled.
            </CardContent>
          </Card>
        ) : (
          visits.map(visit => (
            <Card key={visit.id} className="shadow-sm">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base text-[#0D3B47]">
                    {visit.proformas ? `${visit.proformas.project_name} - #${visit.proformas.number}` : 'Project Visit'}
                  </CardTitle>
                  <Badge variant="outline" className="bg-teal-50 text-teal-700 uppercase tracking-widest text-[9px] font-black">
                    {visit.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{new Date(visit.visit_date).toLocaleString()}</span>
                </div>
                {visit.proformas?.street_1 && (
                  <div className="flex gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{visit.proformas.street_1}</span>
                  </div>
                )}
                {visit.notes && (
                  <div className="flex gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{visit.notes}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
