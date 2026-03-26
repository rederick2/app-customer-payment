import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import RequestCard from './components/RequestCard';

export const revalidate = 0;

type Props = {
  params: Promise<{ id: string }>
}

export default async function ClientRequestsView({ params }: Props) {
  const { id } = await params;

  const supabase = createAdminClient();

  // Validate proforma exists
  const { data: proforma, error: proformaError } = await supabase
    .from('proformas')
    .select('id, project_name')
    .eq('id', id)
    .single();

  if (proformaError || !proforma) {
    notFound();
  }

  // Fetch requests for this proforma
  const { data: requests, error: requestsError } = await supabase
    .from('service_requests')
    .select('*')
    .eq('proforma_id', id)
    .order('created_at', { ascending: false });

  return (
    <div className="container mx-auto px-6 py-8 md:p-12 max-w-5xl animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[#0D3B47] mb-2">My Requests</h1>
        <p className="text-muted-foreground">
          Requests associated with the proforma <span className="font-medium text-foreground">{proforma.project_name}</span>.
        </p>
      </div>

      <div className="grid gap-6">
        {requests && requests.length > 0 ? (
          requests.map((request) => (
            <RequestCard 
              key={request.id} 
              request={request} 
              storageUrl={supabase.storage.from('request-images').getPublicUrl('').data.publicUrl} 
            />
          ))
        ) : (
          <div className="text-center py-12 bg-white border border-border/50 rounded-lg">
            <h3 className="text-lg font-medium text-foreground">You don't have any requests</h3>
            <p className="text-muted-foreground mt-1">You haven't created any requests for this project yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
