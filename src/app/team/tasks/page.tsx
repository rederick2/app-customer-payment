import { createClient, createAdminClient } from '@/lib/supabase/server';
import TasksMapView from './components/TasksMapView';

// Geocode an address using Google Maps Geocoding API server-side
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey || !address) return null;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`,
      { next: { revalidate: 3600 } } // cache for 1 hour
    );
    const data = await res.json();
    if (data.status === 'OK' && data.results[0]) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }
  } catch (e) {
    console.error('Geocoding error:', e);
  }
  return null;
}

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

  const supabaseAdmin = createAdminClient();

  // Get tasks assigned to them with full client + address data
  const { data: rawTasks } = await supabaseAdmin
    .from('job_tasks')
    .select(`
      *,
      proformas (
        project_name,
        number,
        clients (
          name,
          last_name,
          company_name,
          phone,
          email,
          street_1,
          city,
          province,
          country,
          postal_code
        )
      )
    `)
    .eq('assigned_to', teamMember.id)
    .neq('status', 'completed')
    .order('due_date', { ascending: true });

  // Get active time entry (if any)
  const { data: activeEntry } = await supabaseAdmin
    .from('time_entries')
    .select('*')
    .eq('team_member_id', teamMember.id)
    .eq('status', 'active')
    .maybeSingle();

  // Geocode all task addresses server-side
  const tasks = await Promise.all(
    (rawTasks || []).map(async (task: any) => {
      const p = task.proformas;
      if (!p) return { ...task, lat: null, lng: null };

      const addressParts = [p.clients?.street_1, p.clients?.city, p.clients?.province, p.clients?.country, p.clients?.postal_code].filter(Boolean);
      if (addressParts.length === 0) return { ...task, lat: null, lng: null };

      const address = addressParts.join(', ');
      const coords = await geocodeAddress(address);
      return { ...task, lat: coords?.lat ?? null, lng: coords?.lng ?? null };
    })
  );

  return (
    <TasksMapView
      tasks={tasks}
      teamMemberId={teamMember.id}
      activeEntry={activeEntry}
    />
  );
}
