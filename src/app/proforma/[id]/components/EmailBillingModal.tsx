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
      ? `Invoice #${referenceNumber} - Payment Reminder`
      : `Payment Receipt - Reference #${referenceNumber}`,
    message: ''
  });

  React.useEffect(() => {
    const defaultMessage = type === 'invoice'
      ? `Hello ${clientName},\n\nI hope you are well. Attached you will find the invoice #${referenceNumber} corresponding to the services performed.\n\nPlease let us know if you have any questions.\n\nRegards,\nThe Team.`
      : `Hello ${clientName},\n\nWe confirm that we have received your payment successfully. Attached you will find the official receipt corresponding to the reference #${referenceNumber}.\n\nThank you for trusting us.\n\nRegards,\nThe Team.`;

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
        toast.success('Email sent successfully');
        onClose();
      }
    } catch (error) {
      toast.error('Error sending email');
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
            Send {type === 'invoice' ? 'Invoice' : 'Receipt'} by Email
          </DialogTitle>
          <DialogDescription>
            Personalize the message before sending the PDF document to the client.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="email"
              value={formData.to}
              onChange={e => setFormData({ ...formData, to: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={e => setFormData({ ...formData, subject: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
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
            <div className="h-10 w-10 rounded bg-card border flex items-center justify-center">
              <FileText className="h-5 w-5 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Attached Document</p>
              <p className="text-sm font-medium">
                {type === 'invoice' ? `Invoice_${referenceNumber}.pdf` : `Receipt_Payment_${referenceNumber}.pdf`}
              </p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Now
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
