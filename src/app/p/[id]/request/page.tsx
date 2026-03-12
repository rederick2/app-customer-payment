import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import ServiceRequestForm from './components/ServiceRequestForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type Props = {
  params: Promise<{ id: string }>
}

export default async function PublicNewServiceRequest({ params }: Props) {
  const { id } = await params;
  
  // Usar admin client ya que es ruta pública
  const supabase = createAdminClient();

  // Verificar que la proforma existe y obtener datos del cliente
  const { data: proforma, error } = await supabase
    .from('proformas')
    .select(`
      id,
      project_name,
      clients (
        name,
        company_name,
        first_name,
        last_name
      )
    `)
    .eq('id', id)
    .single();

  if (error || !proforma) {
    notFound();
  }

  const clientData = proforma.clients as any;
  const clientName = clientData.company_name || 
    [clientData.first_name, clientData.last_name].filter(Boolean).join(' ') || 
    clientData.name || 
    'Cliente';

  return (
    <div className="px-6 py-8 md:p-12 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-primary">Solicitar Nuevo Servicio</h1>
        <p className="text-muted-foreground mt-1">
          Asociado al proyecto: <span className="font-medium text-foreground">{proforma.project_name}</span>
        </p>
      </div>

      <ServiceRequestForm proformaId={proforma.id} clientName={clientName} />
    </div>
  );
}
