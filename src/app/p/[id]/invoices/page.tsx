import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import InvoiceCard from './components/InvoiceCard';
import { FileText, DollarSign, Info } from 'lucide-react';

export const revalidate = 0;

type Props = {
  params: Promise<{ id: string }>
}

export default async function ClientInvoicesView({ params }: Props) {
  const { id } = await params;

  const supabase = createAdminClient();

  // 1. Fetch current proforma to get client_id
  const { data: currentProforma, error: proformaError } = await supabase
    .from('proformas')
    .select('id, client_id, project_name')
    .eq('id', id)
    .single();

  if (proformaError || !currentProforma) {
    notFound();
  }

  // 2. Fetch all invoices for this client from the 'invoices' table
  // Join with proformas to get project_name
  const { data: invoices, error: invoicesError } = await supabase
    .from('invoices')
    .select(`
      *,
      proformas (
        project_name
      )
    `)
    .eq('client_id', currentProforma.client_id)
    .order('issue_date', { ascending: false });

  return (
    <div className="container mx-auto px-6 py-8 md:p-12 max-w-5xl animate-in fade-in duration-500">
      <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-3 mb-1">
             <div className="bg-primary/10 p-2 rounded-xl border border-primary/10">
               <DollarSign className="h-6 w-6 text-primary" />
             </div>
             <h1 className="font-serif text-3xl md:text-4xl font-black tracking-tight text-[#0D3B47]">Project Invoices</h1>
           </div>
           <p className="text-muted-foreground font-medium text-sm md:text-base max-w-2xl">
              Access all finalized invoices for your projects with us.
           </p>
        </div>
      </div>

      <div className="space-y-6">
        {invoices && invoices.length > 0 ? (
          invoices.map((invoice) => (
            <InvoiceCard 
              key={invoice.id} 
              invoice={invoice} 
              currentProformaId={id}
            />
          ))
        ) : (
          <div className="text-center py-20 bg-white border border-border/50 rounded-[2rem] shadow-sm flex flex-col items-center">
            <div className="bg-muted/30 p-6 rounded-full mb-6">
              <FileText className="h-16 w-16 text-muted-foreground/20" />
            </div>
            <h3 className="text-xl font-serif font-black text-[#0D3B47]">No invoices found</h3>
            <p className="text-muted-foreground mt-2 max-w-sm text-center font-medium">
              We haven't generated any invoices or approved quotes for your profile yet.
            </p>
          </div>
        )}
      </div>

      <div className="mt-12 p-6 bg-amber-50/30 border border-amber-200/50 rounded-2xl flex items-start gap-4">
        <div className="bg-amber-100 p-2 rounded-lg">
          <Info className="h-5 w-5 text-amber-700" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wider">Note</h4>
          <p className="text-sm text-amber-800/80 leading-relaxed">
            Invoices are generated automatically once a quote is approved. You can view the details, download PDF copies, or check the payment status of each one by clicking "View Details".
          </p>
        </div>
      </div>
    </div>
  );
}
