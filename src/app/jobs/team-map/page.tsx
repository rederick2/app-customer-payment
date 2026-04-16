import { createClient, createAdminClient } from '@/lib/supabase/server';
import AdminTeamMapView from './components/AdminTeamMapView';

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
  } catch (e) {
    console.error('Geocoding error:', e);
  }
  return null;
}

export default async function TeamMapPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  if (!userId) {
    return <div className="p-8 text-red-500 font-bold">Not authenticated.</div>;
  }

  const admin = createAdminClient();

  // 1. Get this admin's team members
  const { data: teamMembers } = await admin
    .from('team_members')
    .select('id, name')
    .eq('user_id', userId)
    .order('name');

  const memberIds = (teamMembers || []).map((m: any) => m.id);

  // 2. Get all proforma IDs belonging to this admin
  const { data: adminProformas } = await admin
    .from('proformas')
    .select('id');
  //.eq('user_id', userId);

  const proformaIds = (adminProformas || []).map((p: any) => p.id);

  // 3. Fetch ALL non-completed tasks in those proformas (including unassigned)
  const rawTasksResult = proformaIds.length > 0
    ? await admin
      .from('job_tasks')
      .select(`
          id,
          title,
          description,
          status,
          due_date,
          end_date,
          assigned_to,
          proforma_id,
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
      //.in('proforma_id', proformaIds)
      .neq('status', 'completed')
      .order('due_date', { ascending: true })
    : { data: [] };

  const rawTasks = rawTasksResult.data || [];

  // 4. Geocode all task addresses
  const tasks = await Promise.all(
    rawTasks.map(async (task: any) => {
      const c = task.proformas?.clients;
      if (!c) return { ...task, lat: null, lng: null };
      const parts = [c.street_1, c.city, c.province, c.country, c.postal_code].filter(Boolean);
      if (!parts.length) return { ...task, lat: null, lng: null };
      const coords = await geocodeAddress(parts.join(', '));
      return { ...task, lat: coords?.lat ?? null, lng: coords?.lng ?? null };
    })
  );

  // 5. Separate: assigned to a known member vs unassigned
  const memberIdSet = new Set(memberIds);
  const tasksByMember: Record<string, typeof tasks> = {};
  (teamMembers || []).forEach((m: any) => { tasksByMember[m.id] = []; });
  const unassignedTasks: typeof tasks = [];

  tasks.forEach((task: any) => {
    if (task.assigned_to && memberIdSet.has(task.assigned_to)) {
      tasksByMember[task.assigned_to].push(task);
    } else {
      // No assignee, or assigned to someone outside this admin's team
      unassignedTasks.push(task);
    }
  });

  const assignedTasks = tasks.filter((t: any) => t.assigned_to && memberIdSet.has(t.assigned_to));

  return (
    <AdminTeamMapView
      teamMembers={(teamMembers || []) as any[]}
      tasksByMember={tasksByMember}
      allTasks={assignedTasks}
      unassignedTasks={unassignedTasks}
    />
  );
}
