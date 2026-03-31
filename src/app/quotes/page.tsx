import { createClient } from '@/lib/supabase/server';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { QuotesList } from './components/QuotesList';
import { ImportQuotesModal } from './components/ImportQuotesModal';

export const revalidate = 0;

export default async function QuotesPage() {
  const supabase = await createClient();

  const { data: proformas, error } = await supabase
    .from('proformas')
    .select(`
      id,
      project_name,
      total,
      created_at,
      status,
      number,
      is_template,
      clients ( name )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching proformas:', error);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-1">Quotes</h1>
          <p className="text-muted-foreground text-sm">List of all quotes.</p>
        </div>
        <div className="flex items-center gap-2">
          {/*<ImportQuotesModal />*/}
          <Link href="/proforma/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:-translate-y-0.5">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Quote
            </Button>
          </Link>
        </div>
      </div>

      <QuotesList initialProformas={proformas || []} />
    </div>
  );
}
