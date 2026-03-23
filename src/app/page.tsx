import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { PlusCircle, FileText, Users } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0; // Disable page caching to always show latest data

export default async function Dashboard() {
  const supabase = await createClient();
  // Fetch mock stats for now (or actual counts if we want to run queries)
  const { count: proformasCount } = await supabase
    .from('proformas')
    .select('*', { count: 'exact', head: true });
    
  const { count: clientsCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true });

  const { data: recentProformas } = await supabase
    .from('proformas')
    .select(`
      id,
      project_name,
      total,
      created_at,
      clients ( name )
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to EstudioPro's control panel.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link href="/proforma/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:-translate-y-1">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Quote
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="shadow-sm border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Proformas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-serif">{proformasCount || 0}</div>
            <p className="text-xs text-muted-foreground">Issued to date</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-serif">{clientsCount || 0}</div>
            <p className="text-xs text-muted-foreground">In your portfolio</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="font-serif text-2xl font-semibold tracking-tight mb-4">Recent Quotes</h2>
      <Card className="shadow-sm border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          {recentProformas && recentProformas.length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                <tr>
                  <th scope="col" className="px-6 py-4 font-medium">Project</th>
                  <th scope="col" className="px-6 py-4 font-medium">Client</th>
                  <th scope="col" className="px-6 py-4 font-medium">Date</th>
                  <th scope="col" className="px-6 py-4 text-right font-medium">Total</th>
                  <th scope="col" className="px-6 py-4 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {recentProformas.map((proforma) => (
                  <tr key={proforma.id} className="bg-card hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{proforma.project_name}</td>
                    <td className="px-6 py-4">{(proforma.clients as any)?.name || 'No Client'}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(proforma.created_at).toLocaleDateString('en-US')}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      ${proforma.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/proforma/${proforma.id}`}>
                        <Button variant="ghost" size="sm" className="hover:text-primary">
                          View Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
              <FileText className="h-12 w-12 text-muted/50 mb-4" />
              <p>You have no recent quotes.</p>
              <Link href="/proforma/new" className="mt-4 text-primary hover:underline">
                Create your first quote
              </Link>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
