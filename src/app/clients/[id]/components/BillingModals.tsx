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
          toast.error('Se requiere seleccionar un proyecto/proforma.');
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
            ? 'Factura creada exitosamente'
            : `Registro de ${openType === 'deposit' ? 'depósito' : 'pago'} exitoso`
        );
        onClose();
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={openType !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {openType === 'payment' && 'Registrar Pago'}
            {openType === 'deposit' && 'Registrar Depósito de Adelanto'}
            {openType === 'invoice' && 'Crear Nueva Factura'}
          </DialogTitle>
          <DialogDescription>
            Completa los detalles a continuación.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="proforma_id">Proyecto / Proforma {openType === 'invoice' && '*'}</Label>
            <Select
              name="proforma_id"
              required={openType === 'invoice'}
              onValueChange={handleProformaChange}
              value={selectedProformaId || undefined}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un proyecto...">
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
                <Label htmlFor="invoice_number">Número de Factura *</Label>
                <Input id="invoice_number" name="invoice_number" placeholder="Ej. INV-001" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total_amount">Monto Total *</Label>
                  <Input
                    id="total_amount"
                    name="total_amount"
                    type="number"
                    step="0.01"
                    required
                    defaultValue={selectedProforma?.total || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issue_date">Fecha de Emisión</Label>
                  <Input id="issue_date" name="issue_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Fecha de Vencimiento</Label>
                <Input id="due_date" name="due_date" type="date" />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Monto *</Label>
                  <Input
                    id="amount"
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
                  <Label htmlFor="payment_date">Fecha</Label>
                  <Input id="payment_date" name="payment_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_method">Método de Pago</Label>
                <Select name="payment_method" defaultValue="transfer">
                  <SelectTrigger drop-shadow-sm>
                    <SelectValue placeholder="Selecciona método..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer">Transferencia Bancaria</SelectItem>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="card">Tarjeta de Crédito/Débito</SelectItem>
                    <SelectItem value="check">Cheque</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (Opcional)</Label>
            <Textarea id="notes" name="notes" placeholder="Detalles adicionales..." />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#306C3E] hover:bg-[#265832]" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Confirmar Registro'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
