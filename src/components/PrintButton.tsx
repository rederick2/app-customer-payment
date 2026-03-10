'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <Button 
      onClick={() => {
        if (typeof window !== 'undefined') {
          window.print();
        }
      }}
      className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:-translate-y-1"
    >
      <Printer className="mr-2 h-4 w-4" />
      Imprimir / Exportar PDF
    </Button>
  );
}
