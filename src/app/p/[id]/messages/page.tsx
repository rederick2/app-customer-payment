import { createAdminClient } from '@/lib/supabase/admin';
import CommunicationChat from '@/components/CommunicationChat';
import { notFound } from 'next/navigation';

export const revalidate = 0;

type Props = {
  params: Promise<{ id: string }>
}

export default async function PublicMessagesView({ params }: Props) {
  const { id } = await params;
  
  const supabase = createAdminClient();

  const { data: proforma, error: proformaError } = await supabase
    .from('proformas')
    .select('id')
    .eq('id', id)
    .single();

  if (proformaError || !proforma) {
    notFound();
  }

  const { data: messages } = await supabase
    .from('proforma_requests')
    .select('*')
    .eq('proforma_id', id)
    .order('created_at', { ascending: true });

  return (
    <div className="px-4 py-6 md:px-12 md:py-8 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="mb-4 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-foreground font-serif tracking-tight">Comentarios y Consultas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Proforma {id.split('-')[0].toUpperCase()}
        </p>
      </div>

      <CommunicationChat 
        proformaId={id} 
        messages={messages || []} 
        role="client" 
      />
    </div>
  );
}
