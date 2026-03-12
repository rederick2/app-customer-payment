'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { markProformaAsSent } from '@/app/p/[id]/actions';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';

export default function AdminProformaActions({
  proformaId,
  status
}: {
  proformaId: string;
  status: string;
}) {
  const [isSending, setIsSending] = useState(false);

  if (status !== 'draft') {
    return null;
  }

  const handleSend = async () => {
    setIsSending(true);
    const result = await markProformaAsSent(proformaId);
    if (!result.success) {
      toast.error('Error', {
        description: result.error || 'No se pudo marcar como enviada',
      });
    } else {
      toast.success('Marcada como Enviada', {
        description: 'La proforma ha sido marcada como enviada al cliente.',
      });
    }
    setIsSending(false);
  };

  return (
    <Button 
      variant="secondary"
      onClick={handleSend}
      disabled={isSending}
      className="mr-2 print:hidden"
    >
      {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
      Marcar como Enviada
    </Button>
  );
}
