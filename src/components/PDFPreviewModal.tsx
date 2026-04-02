'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, ExternalLink } from 'lucide-react';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  blobUrl: string | null;
  title: string;
  filename?: string;
}

export function PDFPreviewModal({ isOpen, onClose, blobUrl, title, filename }: PDFPreviewModalProps) {
  if (!blobUrl) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || `${title.replace(/\s+/g, '_').toLowerCase()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col rounded-2xl border-border/40 shadow-2xl">
        <DialogHeader className="p-4 border-b border-border/40 bg-muted/5 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ExternalLink className="h-4 w-4 text-primary" />
            </div>
            <DialogTitle className="text-lg font-bold font-serif">{title}</DialogTitle>
          </div>
          <div className="flex items-center gap-2 pr-8">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-8 gap-2 font-bold rounded-xl border-primary/20 hover:bg-primary/5 transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 bg-muted/10 relative">
          <iframe
            src={`${blobUrl}#toolbar=0`}
            className="w-full h-full border-none"
            title={title}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
