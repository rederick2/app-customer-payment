'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Download, Printer, Mail, X, FileText, Loader2 } from 'lucide-react';
import { QuoteView } from './QuoteView';
import { toast } from 'sonner';

interface QuotePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  proforma: any;
  items: any[];
  onSendEmail?: () => void;
}

export default function QuotePreviewModal({
  isOpen,
  onClose,
  proforma,
  items,
  onSendEmail
}: QuotePreviewModalProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      // Dynamic import inside function to ensure client-side only
      const { pdf } = await import('@react-pdf/renderer');
      const ProformaPDFModule = await import('@/lib/pdf/ProformaPDF');
      const ProformaPDFComponent = ProformaPDFModule.default;
      
      const blob = await pdf(
        <ProformaPDFComponent proforma={proforma} items={items} client={proforma.clients} />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Error al generar el PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const proformaName = proforma.project_name || 'Quotations';
  const fileName = `quote_${proforma.id.split('-')[0].toUpperCase()}.pdf`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-none max-w-[1300px] w-[95vw] h-[92vh] p-0 overflow-hidden flex flex-col bg-[#F8F9FA] rounded-2xl border-none shadow-3xl">
        <DialogHeader className="p-6 px-8 border-b bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between shrink-0 gap-4 sm:gap-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <DialogTitle className="text-2xl font-serif font-black text-[#0D3B47] tracking-tight">
              Vista Previa para Cliente
            </DialogTitle>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100/50">
               <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700/70">Client View Mode</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto sm:overflow-visible pb-2 sm:pb-0">
            {/* Download PDF Button */}
            <Button
              variant="outline"
              size="sm"
              disabled={!isMounted || isGenerating}
              onClick={handleDownloadPDF}
              className="h-10 gap-2 border-border/60 hover:bg-muted/50 font-bold px-4"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isGenerating ? 'Preparando...' : 'Descargar PDF'}
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePrint}
              className="h-10 gap-2 border-border/60 hover:bg-muted/50 font-bold px-4"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>

            <Button 
              variant="default" 
              size="sm" 
              onClick={onSendEmail}
              className="h-10 gap-2 bg-[#306C3E] hover:bg-[#306C3E]/90 text-white font-bold px-6 shadow-lg shadow-emerald-900/10"
            >
              <Mail className="h-4 w-4" />
              Enviar por Email
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-12 pt-8 scrollbar-thin scrollbar-thumb-border/40 scrollbar-track-transparent">
          <div className="max-w-5xl mx-auto bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] rounded-[2rem] overflow-hidden border border-border/10">
            <QuoteView 
                proforma={proforma} 
                items={items} 
                id={proforma.id} 
                hideActionBar={true} 
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
