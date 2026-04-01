'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { FileText, Search, ChevronLeft, ChevronRight, RotateCw, Cloud, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { syncInvoiceToQuickBooks, syncPaymentToQuickBooks, syncInvoiceStatusFromQuickBooks } from '../actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { ChevronDown, ChevronUp, CreditCard, DollarSign, Info, Percent, Tag } from 'lucide-react';

interface InvoicesListProps {
  initialInvoices: any[];
}

export function InvoicesList({ initialInvoices }: InvoicesListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [expandedInvoices, setExpandedInvoices] = React.useState<Record<string, boolean>>({});
  const itemsPerPage = 10;

  // Realtime subscription
  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('invoices-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices' },
        () => {
          router.refresh();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedInvoices(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtering
  const filteredInvoices = initialInvoices.filter(i => 
    (i.proformas as any)?.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.clients as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page on search
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 max-w-md w-full ml-auto">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Buscar por proyecto o cliente..." 
            className="pl-10 h-10 border-border/40 bg-card/50 backdrop-blur-sm focus-visible:ring-primary/20 transition-all rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="shadow-sm border-border/50 overflow-hidden bg-card/50 backdrop-blur-sm">
        <div className="overflow-x-auto">
          {filteredInvoices.length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] font-black uppercase tracking-widest bg-muted/50 text-muted-foreground border-b border-border/40">
                <tr>
                  <th scope="col" className="px-6 py-4">Proyecto</th>
                  <th scope="col" className="px-6 py-4">Cliente</th>
                  <th scope="col" className="px-6 py-4">Fecha</th>
                  <th scope="col" className="px-6 py-4">Estado</th>
                  <th scope="col" className="px-6 py-4 text-right">Total</th>
                  <th scope="col" className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {paginatedInvoices.map((invoice) => {
                  const totalPaid = (invoice.payments as any[])?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
                  const percentPaid = Math.min(100, (totalPaid / (invoice.total_amount || 1)) * 100);
                  const isExpanded = !!expandedInvoices[invoice.id];

                  return (
                    <React.Fragment key={invoice.id}>
                      <tr 
                        className={cn(
                          "group hover:bg-muted/50 transition-colors cursor-pointer border-l-4",
                          invoice.status === 'paid' ? "border-l-emerald-500" : 
                          totalPaid > 0 ? "border-l-blue-500" : "border-l-transparent"
                        )}
                        onClick={() => router.push(`/proforma/${invoice.proforma_id}?view=quote`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 rounded-md hover:bg-primary/10"
                              onClick={(e) => toggleExpand(invoice.id, e)}
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                            <div>
                              <p className="font-bold text-foreground">{(invoice.proformas as any)?.project_name || 'Sin Proyecto'}</p>
                              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase">NRO: {invoice.invoice_number}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">{(invoice.clients as any)?.name || 'Sin Cliente'}</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {new Date(invoice.issue_date || invoice.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1.5">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                              invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              invoice.status === 'sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-muted/50 text-muted-foreground border-border/40'
                            }`}>
                              {invoice.status || 'draft'}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={cn(
                                    "h-full transition-all duration-500",
                                    percentPaid === 100 ? "bg-emerald-500" : "bg-blue-500"
                                  )}
                                  style={{ width: `${percentPaid}%` }}
                                />
                              </div>
                              <span className="text-[9px] font-bold text-muted-foreground">{percentPaid.toFixed(0)}%</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="font-bold tabular-nums text-primary">
                            ${invoice.total_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                          {(invoice.tax_amount > 0 || invoice.discount_amount > 0) && (
                            <div className="flex flex-col items-end gap-0.5 mt-0.5">
                              {invoice.tax_amount > 0 && (
                                <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                                  <Percent className="h-2.5 w-2.5" /> Tax: ${invoice.tax_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </p>
                              )}
                              {invoice.discount_amount > 0 && (
                                <p className="text-[9px] text-rose-500/80 flex items-center gap-1">
                                  <Tag className="h-2.5 w-2.5" /> Desc: -${invoice.discount_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </p>
                              )}
                            </div>
                          )}
                          {totalPaid > 0 && (
                            <p className="text-[10px] text-emerald-600 font-medium mt-1">
                              Pagado: ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={cn(
                                "h-8 px-2 rounded-lg transition-all",
                                invoice.qbo_invoice_id 
                                  ? "text-emerald-600 hover:bg-emerald-50 bg-emerald-50/50" 
                                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                              )}
                              title={invoice.qbo_invoice_id ? "Sincronizado con QuickBooks" : "Sincronizar a QuickBooks"}
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (invoice.qbo_invoice_id) {
                                  toast.info('Esta factura ya ha sido sincronizada.');
                                  return;
                                }
                                const loadingToast = toast.loading('Sincronizando con QuickBooks...');
                                const res = await syncInvoiceToQuickBooks(invoice.id);
                                toast.dismiss(loadingToast);
                                if (res.success) {
                                  toast.success('Factura sincronizada con éxito!');
                                } else {
                                  toast.error(res.error || 'Fallo en la sincronización');
                                }
                              }}
                            >
                              {invoice.qbo_invoice_id ? (
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span className="text-[10px] font-bold uppercase tracking-wider">Sync OK</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Cloud className="h-3.5 w-3.5" />
                                  <span className="text-[10px] font-bold uppercase tracking-wider">QuickBooks</span>
                                </div>
                              )}
                            </Button>
                            {invoice.qbo_invoice_id && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                title="Actualizar estado desde QuickBooks"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const loadingToast = toast.loading('Consultando estado en QuickBooks...');
                                  const res = await syncInvoiceStatusFromQuickBooks(invoice.id);
                                  toast.dismiss(loadingToast);
                                  if (res.success) {
                                    toast.success(`Estado actualizado: ${res.status}`);
                                    router.refresh();
                                  } else {
                                    toast.error(res.error || 'Error al consultar estado');
                                  }
                                }}
                              >
                                <RotateCw className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 text-xs font-bold border-primary/20 hover:bg-primary/5 px-4 rounded-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/proforma/${invoice.proforma_id}?view=quote`);
                              }}
                            >
                              Ver Detalle
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-muted/20 animate-in slide-in-from-top-2 duration-200">
                          <td colSpan={6} className="px-12 py-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                  <CreditCard className="h-3 w-3" />
                                  Desglose de Pagos
                                </h4>
                                <span className="text-[10px] font-bold text-muted-foreground">
                                  {invoice.payments?.length || 0} Pagos registrados
                                </span>
                              </div>
                              
                              {invoice.payments && invoice.payments.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {invoice.payments.map((payment: any) => (
                                    <div key={payment.id} className="flex items-center justify-between p-3 bg-card border border-border/40 rounded-xl shadow-sm group/pay">
                                      <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                          <DollarSign className="h-4 w-4" />
                                        </div>
                                        <div>
                                          <p className="text-sm font-bold">${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                          <p className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter">
                                            {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin fecha'}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                          "h-7 px-2 rounded-lg transition-all",
                                          payment.qbo_payment_id 
                                            ? "text-emerald-600 bg-emerald-50/50" 
                                            : "opacity-0 group-hover/pay:opacity-100 text-muted-foreground hover:text-primary hover:bg-primary/5"
                                        )}
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          if (payment.qbo_payment_id) {
                                            toast.info('Este pago ya ha sido sincronizado.');
                                            return;
                                          }
                                          if (!invoice.qbo_invoice_id) {
                                            toast.error('Primero sincroniza la factura a QuickBooks.');
                                            return;
                                          }
                                          const loadingToast = toast.loading('Sincronizando pago...');
                                          const res = await syncPaymentToQuickBooks(payment.id);
                                          toast.dismiss(loadingToast);
                                          if (res.success) {
                                            toast.success('Pago sincronizado!');
                                          } else {
                                            toast.error(res.error || 'Fallo al sincronizar pago');
                                          }
                                        }}
                                      >
                                        {payment.qbo_payment_id ? (
                                          <div className="flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" />
                                            <span className="text-[9px] font-bold uppercase">Sync</span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1">
                                            <Cloud className="h-3 w-3" />
                                            <span className="text-[9px] font-bold uppercase">Sync</span>
                                          </div>
                                        )}
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[11px] italic text-muted-foreground py-2">No hay pagos registrados para esta factura.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-16 text-center text-muted-foreground flex flex-col items-center">
              <FileText className="h-16 w-16 text-muted/20 mb-4" />
              <p className="text-lg font-serif italic">No se encontraron invoices.</p>
              {searchTerm && (
                <Button 
                  variant="link" 
                  className="mt-2 text-primary" 
                  onClick={() => setSearchTerm('')}
                >
                  Limpiar búsqueda
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border/30 flex items-center justify-between bg-muted/20">
            <div className="text-xs text-muted-foreground font-medium">
              Mostrando <span className="text-foreground">{Math.min(filteredInvoices.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredInvoices.length, currentPage * itemsPerPage)}</span> de <span className="text-foreground">{filteredInvoices.length}</span> invoices
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-border/40"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1 mx-2">
                {(() => {
                  const pages = [];
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    if (currentPage <= 4) {
                      pages.push(1, 2, 3, 4, 5, '...', totalPages);
                    } else if (currentPage >= totalPages - 3) {
                      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                    } else {
                      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                    }
                  }
                  
                  return pages.map((page, index) => {
                    if (page === '...') {
                      return (
                        <span key={`ellipsis-${index}`} className="px-1 text-muted-foreground/50 font-bold select-none cursor-default">
                          ...
                        </span>
                      );
                    }
                    return (
                      <Button
                        key={`page-${page}`}
                        variant={currentPage === page ? "default" : "ghost"}
                        size="sm"
                        className={`h-8 w-8 rounded-lg p-0 text-xs font-bold ${currentPage === page ? 'bg-primary text-primary-foreground' : ''}`}
                        onClick={() => setCurrentPage(page as number)}
                      >
                        {page}
                      </Button>
                    );
                  });
                })()}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-border/40"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
