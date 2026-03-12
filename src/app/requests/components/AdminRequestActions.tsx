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

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    
    // Optimistic UI could be added here, but for simplicity we just block UI with loading
    const result = await updateRequestStatus(requestId, newStatus);
    
    setIsUpdating(false);

    if (result.error) {
       toast.error('Error', { description: result.error });
    } else {
       toast.success('Estado actualizado', { description: 'La solicitud ha sido actualizada.' });
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      <Select defaultValue={currentStatus} onValueChange={handleStatusChange} disabled={isUpdating}>
        <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
          <SelectValue placeholder="Actualizar Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Pendiente</SelectItem>
          <SelectItem value="reviewed">Revisada</SelectItem>
          <SelectItem value="scheduled">Programada</SelectItem>
          <SelectItem value="completed">Completada</SelectItem>
          <SelectItem value="cancelled">Cancelada</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
