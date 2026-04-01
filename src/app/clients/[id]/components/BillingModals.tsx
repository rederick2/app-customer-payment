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
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { recordPayment, createInvoice, getUnlinkedPayments } from '../actions';
import { syncInvoiceToQuickBooks } from '@/app/invoices/actions';
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
  const [syncToQBO, setSyncToQBO] = React.useState(true);
  const [selectedProformaId, setSelectedProformaId] = React.useState<string | null>(null);
  const [amount, setAmount] = React.useState<string>('');
  const [taxAmount, setTaxAmount] = React.useState<number>(0);
  const [discountAmount, setDiscountAmount] = React.useState<number>(0);
  const [unlinkedPayments, setUnlinkedPayments] = React.useState<any[]>([]);
  const [selectedPaymentIds, setSelectedPaymentIds] = React.useState<string[]>([]);

  const selectedProforma = proformas.find(p => p.id === selectedProformaId);
  const proformaPayments = payments?.filter(p => p.proforma_id === selectedProformaId && p.status === 'completed') || [];
  const totalPaidForProforma = proformaPayments.reduce((acc, p) => acc + p.amount, 0);
  const remainingAmount = selectedProforma ? (selectedProforma.total - totalPaidForProforma) : 0;

  // Helper to calculate discount from proforma adjustments
  const calculateDiscount = (prof: any) => {
    if (!prof || !prof.adjustments) return 0;
    const subtotal = prof.subtotal || 0;
    const discountAdjustments = prof.adjustments.filter((a: any) => a.type === 'discount');
    return discountAdjustments.reduce((acc: number, adj: any) => {
      const amount = adj.valueType === 'percentage' ? (subtotal * adj.value) / 100 : adj.value;
      return acc + amount;
    }, 0);
  };

  // Reset states when modal opens/closes
  React.useEffect(() => {
    if (openType) {
      setTaxAmount(0);
      setDiscountAmount(0);
      setSyncToQBO(true);
      setSelectedPaymentIds([]);
      setUnlinkedPayments([]);

      if (openType === 'invoice') {
        getUnlinkedPayments(clientId).then(setUnlinkedPayments);
      }
    }
  }, [openType, clientId]);

  // Auto-fill amount when proforma is selected
  const handleProformaChange = (id: string | null) => {
    if (!id) {
      setSelectedProformaId(null);
      setAmount('');
      setTaxAmount(0);
      setDiscountAmount(0);
      return;
    }

    setSelectedProformaId(id);
    const p = proformas.find(item => item.id === id);
    if (p) {
      const pPayments = payments?.filter(pay => pay.proforma_id === id && pay.status === 'completed') || [];
      const tPaid = pPayments.reduce((acc, pay) => acc + pay.amount, 0);
      const rem = p.total - tPaid;
      setAmount(rem > 0 ? rem.toString() : '0');
      
      // Auto-fill tax and discount
      setTaxAmount(p.tax || 0);
      setDiscountAmount(calculateDiscount(p));
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
        result = (await createInvoice(clientId, proformaId, formData, selectedPaymentIds)) as any;
      }

      if (result?.error) {
        toast.error(result.error);
      } else {
        if (openType === 'invoice' && syncToQBO && result?.data?.id) {
          toast.success('Factura creada. Sincronizando con QuickBooks...');
          const syncRes = await syncInvoiceToQuickBooks(result.data.id);
          if (syncRes.success) {
            toast.success('Sincronización completada');
          } else {
            toast.error('Error en sincronización: ' + syncRes.error);
          }
        } else {
          toast.success(
            openType === 'invoice'
              ? 'Invoice created successfully'
              : `${openType === 'deposit' ? 'Deposit' : 'Payment'} registered successfully`
          );
        }
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
              <div className="space-y-1">
                <Label htmlFor="invoice_number" className="text-xs">Invoice Number *</Label>
                <Input id="invoice_number" className="rounded-none h-8" name="invoice_number" placeholder="Ex. INV-001" required />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="total_amount" className="text-xs">Total *</Label>
                  <Input
                    id="total_amount"
                    className={cn("rounded-none h-8", selectedProformaId && "bg-muted cursor-not-allowed")}
                    name="total_amount"
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    readOnly={!!selectedProformaId}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tax_amount" className="text-xs">Tax ($)</Label>
                  <Input
                    id="tax_amount"
                    className={cn("rounded-none h-8", selectedProformaId && "bg-muted cursor-not-allowed")}
                    name="tax_amount"
                    type="number"
                    step="0.01"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                    readOnly={!!selectedProformaId}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="discount_amount" className="text-xs">Desc. ($)</Label>
                  <Input
                    id="discount_amount"
                    className={cn("rounded-none h-8", selectedProformaId && "bg-muted cursor-not-allowed")}
                    name="discount_amount"
                    type="number"
                    step="0.01"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    readOnly={!!selectedProformaId}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="issue_date" className="text-xs">Issue Date</Label>
                  <Input id="issue_date" className="rounded-none h-8" name="issue_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="due_date" className="text-xs">Due Date</Label>
                  <Input id="due_date" className="rounded-none h-8" name="due_date" type="date" />
                </div>
              </div>
              
              <div className="flex items-center space-x-2 bg-primary/5 p-2.5 border border-primary/10 rounded-none">
                <Checkbox 
                  id="sync-qbo" 
                  checked={syncToQBO} 
                  onCheckedChange={(checked) => setSyncToQBO(!!checked)} 
                />
                <div className="grid gap-0.5 leading-none">
                  <Label htmlFor="sync-qbo" className="text-[10px] font-bold uppercase tracking-wider cursor-pointer text-primary">
                    Sincronizar con QuickBooks
                  </Label>
                  <p className="text-[9px] text-muted-foreground">Sync automatically after saving.</p>
                </div>
              </div>

              {!isSubmitting && unlinkedPayments.length > 0 && (
                <div className="space-y-2 border border-border/40 p-2.5 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Link existing payments</Label>
                    <span className="text-[10px] text-primary font-medium">{selectedPaymentIds.length} selected</span>
                  </div>
                  <div className="max-h-[100px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                    {unlinkedPayments.map(p => (
                      <div key={p.id} className="flex items-center space-x-2 p-1.5 bg-background border border-border/40 hover:border-primary/20 transition-colors">
                        <Checkbox 
                          id={`bp-${p.id}`}
                          checked={selectedPaymentIds.includes(p.id)}
                          onCheckedChange={(checked) => {
                            setSelectedPaymentIds(prev => 
                              checked ? [...prev, p.id] : prev.filter(id => id !== p.id)
                            );
                          }}
                        />
                        <label htmlFor={`bp-${p.id}`} className="text-[10px] cursor-pointer flex-1 grid grid-cols-2 gap-1 items-center">
                          <div className="flex flex-col">
                            <span className="font-semibold">{new Date(p.payment_date).toLocaleDateString()}</span>
                            <span className="text-[9px] text-muted-foreground">{p.payment_method || 'Unknown'}</span>
                          </div>
                          <div className="text-right font-bold text-primary">
                            ${p.amount}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
