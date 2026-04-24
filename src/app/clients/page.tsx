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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const revalidate = 0;

export default async function ClientsPage(
  props: { searchParams?: Promise<{ [key: string]: string | undefined }> }
) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground italic">Loading clients...</p>
      </div>
    );
  }

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
    `)
    .eq('user_id', user.id);

  if (q) {
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,company_name.ilike.%${q}%,email.ilike.%${q}%,street_1.ilike.%${q}%,city.ilike.%${q}%,province.ilike.%${q}%,phone.ilike.%${q}%`);
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
      if (client.updated_at) dates.push(new Date(client.updated_at).getTime());

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
    return client.name || 'No Name';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-bold text-3xl md:text-4xl font-bold tracking-tight mb-1">Clients</h1>
          <p className="text-muted-foreground text-sm">Manage your contacts and their information.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-10 w-full sm:w-auto items-stretch sm:items-center">
          <div className="flex-1 sm:w-64">
            <ClientSearchInput />
          </div>
          <div className="flex-1 gap-2">
            {/*<div className="flex-1 sm:flex-initial">
              <ImportClientsModal />
            </div>*/}
            <Link href="/clients/new" className="flex-1 sm:flex-initial">
              <Button className="w-full bg-primary">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Client
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Card className="border-border/50 overflow-hidden bg-transparent hidden md:block">
        <div className="hidden md:block">
          {clients && clients.length > 0 ? (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-medium">Name</TableHead>
                  <TableHead className="font-medium">Email / Phone</TableHead>
                  <TableHead className="font-medium">Address</TableHead>
                  <TableHead className="font-medium">Last Activity</TableHead>
                  <TableHead className="text-right font-medium">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow
                    key={client.id}
                    className="group hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <TableCell className="p-0">
                      <Link href={`/clients/${client.id}`} className="block px-4 py-4 font-medium text-foreground">
                        {getDisplayName(client)}
                      </Link>
                    </TableCell>
                    <TableCell className="p-0">
                      <Link href={`/clients/${client.id}`} className="block px-4 py-4 text-muted-foreground">
                        <div>{client.email || '-'}</div>
                        <div className="text-xs">{client.phone || '-'}</div>
                      </Link>
                    </TableCell>
                    <TableCell className="p-0">
                      <Link href={`/clients/${client.id}`} className="block px-4 py-4 text-muted-foreground">
                        {client.street_1 ? `${client.street_1}, ${client.city}, ${client.province}` : (client.street_1 || '-')}
                      </Link>
                    </TableCell>
                    <TableCell className="p-0">
                      <ClientActivityTrigger
                        client={client}
                        latestActivity={client._latestActivity ? new Date(client._latestActivity) : null}
                      />
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right">
                      <Link href={`/clients/${client.id}/edit`} className="inline-block relative z-10">
                        <Button variant="ghost" size="sm" className="hover:text-primary hover:bg-background">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </div>
      </Card>
      {/* Mobile View */}
      <div className="md:hidden">
        {clients && clients.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 p-0">
            {clients.map((client) => (
              <Card key={client.id} className="overflow-hidden border-border/40 shadow-sm">
                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <Link href={`/clients/${client.id}`} className="block flex-1 group">
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                        {getDisplayName(client)}
                      </h3>
                      <p className="text-xs text-muted-foreground/70 flex items-center gap-1 mt-1 uppercase tracking-tighter font-black">
                        {client.email || 'NO EMAIL'}
                      </p>
                    </Link>
                    <Link href={`/clients/${client.id}/edit`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/20">
                    <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest mb-1">Last Activity</p>
                      <ClientActivityTrigger
                        client={client}
                        latestActivity={client._latestActivity ? new Date(client._latestActivity) : null}
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest mb-1">Phone</p>
                      <p className="text-sm font-medium">{client.phone || '-'}</p>
                    </div>
                  </div>

                  {client.street_1 && (
                    <div className="pt-2 border-t border-border/20">
                      <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest mb-1">Location</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {client.street_1}, {client.city}
                      </p>
                    </div>
                  )}
                </div>
                <Link href={`/clients/${client.id}`} className="block w-full">
                  <Button variant="secondary" className="w-full rounded-none border-t border-border/30 h-10 text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 hover:text-primary transition-all">
                    View full details
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        ) : null}
      </div>

      {/* Empty State shared */}
      {!clients || clients.length === 0 ? (
        <div className="p-16 text-center text-muted-foreground flex flex-col items-center">
          <Users className="h-16 w-16 text-muted/20 mb-4" />
          <p className="text-lg  italic text-foreground/70">No clients found in directory.</p>
          <Link href="/clients/new" className="mt-6">
            <Button variant="outline" className="rounded-xl border-primary/20 hover:bg-primary/5 px-8">
              Add your first client
            </Button>
          </Link>
        </div>
      ) : null}

      {totalPages > 1 && (
        <ClientPagination totalPages={totalPages} />
      )}

    </div>
  );
}