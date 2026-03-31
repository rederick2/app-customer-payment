import { createClient } from '@/lib/supabase/server';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { InvoicesList } from './components/InvoicesList';

export const revalidate = 0;

export default async function InvoicesPage() {
  const supabase = await createClient();
  
  const { data: proformas, error } = await supabase
    .from('proformas')
    .select(`
      id,
      project_name,
      total,
      created_at,
      status,
      clients ( name )
    `)
    .eq('status', 'invoice')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching invoices:', error);
  }

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

      <InvoicesList initialProformas={proformas || []} />
    </div>
  );
}
