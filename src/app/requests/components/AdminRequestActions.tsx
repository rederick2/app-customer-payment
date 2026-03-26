'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { updateRequestStatus } from './actions';
import { Loader2 } from 'lucide-react';

export default function AdminRequestActions({ requestId, currentStatus }: { requestId: string, currentStatus: string }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string | null) => {
    if (!newStatus) return;
    setIsUpdating(true);

    // Optimistic UI could be added here, but for simplicity we just block UI with loading
    const result = await updateRequestStatus(requestId, newStatus);

    setIsUpdating(false);

    if (result.error) {
      toast.error('Error', { description: result.error });
    } else {
      toast.success('Status updated', { description: 'The request has been updated.' });
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      <Select defaultValue={currentStatus} onValueChange={handleStatusChange} disabled={isUpdating}>
        <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
          <SelectValue placeholder="Update Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="reviewed">Reviewed</SelectItem>
          <SelectItem value="scheduled">Scheduled</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
