'use client';

import * as React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Mail, FileText, CheckCircle2 } from 'lucide-react';
import { sendInvoiceEmail, sendPaymentEmail } from './actions';

interface EmailBillingModalProps {
  type: 'invoice' | 'payment';
  id: string; // invoiceId or paymentId
  clientEmail: string;
  clientName: string;
  referenceNumber: string;
  onClose: () => void;
}

export function EmailBillingModal({ 
  type, 
  id, 
  clientEmail, 
  clientName, 
  referenceNumber, 
  onClose 
}: EmailBillingModalProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    to: clientEmail,
    subject: type === 'invoice' 
      ? `Factura #${referenceNumber} - Recordatorio de Pago` 
      : `Recibo de Pago - Referencia #${referenceNumber}`,
    message: ''
  });

  React.useEffect(() => {
    const defaultMessage = type === 'invoice'
      ? `Hola ${clientName},\n\nEspero que estés bien. Adjunto encontrarás la factura #${referenceNumber} correspondiente a los servicios realizados.\n\nPor favor, avísanos si tienes alguna pregunta.\n\nSaludos,\nEl equipo.`
      : `Hola ${clientName},\n\nConfirmamos que hemos recibido tu pago con éxito. Adjunto encontrarás el recibo oficial correspondiente a la referencia #${referenceNumber}.\n\nGracias por confiar en nosotros.\n\nSaludos,\nEl equipo.`;
    
    setFormData(prev => ({ ...prev, message: defaultMessage }));
  }, [type, clientName, referenceNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const data = new FormData();
    data.append('to', formData.to);
    data.append('subject', formData.subject);
    data.append('message', formData.message);

    try {
      const result = type === 'invoice' 
        ? await sendInvoiceEmail(id, data)
        : await sendPaymentEmail(id, data);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Correo enviado exitosamente');
        onClose();
      }
    } catch (error) {
      toast.error('Error al enviar el correo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Enviar {type === 'invoice' ? 'Factura' : 'Recibo'} por Email
          </DialogTitle>
          <DialogDescription>
            Personaliza el mensaje antes de enviar el documento PDF al cliente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="to">Para</Label>
            <Input
              id="to"
              type="email"
              value={formData.to}
              onChange={e => setFormData({ ...formData, to: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Asunto</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={e => setFormData({ ...formData, subject: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensaje</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={e => setFormData({ ...formData, message: e.target.value })}
              rows={8}
              className="resize-none"
              required
            />
          </div>

          <div className="bg-muted/30 p-3 rounded-lg flex items-center gap-3">
            <div className="h-10 w-10 rounded bg-white border flex items-center justify-center">
              <FileText className="h-5 w-5 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Documento Adjunto</p>
              <p className="text-sm font-medium">
                {type === 'invoice' ? `Factura_${referenceNumber}.pdf` : `Recibo_Pago_${referenceNumber}.pdf`}
              </p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-[#306C3E] hover:bg-[#265832]">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Ahora
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
