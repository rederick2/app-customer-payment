import { createClient, createAdminClient } from '@/lib/supabase/server';
import TasksMapView from './components/TasksMapView';

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey || !address) return null;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    if (data.status === 'OK' && data.results[0]) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }
  } catch (e) { console.error('Geocoding error:', e); }
  return null;
}

const CLIENT_SELECT = `
  name, last_name, company_name, phone, email,
  street_1, city, province, country, postal_code
`;

export default async function TeamTasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: teamMember } = await supabase
    .from('team_members')
    .select('*, auth_user_id')
    .eq('auth_user_id', user?.id)
    .single();

  if (!teamMember) {
    return (
      <div className="p-6 text-center text-red-500 font-bold">
        Access error: You are not set up as a team member.
      </div>
    );
  }

  const admin = createAdminClient();

  // Fetch tasks and visits assigned to this team member
  // We show: 1. All non-completed items, 2. Items completed TODAY (so they don't disappear immediately)
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();

  const [{ data: rawTasks }, { data: rawVisits }, { data: activeEntry }] = await Promise.all([
    admin
      .from('job_tasks')
      .select(`
        id, title, description, status, due_date, end_date, percentage, proforma_id,
        proformas (
          id, project_name, number,
          clients ( ${CLIENT_SELECT} )
        )
      `)
      .eq('assigned_to', teamMember.id)
      .or(`status.neq.completed,updated_at.gte.${todayIso}`)
      .order('due_date', { ascending: true }),

    admin
      .from('job_visits')
      .select(`
        id, visit_date, status, notes, proforma_id,
        proformas (
          id, project_name, number,
          clients ( ${CLIENT_SELECT} )
        )
      `)
      .eq('assigned_to', teamMember.id)
      .or(`status.neq.completed,updated_at.gte.${todayIso}`)
      .order('visit_date', { ascending: true }),

    admin
      .from('time_entries')
      .select('*')
      .eq('team_member_id', teamMember.id)
      .eq('status', 'active')
      .maybeSingle(),
  ]);

  // Geocode once per unique address
  const addressCache = new Map<string, { lat: number | null; lng: number | null }>();

  const geocodeClients = async (items: any[]) => {
    await Promise.all(
      items.map(async (item: any) => {
        const c = item.proformas?.clients;
        if (!c) return;
        const parts = [c.street_1, c.city, c.province, c.country, c.postal_code].filter(Boolean);
        if (!parts.length) return;
        const key = parts.join(',');
        if (addressCache.has(key)) return;
        const coords = await geocodeAddress(parts.join(', '));
        addressCache.set(key, { lat: coords?.lat ?? null, lng: coords?.lng ?? null });
      })
    );
  };

  await Promise.all([geocodeClients(rawTasks || []), geocodeClients(rawVisits || [])]);

  const [{ data: adminSettings }] = await Promise.all([
    admin
      .from('users')
      .select('show_client_name_to_workers, show_client_phone_to_workers')
      .eq('id', teamMember.user_id)
      .single()
  ]);

  const attachCoords = (item: any) => {
    const c = item.proformas?.clients;
    if (!c) return { ...item, lat: null, lng: null };
    const parts = [c.street_1, c.city, c.province, c.country, c.postal_code].filter(Boolean);
    const key = parts.join(',');
    const coords = addressCache.get(key) ?? { lat: null, lng: null };
    return { ...item, ...coords };
  };

  const tasks = (rawTasks || []).map(attachCoords);
  const visits = (rawVisits || []).map(attachCoords);

  return (
    <TasksMapView
      tasks={tasks}
      visits={visits}
      teamMemberId={teamMember.id}
      activeEntry={activeEntry}
      settings={{
        showClientName: adminSettings?.show_client_name_to_workers !== false,
        showClientPhone: adminSettings?.show_client_phone_to_workers !== false
      }}
    />
  );
}
