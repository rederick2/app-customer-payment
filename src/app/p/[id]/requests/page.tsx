import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Clock, Image as ImageIcon } from 'lucide-react';

export const revalidate = 0;

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">Pendiente</Badge>;
    case 'reviewed':
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/20">Revisada</Badge>;
    case 'scheduled':
      return <Badge variant="outline" className="bg-purple-500/10 text-purple-700 border-purple-500/20">Programada</Badge>;
    case 'completed':
      return <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">Completada</Badge>;
    case 'cancelled':
      return <Badge variant="destructive" className="bg-red-500/10 text-red-700 border-red-500/20">Cancelada</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function TimePreferenceText({ preference }: { preference: string }) {
  switch (preference) {
    case 'morning':
      return 'Por la Mañana';
    case 'afternoon':
      return 'Por la Tarde';
    case 'anytime':
      return 'Cualquier momento';
    default:
      return preference || 'No especificado';
  }
}

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
          Solicitudes asociadas a la proforma <span className="font-medium text-foreground">{proforma.project_name}</span>.
        </p>
      </div>

      <div className="grid gap-6">
        {requests && requests.length > 0 ? (
          requests.map((request) => (
            <Card key={request.id} className="border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/50 pb-4 flex flex-row items-center justify-between">
                 <div className="space-y-1">
                   <CardTitle className="text-lg font-medium">Solicitud #{request.id.split('-')[0]}</CardTitle>
                   <p className="text-xs text-muted-foreground">
                     Creada el {new Date(request.created_at).toLocaleDateString('es-ES')}
                   </p>
                 </div>
                 <StatusBadge status={request.status} />
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Details */}
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Detalles</h4>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{request.details}</p>
                    </div>
                    {request.on_site_instructions && (
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Instrucciones Especiales</h4>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{request.on_site_instructions}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Info sidebar */}
                  <div className="space-y-4 bg-muted/20 p-4 rounded-lg">
                    {request.schedule_date && (
                      <div className="flex items-start gap-3">
                         <CalendarIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                         <div>
                           <p className="text-xs font-semibold uppercase text-muted-foreground">Fecha Solicitada</p>
                           <p className="text-sm font-medium">{new Date(request.schedule_date).toLocaleDateString('es-ES')}</p>
                         </div>
                      </div>
                    )}
                    {request.time_preference && (
                      <div className="flex items-start gap-3">
                         <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                         <div>
                           <p className="text-xs font-semibold uppercase text-muted-foreground">Preferencia Horario</p>
                           <p className="text-sm font-medium"><TimePreferenceText preference={request.time_preference} /></p>
                         </div>
                      </div>
                    )}
                    {request.images && request.images.length > 0 && (
                      <div className="flex items-start gap-3">
                         <ImageIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                         <div>
                           <p className="text-xs font-semibold uppercase text-muted-foreground">Imágenes</p>
                           <p className="text-sm font-medium">{request.images.length} adjuntas</p>
                         </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Images Preview if any */}
                {request.images && request.images.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Imágenes Adjuntas</h4>
                    <div className="flex gap-4 overflow-x-auto pb-4">
                      {request.images.map((img: string, i: number) => {
                        // Assuming URLs are full public URLs. If they are paths, we need to create public URLs.
                        const publicUrl = img.startsWith('http') ? img : supabase.storage.from('request-images').getPublicUrl(img).data.publicUrl;
                        return (
                          <div key={i} className="flex-shrink-0 w-32 h-32 rounded-md overflow-hidden border border-border/50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={publicUrl} alt={`Attached ${i}`} className="w-full h-full object-cover" />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 bg-white border border-border/50 rounded-lg">
            <ListTodo className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No tienes solicitudes</h3>
            <p className="text-muted-foreground mt-1">Aún no has creado ninguna solicitud para este proyecto.</p>
          </div>
        )}
      </div>
    </div>
  );
}
