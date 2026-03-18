import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ProformaForm from '../../components/ProformaForm';

export const revalidate = 0;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProforma({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch proforma and its client
  const { data: proforma, error: proformaError } = await supabase
    .from('proformas')
    .select(`
      *,
      clients (*)
    `)
    .eq('id', id)
    .single();

  if (proformaError || !proforma) {
    notFound();
  }

  // Prevent editing if it's already a job or approved
  if (proforma.status === 'job' || proforma.status === 'approved') {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-destructive mb-4">No se puede editar esta proforma</h1>
        <p className="text-muted-foreground mb-6">Las proformas aprobadas o convertidas en trabajos no pueden modificarse.</p>
        <a href={`/proforma/${id}`} className="text-primary hover:underline font-medium">Volver a la Proforma</a>
      </div>
    );
  }

  // Fetch line items
  const { data: items } = await supabase
    .from('proforma_items')
    .select('*')
    .eq('proforma_id', id)
    .order('created_at', { ascending: true });

  return (
    <ProformaForm 
      initialData={{ 
        proforma, 
        items: items || [], 
        client: proforma.clients 
      }} 
      mode="edit" 
    />
  );
}
