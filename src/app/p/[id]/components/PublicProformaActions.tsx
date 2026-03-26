'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { approveProforma, rejectProforma } from '@/app/p/[id]/actions';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
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
        description: result.error || 'Failed to approve',
      });
      setIsApproving(false);
    } else {
      toast.success('Approved', {
        description: 'The quote has been approved.',
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
        description: result.error || 'Failed to reject',
      });
    } else {
      toast.success('Rejected', {
        description: 'The quote has been rejected.',
      });
    }
    setIsRejecting(false);
  };

  return (
    <>
      <div className="flex gap-3">

        {/* Reject */}
        <Button
          variant="outline"
          className="flex items-center gap-2 border-red-500 text-red-600 hover:bg-red-50 hover:border-red-600 transition-all"
          onClick={handleReject}
          disabled={isApproving || isRejecting}
        >
          {isRejecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          Reject
        </Button>

        {/* Approve */}
        <Button
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white shadow-sm transition-all"
          onClick={() => setIsSignatureModalOpen(true)}
          disabled={isApproving || isRejecting}
        >
          {isApproving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Approve
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
