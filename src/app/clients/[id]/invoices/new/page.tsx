import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { InvoiceForm } from '@/components/billing/InvoiceForm';

interface NewInvoicePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ proformaId?: string }>;
}

export default async function NewInvoicePage({ params, searchParams }: NewInvoicePageProps) {
  const { id: clientId } = await params;
  const { proformaId } = await searchParams;
  
  const supabase = await createClient();
  
  // 1. Fetch Client
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, name, company_name, first_name, last_name, title')
    .eq('id', clientId)
    .single();
    
  if (clientError || !client) {
    notFound();
  }
  
  const clientName = client.company_name || [client.title, client.first_name, client.last_name].filter(Boolean).join(' ') || client.name;
  
  // 2. Fetch Proforma if provided
  let proforma = null;
  if (proformaId) {
    const { data: proformaData } = await supabase
      .from('proformas')
      .select('*')
      .eq('id', proformaId)
      .single();
    proforma = proformaData;
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-500">
      <InvoiceForm 
        clientId={clientId}
        clientName={clientName}
        proforma={proforma}
      />
    </div>
  );
}
