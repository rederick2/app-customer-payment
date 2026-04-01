import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { InvoiceForm } from '@/components/billing/InvoiceForm';

interface EditInvoicePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
  const { id: invoiceId } = await params;
  
  const supabase = await createClient();
  
  // 1. Fetch Invoice with Client and Proforma
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*, clients(*), proformas(*)')
    .eq('id', invoiceId)
    .single();
    
  if (invoiceError || !invoice) {
    notFound();
  }
  
  const client = invoice.clients;
  const proforma = invoice.proformas;
  const clientName = client.company_name || [client.title, client.first_name, client.last_name].filter(Boolean).join(' ') || client.name;
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-500">
      <InvoiceForm 
        clientId={client.id}
        clientName={clientName}
        proforma={proforma}
        initialData={invoice}
      />
    </div>
  );
}
