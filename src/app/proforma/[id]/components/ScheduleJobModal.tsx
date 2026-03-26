'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { scheduleJob } from './actions';
import { toast } from 'sonner';

interface ScheduleJobModalProps {
  proformaId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectName: string;
}

export default function ScheduleJobModal({
  proformaId,
  isOpen,
  onClose,
  onSuccess,
  projectName,
}: ScheduleJobModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startAt || !endAt) {
      toast.error('Error', { description: 'Please select start and end dates and times.' });
      return;
    }

    if (new Date(startAt) >= new Date(endAt)) {
      toast.error('Error', { description: 'End date must be after start date.' });
      return;
    }

    setIsSubmitting(true);
    const result = await scheduleJob(proformaId, startAt, endAt);
    setIsSubmitting(false);

    if (result.error) {
      toast.error('Error', { description: result.error });
    } else {
      toast.success('¡Job scheduled!', { description: 'The quote has been converted to a Job and scheduled.' });
      onSuccess();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Programar Job
            </DialogTitle>
            <DialogDescription>
              Define dates and times for the project: <strong>{projectName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="start">Start Date and Time</Label>
              <Input
                id="start"
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end">End Date and Time</Label>
              <Input
                id="end"
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Convert to Job
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function onSuccess() {
  throw new Error('Function not implemented.');
}

