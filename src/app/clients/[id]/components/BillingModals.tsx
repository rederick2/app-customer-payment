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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { recordPayment, createInvoice } from '../actions';
import { toast } from 'sonner';

interface BillingModalsProps {
  clientId: string;
  proformas: any[];
  payments: any[];
  invoices: any[];
  openType: 'payment' | 'deposit' | 'invoice' | null;
  onClose: () => void;
}

export function BillingModals({ clientId, proformas, payments, invoices, openType, onClose }: BillingModalsProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedProformaId, setSelectedProformaId] = React.useState<string | null>(null);
  const [amount, setAmount] = React.useState<string>('');

  const selectedProforma = proformas.find(p => p.id === selectedProformaId);
  const proformaPayments = payments?.filter(p => p.proforma_id === selectedProformaId && p.status === 'completed') || [];
  const totalPaidForProforma = proformaPayments.reduce((acc, p) => acc + p.amount, 0);
  const remainingAmount = selectedProforma ? (selectedProforma.total - totalPaidForProforma) : 0;

  // Reset states when modal opens/closes
  React.useEffect(() => {
    if (openType) {
      setSelectedProformaId(null);
      setAmount('');
    }
  }, [openType]);

  // Auto-fill amount when proforma is selected
  const handleProformaChange = (id: string | null) => {
    if (!id) {
      setSelectedProformaId(null);
      setAmount('');
      return;
    }

    setSelectedProformaId(id);
    const p = proformas.find(item => item.id === id);
    if (p) {
      const pPayments = payments?.filter(pay => pay.proforma_id === id && pay.status === 'completed') || [];
      const tPaid = pPayments.reduce((acc, pay) => acc + pay.amount, 0);
      const rem = p.total - tPaid;
      setAmount(rem > 0 ? rem.toString() : '0');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const proformaId = formData.get('proforma_id') as string;

    try {
      let result;
      if (openType === 'payment' || openType === 'deposit') {
        formData.append('type', openType);
        result = await recordPayment(clientId, proformaId || null, formData);
      } else if (openType === 'invoice') {
        if (!proformaId) {
          toast.error('Selecting a project/proforma is required.');
          setIsSubmitting(false);
          return;
        }
        result = await createInvoice(clientId, proformaId, formData);
      }

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(
          openType === 'invoice'
            ? 'Invoice created successfully'
            : `${openType === 'deposit' ? 'Deposit' : 'Payment'} registered successfully`
        );
        onClose();
      }
    } catch (error) {
      toast.error('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={openType !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] rounded-none shadow-lg border-border/40">
        <DialogHeader>
          <DialogTitle className="font-bold text-xl">
            {openType === 'payment' && 'Register Payment'}
            {openType === 'deposit' && 'Register Advance Deposit'}
            {openType === 'invoice' && 'Create New Invoice'}
          </DialogTitle>
          <DialogDescription>
            Fill out the details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="proforma_id">Project / Proforma {openType === 'invoice' && '*'}</Label>
            <Select
              name="proforma_id"
              required={openType === 'invoice'}
              onValueChange={handleProformaChange}
              value={selectedProformaId || undefined}
            >
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Select a project...">
                  {selectedProforma ? selectedProforma.project_name : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {proformas.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.project_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {openType === 'invoice' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="invoice_number">Invoice Number *</Label>
                <Input id="invoice_number" className="rounded-none" name="invoice_number" placeholder="Ex. INV-001" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total_amount">Total Amount *</Label>
                  <Input
                    id="total_amount"
                    className="rounded-none"
                    name="total_amount"
                    type="number"
                    step="0.01"
                    required
                    defaultValue={selectedProforma?.total || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issue_date">Issue Date</Label>
                  <Input id="issue_date" className="rounded-none" name="issue_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input id="due_date" className="rounded-none" name="due_date" type="date" />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    className="rounded-none"
                    name="amount"
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    min="1"
                    max={selectedProforma ? remainingAmount : undefined}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_date">Date</Label>
                  <Input id="payment_date" className="rounded-none" name="payment_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select name="payment_method" defaultValue="transfer">
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Select method..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea id="notes" name="notes" placeholder="Additional details..." className="rounded-none" />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} className="rounded-none">
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-none" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Confirm Record'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
