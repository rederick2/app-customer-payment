import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Clock, Image as ImageIcon, MapPin, ListTodo } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AdminRequestActions from './components/AdminRequestActions';

export const revalidate = 0;

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">Pending</Badge>;
    case 'reviewed':
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/20">Reviewed</Badge>;
    case 'scheduled':
      return <Badge variant="outline" className="bg-purple-500/10 text-purple-700 border-purple-500/20">Scheduled</Badge>;
    case 'completed':
      return <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">Completed</Badge>;
    case 'cancelled':
      return <Badge variant="destructive" className="bg-red-500/10 text-red-700 border-red-500/20">Cancelled</Badge>;
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

export default async function AdminRequestsView() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Fetch all service requests for this admin's proformas
  const { data: requests, error } = await supabase
    .from('service_requests')
    .select(`
      *,
      proformas!inner(
        id,
        project_name,
        user_id,
        clients(
          name,
          company_name,
          first_name,
          last_name
        )
      )
    `)
    .eq('proformas.user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold tracking-tight mb-2">Service Requests</h1>
        <p className="text-muted-foreground">Manage requests sent by your clients.</p>
      </div>

      <div className="grid gap-6">
        {requests && requests.length > 0 ? (
          requests.map((request) => {
            const clientData = (request.proformas as any).clients;
            const clientName = clientData?.company_name ||
              [clientData?.first_name, clientData?.last_name].filter(Boolean).join(' ') ||
              clientData?.name ||
              'Cliente';

            return (
              <Card key={request.id} className="border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/50 pb-4 flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                      {clientName}
                      <span className="text-muted-foreground text-sm font-normal">/</span>
                      <Link href={`/proforma/${request.proforma_id}`} className="hover:underline text-primary">
                        {(request.proformas as any).project_name}
                      </Link>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Received on {new Date(request.created_at).toLocaleDateString('es-ES')} at {new Date(request.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={request.status} />
                    <AdminRequestActions requestId={request.id} currentStatus={request.status} />
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Details */}
                    <div className="md:col-span-2 space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Detalles de la Solicitud</h4>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{request.details}</p>
                      </div>
                      {request.on_site_instructions && (
                        <div>
                          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> Special Instructions
                          </h4>
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
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Proposed Date</p>
                            <p className="text-sm font-medium">{new Date(request.schedule_date).toLocaleDateString('es-ES')}</p>
                          </div>
                        </div>
                      )}
                      {request.time_preference && (
                        <div className="flex items-start gap-3">
                          <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Time Preference</p>
                            <p className="text-sm font-medium"><TimePreferenceText preference={request.time_preference} /></p>
                          </div>
                        </div>
                      )}
                      {request.images && request.images.length > 0 && (
                        <div className="flex items-start gap-3">
                          <ImageIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Images</p>
                            <p className="text-sm font-medium">{request.images.length} images</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Images Preview if any */}
                  {request.images && request.images.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Images</h4>
                      <div className="flex gap-4 overflow-x-auto pb-4">
                        {request.images.map((img: string, i: number) => {
                          const publicUrl = img.startsWith('http') ? img : supabase.storage.from('request-images').getPublicUrl(img).data.publicUrl;
                          return (
                            <a key={i} href={publicUrl} target="_blank" rel="noopener noreferrer" className="block flex-shrink-0 w-32 h-32 rounded-md overflow-hidden border border-border/50 hover:opacity-90 transition-opacity">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={publicUrl} alt={`Attached ${i}`} className="w-full h-full object-cover" />
                            </a>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="text-center py-12 bg-card border border-border/50 rounded-lg">
            <ListTodo className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No requests yet</h3>
            <p className="text-muted-foreground mt-1">When your clients send service requests, they will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
