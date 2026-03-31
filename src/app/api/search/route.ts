import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json({ clients: [] });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ clients: [] }, { status: 401 });

  // Full-text search on name, email, phone
  const { data: clients } = await supabase
    .from('clients')
    .select('id, first_name, last_name, name, company_name, email, phone, street_1, city, province')
    .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,name.ilike.%${q}%,company_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
    .limit(5);

  if (!clients || clients.length === 0) return NextResponse.json({ clients: [] });

  const clientIds = clients.map((c) => c.id);

  // Fetch related proformas (quotes & jobs)
  const { data: proformas } = await supabase
    .from('proformas')
    .select('id, project_name, status, number, client_id, total')
    .in('client_id', clientIds)
    .order('created_at', { ascending: false });

  // Fetch recent payments
  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount, type, payment_date, client_id')
    .in('client_id', clientIds)
    .order('payment_date', { ascending: false });

  // Group by client
  const results = clients.map((client) => ({
    ...client,
    proformas: (proformas || []).filter((p) => p.client_id === client.id).slice(0, 3),
    payments: (payments || []).filter((p) => p.client_id === client.id).slice(0, 2),
  }));

  return NextResponse.json({ clients: results });
}
