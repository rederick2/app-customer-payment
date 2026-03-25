import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import {
  PlusCircle, FileText, Users, Briefcase, DollarSign,
  TrendingUp, Clock, CheckCircle2, AlertCircle, ArrowUpRight, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { StatusDonutChart } from '@/components/dashboard/StatusDonutChart';
import { MonthlyBarChart } from '@/components/dashboard/MonthlyBarChart';
import { RecentlyVisitedJobs } from '@/components/dashboard/RecentlyVisitedJobs';

export const revalidate = 0;

export default async function Dashboard() {
  const supabase = await createClient();

  // ── Counts ──────────────────────────────────────────────────
  const { count: proformasCount } = await supabase
    .from('proformas').select('*', { count: 'exact', head: true });

  const { count: clientsCount } = await supabase
    .from('clients').select('*', { count: 'exact', head: true });

  const { count: jobsCount } = await supabase
    .from('proformas').select('*', { count: 'exact', head: true }).eq('status', 'job');

  const { count: pendingCount } = await supabase
    .from('proformas').select('*', { count: 'exact', head: true }).eq('status', 'quote');

  const { count: completedCount } = await supabase
    .from('proformas').select('*', { count: 'exact', head: true }).eq('status', 'completed');

  // ── Revenue ──────────────────────────────────────────────────
  const { data: revenueData } = await supabase
    .from('proformas').select('total').in('status', ['job', 'completed']);
  const totalRevenue = (revenueData || []).reduce((s, p) => s + (p.total || 0), 0);

  // ── Chart data: all proformas with date + total + status ─────
  const { data: allProformas } = await supabase
    .from('proformas')
    .select('created_at, total, status')
    .order('created_at', { ascending: true });

  // Build last 12 months map
  const now = new Date();
  const months: { key: string; label: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    });
  }

  const revenueByMonth: Record<string, number> = {};
  const countByMonth: Record<string, number> = {};
  months.forEach(m => { revenueByMonth[m.key] = 0; countByMonth[m.key] = 0; });

  (allProformas || []).forEach(p => {
    const d = new Date(p.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (revenueByMonth[key] !== undefined) {
      revenueByMonth[key] += p.total || 0;
      countByMonth[key] += 1;
    }
  });

  const revenueChartData = months.map(m => ({ month: m.label, revenue: revenueByMonth[m.key] }));
  const countChartData = months.map(m => ({ month: m.label, count: countByMonth[m.key] }));

  // Status breakdown for donut
  const statusCounts = { quote: 0, job: 0, completed: 0, cancelled: 0 };
  (allProformas || []).forEach(p => {
    if (p.status in statusCounts) statusCounts[p.status as keyof typeof statusCounts]++;
  });
  const donutData = [
    { name: 'Quotes', value: statusCounts.quote, color: '#F59E0B' },
    { name: 'Active', value: statusCounts.job, color: '#6366F1' },
    { name: 'Completed', value: statusCounts.completed, color: '#10B981' },
    { name: 'Cancelled', value: statusCounts.cancelled, color: '#F87171' },
  ];

  // ── Recent data ───────────────────────────────────────────────
  const { data: recentProformas } = await supabase
    .from('proformas')
    .select('id, project_name, total, created_at, status, clients ( name )')
    .order('created_at', { ascending: false })
    .limit(7);

  const { data: recentClients } = await supabase
    .from('clients')
    .select('id, name, email, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  // ── Helpers ───────────────────────────────────────────────────
  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      quote: { label: 'Quote', className: 'bg-amber-100 text-amber-700' },
      job: { label: 'Active Job', className: 'bg-violet-100 text-violet-700' },
      completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
    };
    const s = map[status] ?? { label: status, className: 'bg-muted text-muted-foreground' };
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.className}`}>
        {s.label}
      </span>
    );
  };

  const stats = [
    { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, sub: 'Active & completed jobs', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Quotes', value: proformasCount ?? 0, sub: 'All time', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Jobs', value: jobsCount ?? 0, sub: 'In progress', icon: Briefcase, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Clients', value: clientsCount ?? 0, sub: 'In your portfolio', icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Pending Quotes', value: pendingCount ?? 0, sub: 'Awaiting approval', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Completed Jobs', value: completedCount ?? 0, sub: 'Delivered to clients', icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-50' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-1">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Overview of your business performance.</p>
        </div>
        <Link href="/proforma/new">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:-translate-y-0.5">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Quote
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3 space-y-8">
          {/* Stat Cards */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-8">
              <RecentlyVisitedJobs />

              {/* Quick Actions (Moved from right sidebar) */}
              <div>
                <h2 className="font-serif text-xl font-semibold tracking-tight mb-3">Quick Actions</h2>
                <Card className="shadow-sm border-border/40">
                  <CardContent className="p-3 space-y-1">
                    {[
                      { href: '/proforma/new', label: 'New Quote', icon: FileText, color: 'text-blue-600' },
                      { href: '/clients', label: 'Manage Clients', icon: Users, color: 'text-orange-600' },
                      { href: '/jobs', label: 'View Jobs', icon: Briefcase, color: 'text-violet-600' },
                      { href: '/quotes', label: 'All Quotes', icon: TrendingUp, color: 'text-emerald-600' },
                    ].map(({ href, label, icon: Icon, color }) => (
                      <Link key={href} href={href}>
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                          <Icon className={`h-4 w-4 ${color}`} />
                          <span className="text-sm font-medium flex-1">{label}</span>
                          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
            <div className="grid col-span-2 gap-4 lg:grid-cols-2">
              {stats.map(({ label, value, sub, icon: Icon, color, bg }) => (
                <Card key={label} className="shadow-sm border-border/40 hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
                        <p className="text-2xl font-bold font-serif truncate">{value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                      </div>
                      <div className={`${bg} ${color} p-2.5 rounded-xl shrink-0 ml-3`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm border-border/40">
              <CardHeader className="pb-2 pt-5 px-5">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Revenue — Last 12 Months</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <RevenueChart data={revenueChartData} />
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/40">
              <CardHeader className="pb-2 pt-5 px-5">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quote Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <StatusDonutChart data={donutData} />
              </CardContent>
            </Card>
          </div>

          {/* Quotes per month bar chart */}
          <Card className="shadow-sm border-border/40">
            <CardHeader className="pb-2 pt-5 px-5">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quotes Created — Last 12 Months</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <MonthlyBarChart data={countChartData} />
            </CardContent>
          </Card>

          {/* Two-column layout for Recent Quotes and Recent Clients */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-serif text-xl font-semibold tracking-tight">Recent Quotes</h2>
                <Link href="/quotes" className="text-xs text-primary hover:underline flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <Card className="shadow-sm border-border/40 overflow-hidden">
                <div className="overflow-x-auto">
                  {recentProformas && recentProformas.length > 0 ? (
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-muted/40 text-muted-foreground">
                        <tr>
                          <th className="px-5 py-3.5 font-medium">Project</th>
                          <th className="px-5 py-3.5 font-medium">Status</th>
                          <th className="px-5 py-3.5 text-right font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {recentProformas.map((p) => (
                          <tr key={p.id} className="bg-card hover:bg-muted/20 transition-colors">
                            <td className="px-5 py-3.5">
                              <Link href={`/proforma/${p.id}`} className="font-medium text-foreground hover:text-primary transition-colors block truncate max-w-[150px]">
                                {p.project_name}
                              </Link>
                            </td>
                            <td className="px-5 py-3.5">{statusBadge(p.status)}</td>
                            <td className="px-5 py-3.5 text-right font-semibold tabular-nums">
                              ${(p.total ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-10 text-center text-muted-foreground flex flex-col items-center gap-3">
                      <AlertCircle className="h-10 w-10 text-muted/40" />
                      <p className="text-sm">No quotes yet.</p>
                      <Link href="/proforma/new" className="text-primary hover:underline text-sm">Create your first quote</Link>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-serif text-xl font-semibold tracking-tight">Recent Clients</h2>
                <Link href="/clients" className="text-xs text-primary hover:underline flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <Card className="shadow-sm border-border/40">
                <CardContent className="p-3 space-y-1">
                  {recentClients && recentClients.length > 0 ? recentClients.map((client) => (
                    <Link key={client.id} href={`/clients/${client.id}`}>
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary">
                            {client.name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{client.name}</p>
                        </div>
                        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors shrink-0" />
                      </div>
                    </Link>
                  )) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No clients yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
