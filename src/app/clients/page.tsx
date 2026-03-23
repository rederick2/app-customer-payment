import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { PlusCircle, Users, Edit } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import { ImportClientsModal } from './components/ImportClientsModal';
import { ClientSearchInput } from './components/ClientSearchInput';
import { ClientPagination } from './components/ClientPagination';
import { ClientActivityTrigger } from './components/ClientActivityTrigger';

export const revalidate = 0;

export default async function ClientsPage(
  props: { searchParams?: Promise<{ [key: string]: string | undefined }> }
) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const PAGE_SIZE = 10;
  const page = searchParams?.page ? parseInt(searchParams.page) : 1;
  const q = searchParams?.q || '';

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('clients')
    .select(`
      *,
      proformas (
        id,
        created_at,
        approved_at,
        job_converted_at,
        project_name,
        job_tasks ( created_at, title ),
        job_expenses ( created_at, amount, place )
      ),
      payments ( created_at, amount ),
      invoices ( created_at, invoice_number )
    `);

  if (q) {
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,company_name.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const { data: allClients, error } = await query;

  if (error) {
    console.error('Error fetching clients:', error);
  }

  let clients_data = allClients || [];

  // Sort by last activity across all related entities
  clients_data.sort((a, b) => {
    const getLatestDate = (client: any) => {
      const dates = [new Date(client.created_at).getTime()];
      
      if (client.proformas) {
        client.proformas.forEach((p: any) => {
          if (p.created_at) dates.push(new Date(p.created_at).getTime());
          if (p.approved_at) dates.push(new Date(p.approved_at).getTime());
          if (p.job_converted_at) dates.push(new Date(p.job_converted_at).getTime());
          if (p.job_tasks) {
            p.job_tasks.forEach((t: any) => dates.push(new Date(t.created_at).getTime()));
          }
          if (p.job_expenses) {
            p.job_expenses.forEach((e: any) => dates.push(new Date(e.created_at).getTime()));
          }
        });
      }
      if (client.payments) {
        client.payments.forEach((py: any) => dates.push(new Date(py.created_at).getTime()));
      }
      if (client.invoices) {
        client.invoices.forEach((i: any) => dates.push(new Date(i.created_at).getTime()));
      }
      
      return Math.max(...dates);
    };

    if (!a._latestActivity) a._latestActivity = getLatestDate(a);
    if (!b._latestActivity) b._latestActivity = getLatestDate(b);

    return b._latestActivity - a._latestActivity;
  });

  const count = clients_data.length;
  const totalPages = Math.ceil(count / PAGE_SIZE);
  
  // Apply pagination
  const clients = clients_data.slice(from, to + 1);

  const getDisplayName = (client: any) => {
    if (client.first_name || client.last_name) {
      return `${client.title ? client.title + ' ' : ''}${client.first_name || ''} ${client.last_name || ''}`.trim();
    }
    return client.name || 'Sin Nombre';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-2">Directorio de Clientes</h1>
          <p className="text-muted-foreground">Gestiona tus contactos y su información.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <ClientSearchInput />
          <ImportClientsModal />
          <Link href="/clients/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:-translate-y-1 whitespace-nowrap">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </Link>
        </div>
      </div>

      <Card className="shadow-sm border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          {clients && clients.length > 0 ? (
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                <tr>
                  <th scope="col" className="px-6 py-4 font-medium">Nombre</th>
                  <th scope="col" className="px-6 py-4 font-medium">Email / Teléfono</th>
                  <th scope="col" className="px-6 py-4 font-medium">Dirección</th>
                  <th scope="col" className="px-6 py-4 font-medium">Última Actividad</th>
                  <th scope="col" className="px-6 py-4 text-right font-medium">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    className="group bg-card hover:bg-muted/50 transition-colors cursor-pointer relative"
                  >
                    {/* Celdas principales con Link envolviendo el contenido */}
                    <td className="p-0">
                      <Link href={`/clients/${client.id}`} className="block px-6 py-4 font-medium text-foreground">
                        {getDisplayName(client)}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link href={`/clients/${client.id}`} className="block px-6 py-4 text-muted-foreground">
                        <div>{client.email || '-'}</div>
                        <div className="text-xs">{client.phone || '-'}</div>
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link href={`/clients/${client.id}`} className="block px-6 py-4 text-muted-foreground">
                        {client.city ? `${client.city}, ${client.province}` : (client.street_1 || '-')}
                      </Link>
                    </td>
                    <td className="p-0">
                      <ClientActivityTrigger 
                        client={client} 
                        latestActivity={client._latestActivity ? new Date(client._latestActivity) : null} 
                      />
                    </td>

                    {/* Celda de acciones (Edit) */}
                    <td className="px-6 py-4 text-right">
                      <Link href={`/clients/${client.id}/edit`} className="inline-block relative z-10">
                        <Button variant="ghost" size="sm" className="hover:text-primary hover:bg-background">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
              <Users className="h-12 w-12 text-muted/50 mb-4" />
              <p>No tienes clientes en tu directorio.</p>
              <Link href="/clients/new" className="mt-4 text-primary hover:underline">
                Añadir tu primer cliente
              </Link>
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <ClientPagination totalPages={totalPages} />
        )}
      </Card>
    </div>
  );
}