import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { QuoteView } from './components/QuoteView';
import { JobView } from './components/JobView';

export const revalidate = 0;

type Props = {
  params: Promise<{ id: string }>,
  searchParams: Promise<{ view?: string }>
}

export default async function ProformaView({ params, searchParams }: Props) {
  const { id } = await params;
  const { view } = await searchParams;
  const supabase = await createClient();

  // Fetch proforma and its client
  const { data: proforma, error: proformaError } = await supabase
    .from('proformas')
    .select(`
      *,
      users(display_name, terms_conditions, logo_url, business_license, address, phone, email),
      clients (*),
      applied_taxes:users (
      taxes (*)
    )
    `)
    .eq('id', id)
    .single();

  //console.log(proforma)

  if (proformaError || !proforma) {
    notFound();
  }

  // Fetch line items
  const { data: items } = await supabase
    .from('proforma_items')
    .select('*')
    .eq('proforma_id', id);

  // Fetch Job-specific data
  const { data: expenses } = await supabase
    .from('job_expenses')
    .select('*')
    .eq('proforma_id', id)
    .order('date', { ascending: false });

  const { data: visits } = await supabase
    .from('job_visits')
    .select('*')
    .eq('proforma_id', id)
    .order('visit_date', { ascending: false });

  const { data: timeEntries } = await supabase
    .from('job_time_entries')
    .select('*')
    .eq('proforma_id', id)
    .order('date', { ascending: false });

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('proforma_id', id)
    .order('created_at', { ascending: false });

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('proforma_id', id)
    .order('payment_date', { ascending: false });

  const { data: tasks } = await supabase
    .from('job_tasks')
    .select(`
      *,
      team_members (*)
    `)
    .eq('proforma_id', id)
    .order('due_date', { ascending: true });

  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('*')
    .order('name', { ascending: true });

  const { data: materials } = await supabase
    .from('job_materials')
    .select('*')
    .eq('proforma_id', id)
    .order('created_at', { ascending: true });

  if ((proforma.status === 'job' || proforma.status === 'job_terminated') && view !== 'quote') {
    return (
      <JobView
        proforma={proforma}
        items={items || []}
        id={id}
        expenses={expenses || []}
        visits={visits || []}
        timeEntries={timeEntries || []}
        invoices={invoices || []}
        payments={payments || []}
        tasks={tasks || []}
        teamMembers={teamMembers || []}
        materials={materials || []}
      />
    );
  }

  return (
    <QuoteView
      proforma={proforma}
      items={items || []}
      id={id}
    />
  );
}
