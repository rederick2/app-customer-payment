'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Save, ExternalLink } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { syncInvoiceToQuickBooks } from '@/app/invoices/actions';
import { upsertInvoice, getNextInvoiceNumber, getUnlinkedPayments } from '@/app/proforma/[id]/components/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface InvoiceFormProps {
  clientId: string;
  clientName: string;
  proforma?: any;
  initialData?: any;
  onCancel?: () => void;
}

export function InvoiceForm({ clientId, clientName, proforma, initialData, onCancel }: InvoiceFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [syncToQBO, setSyncToQBO] = React.useState(true);
  const [unlinkedPayments, setUnlinkedPayments] = React.useState<any[]>([]);
  const [selectedPaymentIds, setSelectedPaymentIds] = React.useState<string[]>([]);

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

    if (!initialData) {
      getUnlinkedPayments(clientId).then(setUnlinkedPayments);
    }
  }, [initialData, clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await upsertInvoice({
        ...formData,
        id: initialData?.id,
        proforma_id: proforma?.id || null,
        client_id: clientId
      }, selectedPaymentIds);

      if (result.error) {
        toast.error(result.error);
      } else {
        if (!initialData && syncToQBO && result.data?.id) {
          toast.success('Factura creada. Sincronizando con QuickBooks...');
          const syncRes = await syncInvoiceToQuickBooks(result.data.id);
          if (syncRes.success) {
            toast.success('Sincronización completada');
          } else {
            toast.error('Error en sincronización: ' + syncRes.error);
          }
        } else {
          toast.success(initialData ? 'Factura actualizada' : 'Factura creada');
        }
        
        // Navigate back to client page
        router.push(`/clients/${clientId}?tab=invoices-tab`);
        router.refresh();
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => onCancel ? onCancel() : router.back()} className="rounded-xl">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold font-serif">
            {initialData ? `Editar Factura #${formData.invoice_number}` : 'Nueva Factura'}
          </h1>
          <Badge variant="outline" className="bg-primary/5 text-primary">
            Cliente: {clientName}
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border/40 shadow-none rounded-xl overflow-hidden">
            <CardHeader className="bg-muted/10">
              <CardTitle className="text-lg">Detalles de Facturación</CardTitle>
              <CardDescription>Información básica y fechas.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice_number">Número de Factura</Label>
                  <Input
                    id="invoice_number"
                    value={formData.invoice_number}
                    onChange={e => setFormData({ ...formData, invoice_number: e.target.value })}
                    placeholder="INV-001"
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={val => setFormData({ ...formData, status: val })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
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
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Fecha de Vencimiento (Opcional)</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                    className="rounded-xl"
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
                    className={cn("rounded-xl", !!proforma && "bg-muted cursor-not-allowed")}
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
                    className={cn("rounded-xl", !!proforma && "bg-muted cursor-not-allowed")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount_amount">Descuento ($)</Label>
                  <Input
                    id="discount_amount"
                    type="number"
                    step="0.01"
                    value={formData.discount_amount}
                    onChange={e => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                    readOnly={!!proforma}
                    className={cn("rounded-xl", !!proforma && "bg-muted cursor-not-allowed")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-none rounded-xl overflow-hidden">
            <CardHeader className="bg-muted/10">
              <CardTitle className="text-lg">Notas Internas</CardTitle>
              <CardDescription>Información adicional para uso interno.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales..."
                rows={4}
                className="rounded-xl resize-none"
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {!initialData && (
            <Card className="border-primary/20 shadow-none rounded-xl overflow-hidden bg-primary/5">
              <CardHeader className="pb-3 px-6 pt-6">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">Sincronización</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0">
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="sync" 
                    checked={syncToQBO} 
                    onCheckedChange={(checked) => setSyncToQBO(!!checked)} 
                    className="border-primary data-[state=checked]:bg-primary"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="sync" className="text-xs font-bold cursor-pointer text-primary">
                      QuickBooks Online
                    </Label>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      Crear automáticamente el cliente y la factura en QuickBooks.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!initialData && unlinkedPayments.length > 0 && (
            <Card className="border-border/40 shadow-none rounded-xl overflow-hidden">
              <CardHeader className="bg-muted/10 flex flex-row items-center justify-between py-3 px-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Pagos Pendientes</CardTitle>
                <Badge variant="secondary" className="text-[10px] h-5 rounded-full font-bold">
                  {selectedPaymentIds.length}
                </Badge>
              </CardHeader>
              <CardContent className="p-4">
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {unlinkedPayments.map(p => (
                    <div key={p.id} className="flex items-center space-x-3 p-3 rounded-xl bg-muted/5 border border-border/40 hover:border-primary/20 transition-all group">
                      <Checkbox 
                        id={`p-${p.id}`}
                        checked={selectedPaymentIds.includes(p.id)}
                        onCheckedChange={(checked) => {
                          setSelectedPaymentIds(prev => 
                            checked ? [...prev, p.id] : prev.filter(id => id !== p.id)
                          );
                        }}
                        className="rounded-full"
                      />
                      <label htmlFor={`p-${p.id}`} className="text-xs cursor-pointer flex-1 flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold">${p.amount}</span>
                          <span className="text-[10px] text-muted-foreground font-medium">{new Date(p.payment_date).toLocaleDateString()}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground capitalize opacity-80">{p.payment_method || 'Desconocido'}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {proforma && (
            <Card className="border-emerald-100 shadow-none rounded-xl overflow-hidden bg-emerald-50/30">
              <CardHeader className="py-3 px-4 flex flex-row items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <ExternalLink className="h-3 w-3" />
                </div>
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-700">Proyecto Vinculado</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-1">
                <p className="text-xs font-bold text-emerald-900 line-clamp-1">{proforma.project_name}</p>
                <p className="text-[10px] text-emerald-600 mt-0.5">Los montos de la factura están bloqueados para coincidir con el proyecto.</p>
              </CardContent>
            </Card>
          )}

          <div className="pt-2">
            <Button type="submit" className="w-full h-12 rounded-xl font-bold shadow-md shadow-primary/20" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  {initialData ? 'Actualizar Factura' : 'Finalizar y Crear Factura'}
                </>
              )}
            </Button>
            <p className="text-[11px] text-center text-muted-foreground mt-4 px-4 leading-relaxed">
              Al confirmar, los datos se guardarán localmente. Si la sincronización está activa, se comunicará inmediatamente con QuickBooks Online.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}

