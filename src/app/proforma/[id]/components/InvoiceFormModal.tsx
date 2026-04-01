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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { syncInvoiceToQuickBooks } from '@/app/invoices/actions';
import { upsertInvoice, getNextInvoiceNumber } from './actions';

interface InvoiceFormModalProps {
  proformaId: string;
  proforma?: any;
  clientId: string;
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function InvoiceFormModal({ 
  proformaId, 
  proforma,
  clientId, 
  initialData, 
  onClose, 
  onSuccess 
}: InvoiceFormModalProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [syncToQBO, setSyncToQBO] = React.useState(true);

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

  const [formData, setFormData] = React.useState({
    invoice_number: initialData?.invoice_number || '',
    issue_date: initialData?.issue_date || new Date().toISOString().split('T')[0],
    due_date: initialData?.due_date || '',
    total_amount: initialData?.total_amount || proforma?.total || 0,
    tax_amount: initialData?.tax_amount ?? (proforma?.tax || 0),
    discount_amount: initialData?.discount_amount ?? calculateDiscount(proforma),
    status: initialData?.status || 'draft',
    notes: initialData?.notes || ''
  });

  React.useEffect(() => {
    if (!initialData?.invoice_number) {
      getNextInvoiceNumber().then((num: string) => {
        setFormData(prev => ({ ...prev, invoice_number: num }));
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await upsertInvoice({
        ...formData,
        id: initialData?.id,
        proforma_id: proformaId,
        client_id: clientId
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        if (!initialData && syncToQBO && result.data?.id) {
          toast.success('Factura creada. Sincronizando...');
          const syncRes = await syncInvoiceToQuickBooks(result.data.id);
          if (syncRes.success) {
            toast.success('Sincronización completada');
          } else {
            toast.error('Error en sincronización: ' + syncRes.error);
          }
        } else {
          toast.success(initialData ? 'Factura actualizada' : 'Factura creada');
        }
        onSuccess();
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Factura' : 'Crear Nueva Factura'}</DialogTitle>
          <DialogDescription>
            Completa los detalles de la factura para este trabajo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_number">Número de Factura</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={e => setFormData({ ...formData, invoice_number: e.target.value })}
                placeholder="INV-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select 
                value={formData.status} 
                onValueChange={val => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="sent">Enviada</SelectItem>
                  <SelectItem value="paid">Pagada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issue_date">Fecha de Emisión</Label>
              <Input
                id="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={e => setFormData({ ...formData, issue_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Fecha de Vencimiento</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={e => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_amount">Total ($)</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                value={formData.total_amount}
                onChange={e => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                required
                readOnly={!!proforma}
                className={cn(!!proforma && "bg-muted cursor-not-allowed")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_amount">Impuestos ($)</Label>
              <Input
                id="tax_amount"
                type="number"
                step="0.01"
                value={formData.tax_amount}
                onChange={e => setFormData({ ...formData, tax_amount: parseFloat(e.target.value) || 0 })}
                readOnly={!!proforma}
                className={cn(!!proforma && "bg-muted cursor-not-allowed")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount_amount">Desc. ($)</Label>
              <Input
                id="discount_amount"
                type="number"
                step="0.01"
                value={formData.discount_amount}
                onChange={e => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                readOnly={!!proforma}
                className={cn(!!proforma && "bg-muted cursor-not-allowed")}
              />
            </div>
          </div>

          {!initialData && (
            <div className="flex items-center space-x-2 pt-2 bg-primary/5 p-3 rounded-xl border border-primary/10">
              <Checkbox 
                id="sync" 
                checked={syncToQBO} 
                onCheckedChange={(checked) => setSyncToQBO(!!checked)} 
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="sync" className="text-xs font-bold uppercase tracking-wider cursor-pointer text-primary">
                  Sincronizar con QuickBooks
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Se creará automáticamente el cliente y la factura en QuickBooks Online.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notas Internas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionales..."
              rows={3}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? 'Guardar Cambios' : 'Crear Factura'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
