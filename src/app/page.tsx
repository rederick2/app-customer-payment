import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  PlusCircle, FileText, Users, Briefcase, DollarSign,
  TrendingUp, Clock, CheckCircle2, AlertCircle, ArrowUpRight, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { StatusDonutChart } from '@/components/dashboard/StatusDonutChart';
import { MonthlyBarChart } from '@/components/dashboard/MonthlyBarChart';
import { RecentlyVisitedJobs } from '@/components/dashboard/RecentlyVisitedJobs';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardAIChat } from "@/components/dashboard/DashboardAIChat";
import { Sparkles, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardStatCards } from "@/components/dashboard/DashboardStatCards";

export const revalidate = 0;

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/landing');
  }


  // ── Counts ──────────────────────────────────────────────────
  const { count: proformasCount } = await supabase
    .from('proformas').select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'approved').eq('is_template', false);

  const { count: clientsCount } = await supabase
    .from('clients').select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { count: jobsCount } = await supabase
    .from('proformas').select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'job').eq('is_template', false);

  const { count: pendingCount } = await supabase
    .from('proformas').select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'quote').eq('is_template', false);

  const { count: completedCount } = await supabase
    .from('proformas').select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'completed').eq('is_template', false);

  // ── Revenue ──────────────────────────────────────────────────
  const { data: revenueData } = await supabase
    .from('proformas')
    .select('total')
    .eq('user_id', user.id)
    .in('status', ['job', 'completed']).eq('is_template', false);
  const totalRevenue = (revenueData || []).reduce((s, p) => s + (p.total || 0), 0);

  // ── Chart data ─────────────────────────────────────────────
  const { data: allProformas } = await supabase
    .from('proformas')
    .select('created_at, total, status')
    .eq('user_id', user.id)
    .eq('is_template', false)
    .order('created_at', { ascending: true });

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
    .select('id, project_name, number, total, created_at, status, clients ( name )')
    .eq('user_id', user.id)
    .eq('is_template', false)
    .order('created_at', { ascending: false })
    .limit(7);

  const { data: recentClients } = await supabase
    .from('clients')
    .select('id, name, email, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'success' }> = {
      quote: { label: 'Quote', variant: 'warning' },
      job: { label: 'Active Job', variant: 'default' },
      completed: { label: 'Completed', variant: 'success' },
      cancelled: { label: 'Cancelled', variant: 'destructive' },
    };
    const s = map[status] ?? { label: status, variant: 'secondary' as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const stats = [
    { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, sub: 'Active & completed jobs', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Total Quotes', value: proformasCount ?? 0, sub: 'All time', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Active Jobs', value: jobsCount ?? 0, sub: 'In progress', icon: Briefcase, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { label: 'Clients', value: clientsCount ?? 0, sub: 'In your portfolio', icon: Users, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Pending Quotes', value: pendingCount ?? 0, sub: 'Awaiting approval', icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: 'Completed Jobs', value: completedCount ?? 0, sub: 'Delivered to clients', icon: CheckCircle2, color: 'text-teal-500', bg: 'bg-teal-500/10' },
  ];

  return (
    <div className="relative container mx-auto px-4 py-8 max-w-7xl">

      {/* Glassmorphism background blobs */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/[0.035] blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-foreground/[0.025] blur-[120px]" />
        <div className="absolute top-1/2 left-1/4 h-[400px] w-[400px] rounded-full bg-primary/[0.02] blur-[150px]" />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Overview of your business performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/proforma/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:-translate-y-0.5">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Quote
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <TabsList className="bg-background/60 backdrop-blur border border-border/40 p-1 rounded-xl h-auto flex flex-wrap gap-1 justify-start">
          <TabsTrigger value="overview" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md text-sm font-medium transition-all">
            <Activity className="h-4 w-4 mr-2" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md text-sm font-medium transition-all">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md text-sm font-medium transition-all">
            <Clock className="h-4 w-4 mr-2" />
            Recent Activity
          </TabsTrigger>
          <TabsTrigger value="ai" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-500 data-[state=active]:shadow-md transition-all group text-sm font-medium">
            <Sparkles className="h-4 w-4 mr-2 text-purple-500 group-data-[state=active]:animate-pulse" />
            AI Analytical Assistant
          </TabsTrigger>
        </TabsList>

        {/* --- SUMMARY TAB --- */}
        <TabsContent value="overview" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-8">
              <RecentlyVisitedJobs />

              <QuickActions />
            </div>

            <div className="lg:col-span-8">
              <DashboardStatCards stats={stats} />
            </div>
          </div>
        </TabsContent>

        {/* --- ANALYTICS TAB --- */}
        <TabsContent value="analytics" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="group relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 backdrop-blur transition-all hover:border-border/60 hover:shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.04] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10" />
                <div className="pb-2 pt-5 px-5 flex flex-row items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Revenue Trend</p>
                    <p className="text-xs text-muted-foreground mt-1">Earnings over the last 12 months</p>
                  </div>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="px-5 pb-5">
                  <RevenueChart data={revenueChartData} />
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 backdrop-blur transition-all hover:border-border/60 hover:shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.04] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10" />
                <div className="pb-2 pt-5 px-5 flex flex-row items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Quote Status</p>
                    <p className="text-xs text-muted-foreground mt-1">Breakdown by current project status</p>
                  </div>
                  <Activity className="h-4 w-4 text-violet-500" />
                </div>
                <div className="px-5 pb-5">
                  <StatusDonutChart data={donutData} />
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 backdrop-blur transition-all hover:border-border/60 hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.04] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10" />
              <div className="pb-2 pt-5 px-5 flex flex-row items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Monthly Productivity</p>
                  <p className="text-xs text-muted-foreground mt-1">Number of quotes created per month</p>
                </div>
                <FileText className="h-4 w-4 text-blue-500" />
              </div>
              <div className="px-5 pb-5">
                <MonthlyBarChart data={countChartData} />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* --- ACTIVITY TAB --- */}
        <TabsContent value="activity" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Recent Quotes</h2>
                <Link href="/quotes" className="text-xs text-primary hover:underline flex items-center gap-1 bg-primary/5 px-2 py-1 rounded-full">
                  All Quotes <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="group relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 backdrop-blur transition-all hover:border-border/60 hover:shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.04] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10" />
                {recentProformas && recentProformas.length > 0 ? (
                  <Table>
                    <TableHeader className="bg-muted/20">
                      <TableRow>
                        <TableHead className="font-medium">Project</TableHead>
                        <TableHead className="font-medium">Status</TableHead>
                        <TableHead className="text-right font-medium">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentProformas.map((p) => (
                        <TableRow key={p.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell>
                            <Link href={`/proforma/${p.id}`} className="font-medium text-foreground hover:text-primary transition-colors block truncate max-w-[150px]">
                              {p.project_name} - #{p.number}
                            </Link>
                          </TableCell>
                          <TableCell>{statusBadge(p.status)}</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            ${(p.total ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-3">
                    <AlertCircle className="h-12 w-12 text-muted/20" />
                    <p className="text-base font-medium">No quotes yet.</p>
                    <Link href="/proforma/new" className="text-primary hover:underline">Create your first quote</Link>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Recent Clients</h2>
                <Link href="/clients" className="text-xs text-primary hover:underline flex items-center gap-1 bg-primary/5 px-2 py-1 rounded-full">
                  All Clients <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="group relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 backdrop-blur transition-all hover:border-border/60 hover:shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.04] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10" />
                {recentClients && recentClients.length > 0 ? recentClients.map((client) => (
                  <Link key={client.id} href={`/clients/${client.id}`}>
                    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer group/item border-b border-border/20 last:border-0">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/5">
                        <span className="text-sm font-bold text-primary">
                          {client.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate leading-none mb-1">{client.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{client.email || 'No email provided'}</p>
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover/item:text-primary transition-colors shrink-0" />
                    </div>
                  </Link>
                )) : (
                  <div className="py-10 text-center text-muted-foreground">
                    <p className="text-sm italic">No recent clients found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
          <DashboardAIChat />
        </TabsContent>
      </Tabs>
    </div>
  );
}
