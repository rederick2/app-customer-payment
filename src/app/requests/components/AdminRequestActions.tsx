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
import { deleteRequest, updateRequestStatus } from './actions';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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

      <Dialog>
        <DialogTrigger render={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
            disabled={isUpdating}
          />
        }>
          <Trash2 className="h-4 w-4" />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center text-xl">Delete Request?</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to delete this service request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
            <DialogTrigger render={<Button variant="outline" className="flex-1" />}>
              Cancel
            </DialogTrigger>
            <Button
              variant="destructive"
              className="flex-1 font-bold"
              onClick={async () => {
                setIsUpdating(true);
                const res = await deleteRequest(requestId);
                setIsUpdating(false);
                if (res.error) toast.error(res.error);
                else toast.success('Request deleted');
              }}
            >
              Delete Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
