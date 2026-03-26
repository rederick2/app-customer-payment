'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SignatureCanvas from 'react-signature-canvas';
import { Loader2 } from 'lucide-react';
import React from 'react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signatureData: string | null, signatureName: string | null) => Promise<void>;
  isLoading: boolean;
}

export default function SignatureModal({ isOpen, onClose, onConfirm, isLoading }: SignatureModalProps) {
  const [activeTab, setActiveTab] = useState('draw');
  const [typedName, setTypedName] = useState('');
  const sigCanvas = useRef<SignatureCanvas | null>(null);

  const handleClear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
  };

  const handleConfirm = async () => {
    if (activeTab === 'draw') {
      if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
        // Obtenemos el PNG con fondo transparente
        const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
        await onConfirm(dataUrl, null);
      } else {
        await onConfirm(null, null); // Sin firma obligatoria pero lo procesa
      }
    } else {
      await onConfirm(null, typedName.trim() || null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => { if (!val && !isLoading) onClose(); }}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif">Signature Required</DialogTitle>
          <DialogDescription>
            Please, register your signature below to formally approve the quote.
          </DialogDescription>
        </DialogHeader>

        <div className="w-full mt-4">
          <div className="grid w-full grid-cols-2 inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
            <button
              onClick={() => setActiveTab('draw')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${activeTab === 'draw' ? 'bg-background text-foreground shadow-sm' : ''}`}
            >
              Draw Signature
            </button>
            <button
              onClick={() => setActiveTab('type')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${activeTab === 'type' ? 'bg-background text-foreground shadow-sm' : ''}`}
            >
              Type Name
            </button>
          </div>

          {activeTab === 'draw' && (
            <div className="mt-4">
              <div className="border border-border/70 bg-secondary/10 rounded-xl overflow-hidden relative shadow-inner" style={{ height: 200, width: '100%' }}>
                <SignatureCanvas
                  ref={sigCanvas}
                  penColor="#0f172a"
                  canvasProps={{
                    className: 'w-full h-full cursor-crosshair touch-none'
                  }}
                />
                <button
                  onClick={handleClear}
                  className="absolute top-3 right-3 text-[10px] uppercase font-bold tracking-wider bg-white text-muted-foreground hover:bg-muted/30 hover:text-foreground px-2 py-1 rounded shadow-sm transition-all"
                >
                  Clear
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Use the mouse or your finger to sign inside the box.
              </p>
            </div>
          )}

          {activeTab === 'type' && (
            <div className="mt-4">
              <div className="space-y-4 py-8">
                <Input
                  placeholder="type your full name..."
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  autoFocus
                  className="text-center font-serif text-2xl h-16 border-dashed shadow-inner focus-visible:ring-1 bg-secondary/10"
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Your name will replace the signature in the final PDF document.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-8 flex gap-3 sm:gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white shadow-md">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm and Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
