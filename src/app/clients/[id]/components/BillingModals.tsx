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

const formatUSD = (val: string | number) => {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const parseUSD = (val: string) => {
  return val.replace(/[^0-9.]/g, '');
};

// Internal component for handling currency input focus/blur logic
const CurrencyInput = ({
  value,
  onChange,
  className,
  ...props
}: any) => {
  const [localValue, setLocalValue] = React.useState(value?.toString() || '');
  const [isFocused, setIsFocused] = React.useState(false);

  React.useEffect(() => {
    if (!isFocused) {
      setLocalValue(value?.toString() || '');
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseUSD(e.target.value);
    setLocalValue(e.target.value);
    onChange(raw);
  };

  return (
    <Input
      {...props}
      value={isFocused ? localValue : formatUSD(value)}
      onFocus={() => {
        setIsFocused(true);
        setLocalValue(value?.toString() || '');
      }}
      onBlur={() => {
        setIsFocused(false);
      }}
      onChange={handleChange}
      className={className}
    />
  );
};

export function BillingModals({ clientId, proformas, payments, invoices, openType, onClose }: BillingModalsProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [syncToQBO, setSyncToQBO] = React.useState(true);
  const [paymentMethod, setPaymentMethod] = React.useState<string | null>('transfer');

  const paymentMethodLabels: Record<string, string> = {
    transfer: 'Bank Transfer',
    cash: 'Cash',
    card: 'Credit/Debit Card',
    check: 'Check',
    other: 'Other'
  };
  const [selectedProformaId, setSelectedProformaId] = React.useState<string | null>(null);
  const [amount, setAmount] = React.useState<string>('');
  const [taxAmount, setTaxAmount] = React.useState<number>(0);
  const [discountAmount, setDiscountAmount] = React.useState<number>(0);
  const [unlinkedPayments, setUnlinkedPayments] = React.useState<any[]>([]);
  const [selectedPaymentIds, setSelectedPaymentIds] = React.useState<string[]>([]);

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
      <DialogContent className="sm:max-w-[425px] rounded-2xl shadow-2xl border-border/40 bg-background/95 backdrop-blur-xl p-6">
        <DialogHeader>
          <DialogTitle className="font-bold text-xl uppercase">
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
          <div className="space-y-2 text-left">
            <Label htmlFor="proforma_id" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Project / Quote {openType === 'invoice' && '*'}</Label>
            <Select
              name="proforma_id"
              required={openType === 'invoice'}
              onValueChange={handleProformaChange}
              value={selectedProformaId || undefined}
            >
              <SelectTrigger
                id="proforma_id"
                className="w-full h-12 bg-background border-border/60 rounded-xl shadow-sm hover:bg-accent/5 transition-all focus:ring-2 focus:ring-primary/10 px-4"
              >
                <SelectValue placeholder="Select a project...">
                  {selectedProforma?.project_name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/40 shadow-2xl animate-in zoom-in-95 duration-200">
                {proformas.map((p) => (
                  <SelectItem
                    key={p.id}
                    value={p.id}
                    className="py-3 px-4 rounded-lg cursor-pointer transition-colors"
                  >
                    {p.project_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {openType === 'invoice' ? (
            <>
              <div className="space-y-2 text-left">
                <Label htmlFor="invoice_number" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Invoice Number *</Label>
                <Input id="invoice_number" className="rounded-xl h-11 shadow-sm border-border/60 focus:ring-2 focus:ring-primary/10" name="invoice_number" placeholder="Ex. INV-001" required />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2 text-left">
                  <Label htmlFor="total_amount" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Total *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-sm">$</span>
                    <CurrencyInput
                      id="total_amount"
                      className={cn("rounded-xl h-11 shadow-sm border-border/60 pl-7 font-bold", selectedProformaId && "bg-muted cursor-not-allowed")}
                      name="total_amount"
                      type="text"
                      inputMode="decimal"
                      required
                      value={amount}
                      onChange={setAmount}
                      readOnly={!!selectedProformaId}
                    />
                  </div>
                </div>
                <div className="space-y-2 text-left">
                  <Label htmlFor="tax_amount" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Tax ($)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-sm">$</span>
                    <CurrencyInput
                      id="tax_amount"
                      className={cn("rounded-xl h-11 shadow-sm border-border/60 pl-7", selectedProformaId && "bg-muted cursor-not-allowed")}
                      name="tax_amount"
                      type="text"
                      inputMode="decimal"
                      value={taxAmount}
                      onChange={(val: string) => setTaxAmount(parseFloat(val) || 0)}
                      readOnly={!!selectedProformaId}
                    />
                  </div>
                </div>
                <div className="space-y-2 text-left">
                  <Label htmlFor="discount_amount" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Desc. ($)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-sm">$</span>
                    <CurrencyInput
                      id="discount_amount"
                      className={cn("rounded-xl h-11 shadow-sm border-border/60 pl-7", selectedProformaId && "bg-muted cursor-not-allowed")}
                      name="discount_amount"
                      type="text"
                      inputMode="decimal"
                      value={discountAmount}
                      onChange={(val: string) => setDiscountAmount(parseFloat(val) || 0)}
                      readOnly={!!selectedProformaId}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 text-left">
                  <Label htmlFor="issue_date" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Issue Date</Label>
                  <Input id="issue_date" className="rounded-xl h-11 shadow-sm border-border/60" name="issue_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="space-y-2 text-left">
                  <Label htmlFor="due_date" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Due Date</Label>
                  <Input id="due_date" className="rounded-xl h-11 shadow-sm border-border/60" name="due_date" type="date" />
                </div>
              </div>

              <div className="flex items-center space-x-3 bg-primary/5 p-4 border border-primary/10 rounded-2xl">
                <Checkbox
                  id="sync-qbo"
                  checked={syncToQBO}
                  onCheckedChange={(checked) => setSyncToQBO(!!checked)}
                  className="rounded-md border-primary animate-in zoom-in-50 duration-300"
                />
                <div className="grid gap-1 leading-none">
                  <Label htmlFor="sync-qbo" className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-primary">
                    Sincronizar con QuickBooks
                  </Label>
                  <p className="text-[9px] text-muted-foreground/80 font-medium">Auto-sync after creation for seamless accounting.</p>
                </div>
              </div>

              {!isSubmitting && unlinkedPayments.length > 0 && (
                <div className="space-y-3 border border-border/40 p-4 bg-muted/20 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Link existing payments</Label>
                    <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">{selectedPaymentIds.length} selected</span>
                  </div>
                  <div className="max-h-[120px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {unlinkedPayments.map(p => (
                      <div key={p.id} className="flex items-center space-x-3 p-3 bg-background border border-border/40 rounded-xl hover:border-primary/30 hover:scale-[1.01] transition-all shadow-sm">
                        <Checkbox
                          id={`bp-${p.id}`}
                          checked={selectedPaymentIds.includes(p.id)}
                          onCheckedChange={(checked) => {
                            setSelectedPaymentIds(prev =>
                              checked ? [...prev, p.id] : prev.filter(id => id !== p.id)
                            );
                          }}
                          className="rounded-md"
                        />
                        <label htmlFor={`bp-${p.id}`} className="text-[10px] cursor-pointer flex-1 grid grid-cols-2 gap-1 items-center">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-foreground">{new Date(p.payment_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter opacity-60">{p.payment_method || 'Unknown'}</span>
                          </div>
                          <div className="text-right font-black text-primary text-xs">
                            ${p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                <div className="space-y-2 text-left">
                  <Label htmlFor="amount" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Amount *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-sm">$</span>
                    <CurrencyInput
                      id="amount"
                      className="rounded-xl h-11 shadow-sm border-border/60 pl-7 font-bold"
                      name="amount"
                      type="text"
                      inputMode="decimal"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={setAmount}
                    />
                  </div>
                </div>
                <div className="space-y-2 text-left">
                  <Label htmlFor="payment_date" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Date</Label>
                  <Input id="payment_date" className="rounded-xl h-11 shadow-sm border-border/60" name="payment_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>
              <div className="space-y-2 text-left">
                <Label htmlFor="payment_method" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Payment Method</Label>
                <Select
                  name="payment_method"
                  defaultValue="transfer"
                  onValueChange={(val) => setPaymentMethod(val)}
                  value={paymentMethod}
                >
                  <SelectTrigger className="w-full h-11 rounded-xl bg-background border-border/60 shadow-sm hover:bg-accent/5 transition-all px-4 uppercase">
                    <SelectValue placeholder="Select method...">
                      {paymentMethod && paymentMethodLabels[paymentMethod]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40 shadow-2xl uppercase">
                    <SelectItem value="transfer" className="py-2.5 px-4 rounded-lg cursor-pointer transition-colors font-medium">Bank Transfer</SelectItem>
                    <SelectItem value="cash" className="py-2.5 px-4 rounded-lg cursor-pointer transition-colors font-medium">Cash</SelectItem>
                    <SelectItem value="card" className="py-2.5 px-4 rounded-lg cursor-pointer transition-colors font-medium">Credit/Debit Card</SelectItem>
                    <SelectItem value="check" className="py-2.5 px-4 rounded-lg cursor-pointer transition-colors font-medium">Check</SelectItem>
                    <SelectItem value="other" className="py-2.5 px-4 rounded-lg cursor-pointer transition-colors font-medium">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2 text-left">
            <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Notes (Optional)</Label>
            <Textarea id="notes" name="notes" placeholder="Additional details..." className="rounded-xl border-border/60 min-h-[80px]" />
          </div>

          <DialogFooter className="">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} className="bg-secundary hover:bg-secundary/90 text-secundary-foreground font-black uppercase tracking-widest text-[10px] rounded-xl px-8 h-11 shadow-md transition-all hover:scale-105 active:scale-95">
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-xl px-8 h-11 shadow-md transition-all" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Confirm Record'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
