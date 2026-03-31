import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createAdminClient } from '@/lib/supabase/admin';
import { Mail, Phone, Printer } from 'lucide-react';
import PrintButton from '@/components/PrintButton';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import PublicProformaActions from './components/PublicProformaActions';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ZoomIn } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { LineItemImage } from '@/components/LineItemImage';
import { ExpandableText } from '@/components/ExpandableText';
import { ViewTracker } from './components/ViewTracker';
import PublicWorkProgress from './components/PublicWorkProgress';

export const revalidate = 0;

type Props = {
  params: Promise<{ id: string }>,
  searchParams: Promise<{ type?: string }>
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'approved':
      return <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-500/20 text-sm py-1 px-3">Approved</Badge>;
    case 'rejected':
      return <Badge variant="destructive" className="bg-red-500/10 text-red-700 hover:bg-red-500/20 border-red-500/20 text-sm py-1 px-3">Rejected</Badge>;
    case 'sent':
      return <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-blue-500/20 text-sm py-1 px-3">Sent</Badge>;
    case 'paid':
      return <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/20 text-sm py-1 px-3">Paid</Badge>;
    case 'invoice':
      return <Badge className="bg-orange-500/10 text-orange-700 hover:bg-orange-500/20 border-orange-500/20 text-sm py-1 px-3">Invoice</Badge>;
    default:
      return <Badge variant="outline" className="text-sm py-1 px-3">Draft</Badge>;
  }
}

export default async function PublicProformaView({ params, searchParams }: Props) {
  const { id } = await params;
  const { type } = await searchParams;

  // Use admin client because the user is not authenticated on this public link
  const supabase = createAdminClient();

  // Fetch proforma and its client, and check for associated invoice
  const { data: proforma, error: proformaError } = await supabase
    .from('proformas')
    .select(`
      *,
      clients (*),
      applied_taxes:users (taxes (*)),
      users (display_name, terms_conditions, logo_url, business_license, address, phone, email),
      invoices (*)
    `)
    .eq('id', id)
    .single();

  if (proformaError || !proforma) {
    console.error("Proforma error:", proformaError);
    notFound();
  }

  // Normalize joined data
  const userData = (Array.isArray(proforma.users) ? proforma.users[0] : proforma.users) as any;
  const clientData = (Array.isArray(proforma.clients) ? proforma.clients[0] : proforma.clients) as any;

  // Determine if we should show this as an invoice
  // We show as invoice if type=invoice is passed AND an invoice exists, 
  // or if the proforma status is 'invoice' (legacy)
  const associatedInvoice = proforma.invoices && proforma.invoices.length > 0
    ? proforma.invoices[0]
    : null;

  const isInvoiceView = type === 'invoice' && associatedInvoice;
  const displayStatus = isInvoiceView ? associatedInvoice.status : (proforma.status || 'draft');
  const displayTitle = isInvoiceView ? 'Invoice' : 'Quote';
  const displayNumber = isInvoiceView ? associatedInvoice.invoice_number : String(proforma.number || proforma.id.split('-')[0]).toUpperCase();
  const displayDate = isInvoiceView ? associatedInvoice.issue_date : proforma.created_at;

  // Fetch line items
  const { data: items, error: itemsError } = await supabase
    .from('proforma_items')
    .select('*')
    .eq('proforma_id', id)
    .order('sort_order', { ascending: true });

  return (
    <div className="px-6 py-8 md:p-12 max-w-5xl mx-auto animate-in fade-in duration-500">
      <ViewTracker proformaId={proforma.id} />

      {/* Action Bar */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-muted-foreground tracking-wide">
            Status
          </span>
          <StatusBadge status={displayStatus} />
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <PublicProformaActions proformaId={proforma.id} status={displayStatus} />
          <PrintButton proforma={proforma} items={items || []} />
        </div>
      </div>

      {/* Printable Document Area */}
      <div className="bg-card print:bg-transparent shadow-xl print:shadow-none border border-border/50 print:border-none p-8 md:p-12 mb-8 relative overflow-hidden">

        {/* Invalid watermark if rejected */}
        {proforma.status === 'rejected' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 rotate-[-30deg] z-10">
            <span className="text-9xl font-bold font-serif uppercase tracking-widest text-red-500">Rejected</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-border pb-8 mb-8 relative z-20">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight uppercase text-primary">{userData?.display_name}</h1>
            {userData?.business_license && (
              <p className="text-sm font-medium mt-0.5 mb-1">
                {userData.business_license}
              </p>
            )}
            {userData?.address && (
              <p className="text-sm font-medium mt-0.5 mb-1">
                {userData.address}
              </p>
            )}
            {userData?.phone && (
              <p className="text-sm font-medium mt-0.5 mb-1">
                {userData.phone}
              </p>
            )}
            {userData?.email && (
              <p className="text-sm font-medium mt-0.5 mb-1">
                {userData.email}
              </p>
            )}
          </div>
          <div className="mt-6 sm:mt-0 text-right">
            <h2 className="text-2xl font-bold text-foreground font-serif uppercase tracking-widest text-muted-foreground/40 print:text-muted-foreground/80">{displayTitle}</h2>
            <p className="text-sm font-medium mt-2">Nº: <span className="font-mono">{displayNumber}</span></p>
            <p className="text-sm">Date: {new Date(displayDate).toLocaleDateString('en-US')}</p>
          </div>
        </div>

        {/* Client & Project Info */}
        <div className="grid sm:grid-cols-2 gap-8 mb-12 relative z-20">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Prepared For:</h3>
            <p className="font-medium text-lg text-foreground">
              {(() => {
                const c = clientData;
                const nameDisplay = [c.title, c.first_name, c.last_name].filter(Boolean).join(' ') || c.name;
                return c.company_name || nameDisplay;
              })()}
            </p>
            {(() => {
              const c = clientData;
              const nameDisplay = [c.title, c.first_name, c.last_name].filter(Boolean).join(' ') || c.name;
              if (c.company_name && nameDisplay) {
                return (
                  <p className="text-sm font-medium text-muted-foreground mt-0.5 mb-1">
                    {nameDisplay}
                  </p>
                );
              }
              return null;
            })()}

            {/* Address block */}
            <div className="text-sm mt-1 space-y-0.5">
              {(() => {
                const c = clientData;
                const hasDetailedAddress = c.street_1 || c.city;

                if (hasDetailedAddress) {
                  return (
                    <>
                      {(c.street_1 || c.street_2) && (
                        <p>{[c.street_1, c.street_2].filter(Boolean).join(', ')}</p>
                      )}
                      {(c.city || c.province || c.postal_code) && (
                        <p>{[c.city, c.province, c.postal_code].filter(Boolean).join(', ')}</p>
                      )}
                    </>
                  );
                } else if (c.address) {
                  return <p>{c.address}</p>;
                }
                return null;
              })()}
            </div>

            <div className="mt-1.5 space-y-0.5">
              {clientData?.email && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="w-4 h-4 text-green-500" />{clientData.email}</p>}
              {clientData?.phone && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="w-4 h-4 text-green-500" />{clientData.phone}</p>}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Project Details:</h3>
            <p className="font-medium text-lg text-foreground">{proforma.project_name}</p>
          </div>
        </div>
        {/* Items View - Desktop (Table) */}
        <div className="mb-12 relative z-20 hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/30 print:bg-transparent print:border-b-2 print:border-foreground/20 text-muted-foreground border-y border-border/50">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider w-12 text-center text-[10px]">Incl.</th>
                <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider min-w-[250px] text-[10px]">Product/Service</th>
                <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-center w-24 text-[10px]">Media</th>
                <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-right w-20 text-[10px]">Qty</th>
                <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-right w-28 text-[10px]">Rate</th>
                <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-right w-28 text-[10px]">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {items && items.flatMap((item, index) => [
                <tr key={item.id} className={cn("print:break-inside-avoid align-top border-t border-border/10", item.is_optional && "bg-muted/5", item.is_excluded && "opacity-60")}>
                  <td className="px-4 py-5 text-center">
                    {item.is_optional ? (
                      <Checkbox checked={!item.is_excluded} className="opacity-100 cursor-default" />
                    ) : (
                      <span className="text-muted-foreground/20 text-[10px] font-black uppercase tracking-widest">Fixed</span>
                    )}
                  </td>
                  <td className="px-4 py-5">
                    <div className="font-bold text-foreground text-md tracking-tight break-words">{item.description}</div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {item.photo_url ? (
                      <LineItemImage
                        src={item.photo_url}
                        alt={item.description}
                        className="h-14 w-14 mx-auto"
                      />
                    ) : (
                      <div className="h-14 w-14 mx-auto bg-muted/10 rounded-lg border border-dashed border-border/50 flex items-center justify-center text-muted-foreground/30">
                        <ZoomIn className="h-4 w-4" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">{item.quantity}</td>
                  <td className="px-4 py-4 text-right">${item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className={cn(
                    "px-4 py-4 text-right font-semibold",
                    item.is_excluded ? "text-muted-foreground line-through italic" : "text-foreground"
                  )}>
                    ${item.total_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>,
                item.details && (
                  <tr key={`${item.id}-details`} className={cn("print:break-inside-avoid", item.is_excluded && "opacity-60")}>
                    <td />
                    <td colSpan={5} className="px-4 pb-6 pt-0">
                      <ExpandableText
                        text={item.details}
                        initialLines={3}
                        className="text-muted-foreground max-w-4xl"
                      />
                    </td>
                  </tr>
                )
              ])}
            </tbody>
          </table>
        </div>

        {/* Items View - Mobile (Cards) */}
        <div className="mb-12 space-y-4 md:hidden relative z-20">
          <div className="border-b border-border/50 pb-2 mb-4">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Items & Scope</h3>
          </div>
          {items && items.map((item) => (
            <div key={item.id} className={cn(
              "p-4 rounded-2xl border transition-all bg-card",
              item.is_optional ? "border-primary/20 shadow-sm" : "border-border/40",
              item.is_excluded && "opacity-60 grayscale-[0.5]"
            )}>
              {/* Header: Incl. status and Total */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  {item.is_optional ? (
                    <div className="flex items-center gap-2">
                       <Checkbox checked={!item.is_excluded} className="h-5 w-5" />
                       <span className="text-[10px] font-black uppercase tracking-tighter text-primary">Optional</span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 bg-muted/10 px-2 py-1 rounded-md">Fixed</span>
                  )}
                </div>
                <div className={cn(
                  "font-mono font-bold text-lg",
                  item.is_excluded ? "text-muted-foreground line-through italic" : "text-foreground"
                )}>
                  ${item.total_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Main Info: Image + Title */}
              <div className="flex gap-4 items-start mb-4">
                {item.photo_url ? (
                  <LineItemImage
                    src={item.photo_url}
                    alt={item.description}
                    className="h-16 w-16 flex-shrink-0"
                  />
                ) : (
                  <div className="h-16 w-16 flex-shrink-0 bg-muted/10 rounded-xl border border-dashed border-border/50 flex items-center justify-center text-muted-foreground/20">
                    <ZoomIn className="h-4 w-4" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                   <h4 className="font-bold text-foreground text-base leading-tight tracking-tight break-words">{item.description}</h4>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 py-3 border-y border-border/10 mb-4 bg-muted/5 rounded-lg px-3">
                 <div>
                    <p className="text-[8px] font-black text-muted-foreground uppercase mb-0.5">Quantity</p>
                    <p className="font-mono text-sm font-bold">{item.quantity}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[8px] font-black text-muted-foreground uppercase mb-0.5">Rate</p>
                    <p className="font-mono text-sm font-bold">${item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                 </div>
              </div>

              {/* Details */}
              {item.details && (
                <div className="mt-2">
                   <ExpandableText
                    text={item.details}
                    initialLines={2}
                    className="text-sm text-muted-foreground"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Work Progress Photos (Public Only) */}
        <PublicWorkProgress proformaId={proforma.id} />

        {/* Notes Section */}
        {proforma.notes && (
          <div className="mb-12 p-6 bg-amber-50/20 border border-amber-200/30 rounded-2xl relative z-20">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#0D3B47]/60 mb-3">Notes & Special Conditions</h3>
            <p className="text-sm text-[#0D3B47] leading-relaxed italic whitespace-pre-wrap">{proforma.notes}</p>
          </div>
        )}

        {/* Totals Box */}
        <div className="flex justify-end mb-20 print:break-inside-avoid relative z-10">
          <div className="w-full sm:w-1/2 p-8 bg-[#F4F2EC] print:bg-transparent print:border print:border-border/50 rounded-2xl border border-primary/5 space-y-4 text-[#0D3B47] shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium tracking-wide uppercase opacity-70">Subtotal</span>
              <span className="font-mono font-bold">${proforma.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="space-y-3 py-2">
              {(() => {
                const adjustments = (proforma.adjustments || []) as any[];
                if (adjustments.length > 0) {
                  const subtotal = proforma.subtotal;
                  const discountAdjustments = adjustments.filter(a => a.type === 'discount');
                  const taxAdjustments = adjustments.filter(a => a.type === 'tax');

                  const totalDiscount = discountAdjustments.reduce((acc, adj) => {
                    return acc + (adj.valueType === 'percentage' ? (subtotal * adj.value) / 100 : adj.value);
                  }, 0);

                  const taxableAmount = subtotal - totalDiscount;

                  return adjustments.map((adj, idx) => {
                    const amount = adj.type === 'discount'
                      ? (adj.valueType === 'percentage' ? (subtotal * adj.value) / 100 : adj.value)
                      : (adj.valueType === 'percentage' ? (taxableAmount * adj.value) / 100 : adj.value);

                    return (
                      <div key={idx} className="flex justify-between items-center text-sm opacity-80 group/adj">
                        <span className="font-medium">
                          {adj.label}
                          {adj.valueType === 'percentage' && (
                            <span className="text-[10px] ml-1 bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">{adj.value}%</span>
                          )}
                        </span>
                        <span className={cn("font-mono font-bold", adj.type === 'discount' ? "text-red-600" : "")}>
                          {adj.type === 'discount' ? '-' : '+'}${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    );
                  });
                } else if (Array.isArray(proforma.applied_taxes?.taxes) && proforma.applied_taxes.taxes.length > 0) {
                  return proforma.applied_taxes.taxes.map((tax: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm opacity-80">
                      <span className="font-medium">{tax.name} <span className="text-[10px] ml-1 bg-primary/10 text-primary px-1.5 rounded">{tax.percentage}%</span></span>
                      <span className="font-mono">${((tax.percentage * proforma.subtotal) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ));
                } else {
                  return (
                    <div className="flex justify-between items-center text-sm opacity-80">
                      <span className="font-medium">Tax (0%)</span>
                      <span className="font-mono">${proforma.tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  );
                }
              })()}
            </div>

            {((proforma as any).deposit_amount > 0 || (proforma as any).required_deposit > 0) && (
              <div className="pt-4 border-t border-dashed border-[#0D3B47]/20 mt-2 space-y-2">
                {(proforma as any).required_deposit > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Required Deposit</span>
                    <span className="font-mono font-bold text-primary text-lg">
                      ${(proforma as any).required_deposit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {(proforma as any).deposit_amount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#306C3E]">Amount Collected</span>
                    <span className="font-mono font-bold text-[#306C3E] text-lg">
                      ${(proforma as any).deposit_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {(proforma as any).payment_terms && (
                  <p className="text-[10px] text-muted-foreground/80 mt-1 text-right italic leading-snug">
                    {(proforma as any).payment_terms}
                  </p>
                )}
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium tracking-wide uppercase opacity-70">Total</span>
              <span className="font-mono font-bold">${proforma.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Signature Section */}
        {proforma.status === 'approved' && proforma.approved_at && (
          <div className="mt-12 pt-8 border-t border-border/50 relative z-20 print:break-inside-avoid">
            <div className="flex flex-col items-center sm:items-start">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                Accepted & Signed By
              </h3>
              <div className="flex flex-col items-center sm:items-start gap-4">
                {proforma.client_signature_data ? (
                  <div className="bg-white p-4 rounded-xl border border-border/40 shadow-sm transition-all hover:shadow-md max-w-[320px]">
                    <img
                      src={proforma.client_signature_data}
                      alt="Customer Signature"
                      className="h-24 w-auto object-contain mix-blend-multiply"
                    />
                  </div>
                ) : proforma.client_signed_name ? (
                  <div className="px-6 py-4 bg-primary/5 rounded-xl border-b-2 border-primary/20">
                    <p className="font-serif text-3xl italic text-foreground tracking-tight">
                      {proforma.client_signed_name}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic bg-muted/20 px-4 py-2 rounded-lg">
                    Approved (Digitally Verified)
                  </p>
                )}

                <div className="mt-2 text-center sm:text-left space-y-1">
                  <p className="text-sm font-bold text-foreground">
                    {(() => {
                      const c = clientData;
                      const nameDisplay = [c.title, c.first_name, c.last_name].filter(Boolean).join(' ') || c.name;
                      return c.company_name || nameDisplay;
                    })()}
                  </p>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest bg-muted/30 px-2 py-1 rounded inline-block">
                    Signed on: {new Date(proforma.approved_at).toLocaleDateString('en-US', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Notes */}
        <div className="border-t border-border/50 pt-8 mt-auto print:fixed print:bottom-8 print:w-full print:border-t-2 relative z-20">
          <p className="text-xs text-muted-foreground mb-1 text-center font-medium">Terms and Conditions</p>
          <div className="text-xs text-muted-foreground text-center whitespace-pre-wrap">
            {userData?.terms_conditions || (
              <>
                This quote represents an initial estimate and is subject to change after final measurement on site.{"\n"}
                This quote is valid for the next 30 days, after which values may be subject to change.
              </>
            )}
          </div>
        </div>


      </div>
    </div>
  );
}
