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
  userProfile?: any;
}

import { pdf } from '@react-pdf/renderer';
import InvoicePDF from '@/lib/pdf/InvoicePDF';
import PaymentPDF from '@/lib/pdf/PaymentPDF';
import { PDFPreviewModal } from '@/components/PDFPreviewModal';
import { Eye } from 'lucide-react';

export function InvoicesList({ initialInvoices, userProfile }: InvoicesListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [expandedInvoices, setExpandedInvoices] = React.useState<Record<string, boolean>>({});
  const [previewData, setPreviewData] = React.useState<{ url: string | null; title: string; filename?: string } | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
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

  const handleViewInvoicePDF = async (invoice: any) => {
    try {
      setIsGenerating(true);
      const loadingToast = toast.loading('Generating Invoice PDF...');

      const blob = await pdf(
        <InvoicePDF
          invoice={invoice}
          proforma={invoice.proformas}
          client={invoice.clients}
          user={userProfile}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      setPreviewData({
        url,
        title: `#${invoice.invoice_number}`,
        filename: `Invoice_${invoice.invoice_number}.pdf`
      });

      toast.dismiss(loadingToast);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error generating Invoice PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewPaymentPDF = async (payment: any, invoice: any) => {
    try {
      setIsGenerating(true);
      const loadingToast = toast.loading('Generating Payment Receipt...');

      const blob = await pdf(
        <PaymentPDF
          payment={payment}
          proforma={invoice.proformas}
          client={invoice.clients}
          user={userProfile}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      setPreviewData({
        url,
        title: `Payment Receipt`,
        filename: `Receipt_${payment.id.split('-')[0].toUpperCase()}.pdf`
      });

      toast.dismiss(loadingToast);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error generating Payment Receipt.');
    } finally {
      setIsGenerating(false);
    }
  };

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

      <Card className="shadow-sm border-border/50 overflow-hidden bg-transparent md:bg-card">
        {/* Desktop View */}
        <div className="hidden md:block">
          {filteredInvoices.length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] font-black uppercase tracking-widest bg-muted/50 text-muted-foreground border-b border-border/40">
                <tr>
                  <th scope="col" className="px-6 py-4">Project</th>
                  <th scope="col" className="px-6 py-4">Client</th>
                  <th scope="col" className="px-6 py-4">Date</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Total</th>
                  <th scope="col" className="px-6 py-4 text-right">Action</th>
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
                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
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
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (invoice.qbo_invoice_id) return;
                                const loadingToast = toast.loading('Sincronizando...');
                                const res = await syncInvoiceToQuickBooks(invoice.id);
                                toast.dismiss(loadingToast);
                                if (res.success) toast.success('Sync OK!');
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
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await syncInvoiceStatusFromQuickBooks(invoice.id);
                                  router.refresh();
                                }}
                              >
                                <RotateCw className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-[10px] font-bold uppercase tracking-widest border-primary/20 hover:bg-primary/5 px-4 rounded-lg flex items-center gap-2 transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewInvoicePDF(invoice);
                              }}
                              disabled={isGenerating}
                            >
                              <Eye className="h-3 w-3" />
                              PDF
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
                                  Payment History
                                </h4>
                                <span className="text-[10px] font-bold text-muted-foreground">
                                  {invoice.payments?.length || 0} Payments
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
                                            {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'No date'}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0 rounded-lg text-primary hover:bg-primary/10 transition-all opacity-0 group-hover/pay:opacity-100"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewPaymentPDF(payment, invoice);
                                          }}
                                        >
                                          <Eye className="h-3.5 w-3.5" />
                                        </Button>
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
                                            if (payment.qbo_payment_id) return;
                                            await syncPaymentToQuickBooks(payment.id);
                                          }}
                                        >
                                          <Cloud className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[11px] italic text-muted-foreground py-2">No payments registered.</p>
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
              <p className="text-lg  italic">No invoices found.</p>
            </div>
          )}
        </div>

        {/* Mobile View */}
        <div className="md:hidden">
          {filteredInvoices.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 p-4">
              {paginatedInvoices.map((invoice) => {
                const totalPaid = (invoice.payments as any[])?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
                const percentPaid = Math.min(100, (totalPaid / (invoice.total_amount || 1)) * 100);
                const isExpanded = !!expandedInvoices[invoice.id];

                return (
                  <Card
                    key={invoice.id}
                    className={cn(
                      "overflow-hidden border-border/40 shadow-sm transition-all bg-card/50 backdrop-blur-sm",
                      isExpanded && "ring-1 ring-primary/20 bg-primary/5"
                    )}
                  >
                    <div className="p-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => router.push(`/proforma/${invoice.proforma_id}?view=quote`)}
                        >
                          <h3 className="font-bold text-base leading-tight">{(invoice.proformas as any)?.project_name || 'Sin Proyecto'}</h3>
                          <p className="text-[10px] font-mono text-muted-foreground/60 uppercase mt-1">NRO: {invoice.invoice_number}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            invoice.status === 'sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-muted/50 text-muted-foreground border-border/40'
                          }`}>
                          {invoice.status || 'draft'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border/20">
                        <div>
                          <p className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest">Client</p>
                          <p className="text-xs font-bold truncate">{(invoice.clients as any)?.name || 'Sin Cliente'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest">Total</p>
                          <p className="text-sm font-black text-primary">${invoice.total_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
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

                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewInvoicePDF(invoice);
                            }}
                            disabled={isGenerating}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant={isExpanded ? "secondary" : "ghost"}
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg"
                            onClick={(e) => toggleExpand(invoice.id, e)}
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="bg-muted/30 border-t border-border/20 p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "flex-1 h-9 rounded-xl font-bold text-[10px] uppercase tracking-widest",
                              invoice.qbo_invoice_id ? "bg-emerald-50/50 text-emerald-700" : "bg-background"
                            )}
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (invoice.qbo_invoice_id) return;
                              const loadingToast = toast.loading('Sync...');
                              const res = await syncInvoiceToQuickBooks(invoice.id);
                              toast.dismiss(loadingToast);
                              if (res.success) toast.success('Sync OK!');
                            }}
                          >
                            {invoice.qbo_invoice_id ? 'Synced' : 'QuickBooks'}
                          </Button>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Payments</h4>
                          <div className="space-y-2">
                            {invoice.payments && invoice.payments.length > 0 ? (
                              invoice.payments.map((payment: any) => (
                                <div key={payment.id} className="bg-background p-3 rounded-xl border border-border/40 flex justify-between items-center">
                                  <div>
                                    <p className="text-sm font-bold">${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                    <p className="text-[9px] text-muted-foreground/60 uppercase font-black">{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-'}</p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewPaymentPDF(payment, invoice);
                                    }}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ))
                            ) : (
                              <p className="text-[10px] italic text-muted-foreground text-center py-4 bg-background/50 rounded-xl border border-dashed border-border/20">Sin pagos.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="p-16 text-center text-muted-foreground flex flex-col items-center">
              <FileText className="h-16 w-16 text-muted/20 mb-4" />
              <p className="text-lg  italic">No se encontraron facturas.</p>
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

      <PDFPreviewModal
        isOpen={!!previewData}
        onClose={() => setPreviewData(null)}
        blobUrl={previewData?.url || null}
        title={previewData?.title || ''}
        filename={previewData?.filename}
      />
    </div>
  );
}
