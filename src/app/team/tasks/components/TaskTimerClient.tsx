'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { startTimeEntry, stopTimeEntry } from '../actions';

export default function TaskTimerClient({ teamMemberId, proformaId, globalActiveEntry }: { teamMemberId: string, proformaId: string, globalActiveEntry: any }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  const isActiveForThisProject = globalActiveEntry && globalActiveEntry.proforma_id === proformaId;
  const isAnotherProjectActive = globalActiveEntry && globalActiveEntry.proforma_id !== proformaId;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActiveForThisProject) {
      interval = setInterval(() => {
        const start = new Date(globalActiveEntry.start_time).getTime();
        const now = new Date().getTime();
        const diff = Math.floor((now - start) / 1000);

        const hrs = Math.floor(diff / 3600).toString().padStart(2, '0');
        const mins = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        const secs = (diff % 60).toString().padStart(2, '0');

        setElapsedTime(`${hrs}:${mins}:${secs}`);
      }, 1000);
    } else {
      setElapsedTime('00:00:00');
    }
    return () => clearInterval(interval);
  }, [isActiveForThisProject, globalActiveEntry]);

  const handleStart = async () => {
    if (isAnotherProjectActive) {
      toast.error('You are already clocked into another project. Stop that timer first.');
      return;
    }
    setIsUpdating(true);
    const res = await startTimeEntry(teamMemberId, proformaId);
    setIsUpdating(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Timer started for this project!');
    }
  };

  const handleStop = async () => {
    if (!isActiveForThisProject) return;
    setIsUpdating(true);
    const res = await stopTimeEntry(globalActiveEntry.id);
    setIsUpdating(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Timer stopped successfully.');
    }
  };

  if (isActiveForThisProject) {
    return (
      <div className="flex items-center justify-between w-full mt-4 pt-4 border-t border-border/40 gap-4">
        <div className="flex-1 flex flex-col justify-center pl-2">
           <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">
             <Clock className="w-3.5 h-3.5 animate-pulse" /> Clocked In
           </div>
           <div className="text-2xl font-mono text-[#0D3B47] tracking-tighter tabular-nums drop-shadow-sm font-semibold">{elapsedTime}</div>
        </div>
        <Button
          onClick={handleStop}
          disabled={isUpdating}
          variant="destructive"
          className="rounded-xl font-bold tracking-wide shadow-md hover:scale-105 transition-transform"
        >
          {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="mr-2 h-4 w-4" />}
          Stop
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full mt-4 pt-4 border-t border-border/40">
      <Button
        onClick={handleStart}
        disabled={isUpdating || isAnotherProjectActive}
        className={`w-full rounded-xl font-bold tracking-wide shadow-sm transition-all ${
          isAnotherProjectActive ? 'opacity-50 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-0.5 hover:shadow-md'
        }`}
      >
        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
        {isAnotherProjectActive ? 'Other Project Active' : 'Start Timer'}
      </Button>
    </div>
  );
}
