'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { approveProforma, rejectProforma } from '@/app/p/[id]/actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import SignatureModal from './SignatureModal';

export default function PublicProformaActions({
  proformaId,
  status
}: {
  proformaId: string;
  status: string;
}) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  if (status === 'approved' || status === 'rejected') {
    return null;
  }

  const handleApproveSignature = async (signatureData: string | null, signatureName: string | null) => {
    setIsApproving(true);
    const result = await approveProforma(proformaId, signatureData || undefined, signatureName || undefined);
    
    if (!result.success) {
      toast.error('Error', {
        description: result.error || 'No se pudo aprobar',
      });
      setIsApproving(false);
    } else {
      toast.success('¡Aprobada!', {
        description: 'La proforma ha sido aprobada exitosamente.',
      });
      setIsSignatureModalOpen(false);
      // Let it remain loaded, the component will unmount natively
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    const result = await rejectProforma(proformaId);
    if (!result.success) {
      toast.error('Error', {
        description: result.error || 'No se pudo rechazar',
      });
    } else {
      toast.success('Rechazada', {
        description: 'La proforma ha sido rechazada.',
      });
    }
    setIsRejecting(false);
  };

  return (
    <>
      <div className="flex gap-2 mr-4 print:hidden">
        <Button 
        variant="outline" 
        className="border-red-500 text-red-500 hover:bg-red-50"
        onClick={handleReject}
        disabled={isApproving || isRejecting}
      >
        {isRejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Rechazar
      </Button>
        <Button 
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={() => setIsSignatureModalOpen(true)}
          disabled={isApproving || isRejecting}
        >
          {isApproving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Aprobar Proforma
        </Button>
      </div>

      <SignatureModal 
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        isLoading={isApproving}
        onConfirm={handleApproveSignature}
      />
    </>
  );
}
