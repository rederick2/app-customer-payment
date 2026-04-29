'use client';

import * as React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Clock, ArrowUpRight, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function RecentlyVisitedJobs() {
  const [jobs, setJobs] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const supabase = createClient();

  const fetchJobs = React.useCallback(async (ids: string[]) => {
    if (ids.length === 0) {
      setJobs([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('proformas')
        .select('id, project_name, number, status, created_at, clients ( name )')
        .in('id', ids);

      if (error) throw error;

      // Sort according to the order in localStorage
      const sortedJobs = ids
        .map(id => data?.find(job => job.id === id))
        .filter(Boolean)
        .slice(0, 8);

      setJobs(sortedJobs);
    } catch (err) {
      console.error('Error fetching recently visited jobs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  React.useEffect(() => {
    const stored = localStorage.getItem('recentlyVisitedJobs');
    if (stored) {
      try {
        const ids = JSON.parse(stored);
        fetchJobs(ids);
      } catch (e) {
        console.error('Error parsing recentlyVisitedJobs:', e);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [fetchJobs]);

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'warning' | 'success' }> = {
      quote: { label: 'Quote', variant: 'warning' },
      job: { label: 'Active Job', variant: 'default' },
      completed: { label: 'Completed', variant: 'success' },
      cancelled: { label: 'Cancelled', variant: 'destructive' },
    };
    const s = map[status] ?? { label: status, variant: 'secondary' as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm border-border/40">
        <CardHeader className="pb-2 pt-5 px-5">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recently Visited Jobs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 flex justify-center items-center min-h-[100px]">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (jobs.length === 0) {
    return null; // Don't show if empty
  }

  return (
    <div className="space-y-3">
      <Card className="shadow-sm border-border/40 overflow-hidden">
        <CardHeader className="pb-2 pt-5 px-5">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recently Visited Jobs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-1">
          {jobs.map((job) => (
            <Link key={job.id} href={`/proforma/${job.id}`}>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                  <Briefcase className="h-4 w-4 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{job.project_name} - #{job.number}</p>
                    {statusBadge(job.status)}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {(job.clients as any)?.name || 'No client'}
                  </p>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors shrink-0" />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
