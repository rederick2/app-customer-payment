import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ClientDetailClient } from './components/ClientDetailClient';

export const revalidate = 0;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch client data
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (clientError || !client) {
    notFound();
  }

  // Fetch client's proformas
  const { data: proformas } = await supabase
    .from('proformas')
    .select('*, users(*)')
    .eq('client_id', id)
    .order('created_at', { ascending: false });

  // Fetch payments
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('client_id', id)
    .order('payment_date', { ascending: false });

  // Fetch invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false });

  // Fetch expenses for these proformas
  const { data: expenses } = await supabase
    .from('job_expenses')
    .select('*')
    .in('proforma_id', proformas?.map(p => p.id) || []);

  return (
    <ClientDetailClient 
      client={client}
      proformas={proformas || []}
      payments={payments || []}
      invoices={invoices || []}
      expenses={expenses || []}
    />
  );
}
