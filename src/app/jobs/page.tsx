import { createClient } from '@/lib/supabase/server';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { JobsList } from './components/JobsList';

export const revalidate = 0;

export default async function JobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground italic">Cargando trabajos...</p>
      </div>
    );
  }

  const { data: proformas, error } = await supabase
    .from('proformas')
    .select(`
      id,
      project_name,
      total,
      created_at,
      status,
      number,
      job_start_at,
      job_end_at,
      clients ( id, name, street_1, city, province, postal_code )
    `)
    .eq('user_id', user.id)
    .in('status', ['job', 'job_terminated'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching jobs:', error);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">

      <JobsList initialProformas={proformas || []} />
    </div>
  );
}
