import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { PlusCircle, Users, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

export const revalidate = 0;

export default async function ClientsPage() {
  const supabase = await createClient();

  // Fetch clients
  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching clients:', error);
  }

  // Format name function
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
        <div className="mt-4 sm:mt-0">
          <Link href="/clients/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:-translate-y-1">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </Link>
        </div>
      </div>

      <Card className="shadow-sm border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          {clients && clients.length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                <tr>
                  <th scope="col" className="px-6 py-4 font-medium">Nombre</th>
                  <th scope="col" className="px-6 py-4 font-medium">Email / Teléfono</th>
                  <th scope="col" className="px-6 py-4 font-medium">Dirección</th>
                  <th scope="col" className="px-6 py-4 text-right font-medium">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {clients.map((client) => (
                  <tr key={client.id} className="bg-card hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {getDisplayName(client)}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div>{client.email || '-'}</div>
                      <div className="text-xs">{client.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {client.city ? `${client.city}, ${client.province}` : (client.street_1 || '-')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* Enlace para editar en el futuro */}
                      <Link href={`/clients/${client.id}/edit`}>
                        <Button variant="ghost" size="sm" className="hover:text-primary">
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
      </Card>
    </div>
  );
}
