'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CheckCircle2,
  Clock,
  Send,
  ThumbsUp,
  ThumbsDown,
  Briefcase,
  AlertCircle,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getProformaStatusHistory } from './actions';

interface StatusHistoryProps {
  proformaId: string;
}

export function StatusHistory({ proformaId }: StatusHistoryProps) {
  const [history, setHistory] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchHistory = React.useCallback(async () => {
    setIsLoading(true);
    const data = await getProformaStatusHistory(proformaId);
    setHistory(data);
    setIsLoading(false);
  }, [proformaId]);

  React.useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock className="h-4 w-4" />;
      case 'sent': return <Send className="h-4 w-4" />;
      case 'approved': return <ThumbsUp className="h-4 w-4" />;
      case 'rejected': return <ThumbsDown className="h-4 w-4" />;
      case 'job': return <Briefcase className="h-4 w-4" />;
      case 'job_terminated': return <CheckCircle2 className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'sent': return 'bg-blue-500';
      case 'job': return 'bg-purple-500';
      case 'job_terminated': return 'bg-slate-700';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'sent': return 'Sent';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'job': return 'Job';
      case 'job_terminated': return 'Job Terminated';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground italic">
        No history available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-widest text-[#0D3B47]">Status History</h3>
        <button
          onClick={fetchHistory}
          className="text-[10px] font-bold uppercase text-primary hover:underline"
        >
          Update
        </button>
      </div>

      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {history.map((entry, index) => (
          <div key={entry.id} className="relative flex items-start group">
            <div className={cn(
              "absolute left-0 flex items-center justify-center w-10 h-10 rounded-full shadow-md z-10 transition-transform group-hover:scale-110",
              getStatusColor(entry.new_status),
              "text-white"
            )}>
              {getStatusIcon(entry.new_status)}
            </div>

            <div className="flex-1 ml-14 pt-0.5">
              <div className="flex items-center justify-between mb-1">
                <span className="font-black text-[13px] text-[#0D3B47] uppercase tracking-wide">
                  {getStatusLabel(entry.new_status)}
                </span>
                <time className="text-[10px] font-bold text-muted-foreground uppercase tabular-nums">
                  {format(new Date(entry.created_at), "MMM dd, HH:mm")}
                </time>
              </div>

              <div className="text-xs text-muted-foreground flex items-center gap-2">
                {entry.changed_by_user?.display_name ? (
                  <>
                    <span>Changed by</span>
                    <span className="font-bold text-foreground">{entry.changed_by_user.display_name}</span>
                  </>
                ) : (
                  <span>Action performed by the Client</span>
                )}

                {entry.old_status && (
                  <>
                    <span className="text-muted-foreground/30">•</span>
                    <span className="italic">From {getStatusLabel(entry.old_status)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
