import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import InvoicesPaymentsView from './components/InvoicesPaymentsView';

export const revalidate = 0;

type Props = {
  params: Promise<{ id: string }>
}

export default async function ClientInvoicesView({ params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();

  // 1. Fetch current proforma to get client_id and user info
  const { data: currentProforma, error: proformaError } = await supabase
    .from('proformas')
    .select(`
      *,
      clients (*),
      users (display_name, terms_conditions, logo_url, business_license, address, phone, email)
    `)
    .eq('id', id)
    .single();

  if (proformaError || !currentProforma) {
    console.error("Proforma error:", proformaError);
    notFound();
  }

  const clientData = Array.isArray(currentProforma.clients) ? currentProforma.clients[0] : currentProforma.clients;
  const userData = Array.isArray(currentProforma.users) ? currentProforma.users[0] : currentProforma.users;

  // 2. Fetch all proformas for this client (to map names to invoices/payments)
  const { data: allProformas } = await supabase
    .from('proformas')
    .select('id, project_name')
    .eq('client_id', currentProforma.client_id);

  // 3. Fetch all invoices for this client
  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      *,
      proformas (
        project_name
      )
    `)
    .eq('client_id', currentProforma.client_id)
    .order('issue_date', { ascending: false });

  // 4. Fetch all payments for this client
  const { data: payments } = await supabase
    .from('payments')
    .select(`
      *,
      proformas (
        project_name
      )
    `)
    .eq('client_id', currentProforma.client_id)
    .order('payment_date', { ascending: false });

  return (
    <div className="container mx-auto px-6 py-8 md:p-12 max-w-5xl animate-in fade-in duration-500">
      <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="space-y-2 text-left">
          <h1 className=" text-3xl md:text-4xl font-black tracking-tight text-[#0D3B47]">
            Billing & Payments
          </h1>
          <p className="text-muted-foreground font-medium text-sm md:text-base max-w-2xl">
            Access all your finalized invoices and payment receipts for your projects.
          </p>
        </div>
      </div>

      <InvoicesPaymentsView
        invoices={invoices || []}
        payments={payments || []}
        client={clientData}
        user={userData}
        currentProforma={currentProforma}
        allProformas={allProformas || []}
      />
    </div>
  );
}
