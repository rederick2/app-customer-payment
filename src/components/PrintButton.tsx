'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PrintButtonProps {
  proforma: any;
  items: any[];
}

export default function PrintButton({ proforma, items }: PrintButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const ProformaPDFModule = await import('@/lib/pdf/ProformaPDF');
      const ProformaPDFComponent = ProformaPDFModule.default;

      const blob = await pdf(
        <ProformaPDFComponent proforma={proforma} items={items} client={proforma.clients} />
      ).toBlob();

      const fileName = `quote_${proforma.id.split('-')[0].toUpperCase()}.pdf`;
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

  return (
    <Button
      onClick={handleDownloadPDF}
      disabled={isGenerating}
      className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:-translate-y-1"
    >
      {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      {isGenerating ? 'Preparing...' : 'Download PDF'}
    </Button>
  );
}
