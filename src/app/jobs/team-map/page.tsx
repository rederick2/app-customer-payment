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

const CLIENT_SELECT = `
  name, last_name, company_name, phone, email,
  street_1, city, province, country, postal_code
`;

const EMPTY_PROPS = {
  tasksByMember: {} as Record<string, any[]>,
  allTasks: [] as any[],
  unassignedTasks: [] as any[],
  visitsByMember: {} as Record<string, any[]>,
  allVisits: [] as any[],
  unassignedVisits: [] as any[],
};

export default async function TeamMapPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  if (!userId) {
    return <div className="p-8 text-red-500 font-bold">Not authenticated.</div>;
  }

  const admin = createAdminClient();

  // 1. Team members for this admin
  const { data: teamMembers } = await admin
    .from('team_members')
    .select('id, name')
    .eq('user_id', userId)
    .order('name');

  const memberIds = (teamMembers || []).map((m: any) => m.id);
  const memberIdSet = new Set(memberIds);

  // 2. Fetch proformas WITH nested job_tasks and job_visits (scoped to this admin)
  const { data: proformas } = await admin
    .from('proformas')
    .select(`
      id,
      project_name,
      number,
      clients ( ${CLIENT_SELECT} ),
      job_tasks (
        id, title, description, status, due_date, end_date, assigned_to
      ),
      job_visits (
        id, visit_date, status, notes, assigned_to
      )
    `)
    .eq('user_id', userId)
    .in('status', ['job', 'in_progress']);

  if (!proformas || proformas.length === 0) {
    return (
      <AdminTeamMapView
        teamMembers={(teamMembers || []) as any[]}
        {...EMPTY_PROPS}
      />
    );
  }

  // 3. Geocode each unique client address once (keyed by proforma id)
  const coordsCache = new Map<string, { lat: number | null; lng: number | null }>();

  await Promise.all(
    proformas.map(async (pf: any) => {
      const c = pf.clients;
      if (!c) { coordsCache.set(pf.id, { lat: null, lng: null }); return; }
      const parts = [c.street_1, c.city, c.province, c.country, c.postal_code].filter(Boolean);
      if (!parts.length) { coordsCache.set(pf.id, { lat: null, lng: null }); return; }
      const coords = await geocodeAddress(parts.join(', '));
      coordsCache.set(pf.id, { lat: coords?.lat ?? null, lng: coords?.lng ?? null });
    })
  );

  // 4. Flatten tasks and visits, injecting proforma context + coords
  const rawTasks: any[] = [];
  const rawVisits: any[] = [];

  for (const pf of proformas as any[]) {
    const coords = coordsCache.get(pf.id) ?? { lat: null, lng: null };
    const proformaCtx = { project_name: pf.project_name, number: pf.number, clients: pf.clients };

    for (const task of pf.job_tasks || []) {
      if (task.status === 'completed') continue;
      rawTasks.push({ ...task, proforma_id: pf.id, proformas: proformaCtx, ...coords });
    }
    for (const visit of pf.job_visits || []) {
      if (visit.status === 'completed') continue;
      rawVisits.push({ ...visit, proforma_id: pf.id, proformas: proformaCtx, ...coords });
    }
  }

  // 5. Split tasks → assigned / unassigned
  const tasksByMember: Record<string, any[]> = {};
  (teamMembers || []).forEach((m: any) => { tasksByMember[m.id] = []; });
  const unassignedTasks: any[] = [];

  rawTasks.forEach((t) => {
    if (t.assigned_to && memberIdSet.has(t.assigned_to)) {
      tasksByMember[t.assigned_to].push(t);
    } else {
      unassignedTasks.push(t);
    }
  });

  const assignedTasks = rawTasks.filter((t) => t.assigned_to && memberIdSet.has(t.assigned_to));

  // 6. Split visits → assigned / unassigned
  const visitsByMember: Record<string, any[]> = {};
  (teamMembers || []).forEach((m: any) => { visitsByMember[m.id] = []; });
  const unassignedVisits: any[] = [];

  rawVisits.forEach((v) => {
    if (v.assigned_to && memberIdSet.has(v.assigned_to)) {
      visitsByMember[v.assigned_to].push(v);
    } else {
      unassignedVisits.push(v);
    }
  });

  const assignedVisits = rawVisits.filter((v) => v.assigned_to && memberIdSet.has(v.assigned_to));

  return (
    <AdminTeamMapView
      teamMembers={(teamMembers || []) as any[]}
      tasksByMember={tasksByMember}
      allTasks={assignedTasks}
      unassignedTasks={unassignedTasks}
      visitsByMember={visitsByMember}
      allVisits={assignedVisits}
      unassignedVisits={unassignedVisits}
    />
  );
}
