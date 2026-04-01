import { createClient } from '@/lib/supabase/server';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { InvoicesList } from './components/InvoicesList';

export const revalidate = 0;

export default async function InvoicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground italic">Cargando factura...</p>
      </div>
    );
  }
  
  // 1. Fetch invoices with basic project and client info
  // We use !inner on proformas to filter the entire result by project owner
  const { data: invoices, error: invError } = await supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      total_amount,
      issue_date,
      status,
      proforma_id,
      qbo_invoice_id,
      proformas!inner ( project_name, user_id ),
      clients ( name, qbo_customer_id )
    `)
    .eq('proformas.user_id', user.id)
    .order('issue_date', { ascending: false });

  if (invError) {
    console.error('Error fetching invoices:', invError);
  }

  // 2. Fetch all payments for the active proformas
  const proformaIds = Array.from(new Set((invoices || []).map(i => i.proforma_id)));
  const { data: allPayments, error: payError } = proformaIds.length > 0 
    ? await supabase
        .from('payments')
        .select('*')
        .in('proforma_id', proformaIds)
    : { data: [], error: null };

  if (payError) {
    console.error('Error fetching payments:', payError);
  }

  // 3. Combine data: Map payments back to each invoice via proforma_id
  const enrichedInvoices = (invoices || []).map(invoice => ({
    ...invoice,
    payments: (allPayments || []).filter(p => p.proforma_id === invoice.proforma_id)
  }));

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-1">Invoices</h1>
          <p className="text-muted-foreground text-sm">Manage and view all your generated invoices.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/proforma/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:-translate-y-0.5">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Quote
            </Button>
          </Link>
        </div>
      </div>

      <InvoicesList initialInvoices={enrichedInvoices} />
    </div>
  );
}
