import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import PrintButton from '@/components/PrintButton';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import ProformaDropdownActions from './components/ProformaDropdownActions';
import EmailQuoteModal from './components/EmailQuoteModal';

export const revalidate = 0;

type Props = {
  params: Promise<{ id: string }>
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'approved':
      return <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-500/20 text-sm py-1 px-3">Approved</Badge>;
    case 'rejected':
      return <Badge variant="destructive" className="bg-red-500/10 text-red-700 hover:bg-red-500/20 border-red-500/20 text-sm py-1 px-3">Rejected</Badge>;
    case 'sent':
      return <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-blue-500/20 text-sm py-1 px-3">Sent</Badge>;
    default:
      return <Badge variant="outline" className="text-sm py-1 px-3">Draft</Badge>;
  }
}

export default async function ProformaView({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch proforma and its client
  const { data: proforma, error: proformaError } = await supabase
    .from('proformas')
    .select(`
      *,
      clients (*)
    `)
    .eq('id', id)
    .single();

  if (proformaError || !proforma) {
    notFound();
  }

  // Fetch line items
  const { data: items, error: itemsError } = await supabase
    .from('proforma_items')
    .select('*')
    .eq('proforma_id', id);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-in fade-in duration-500">
      
      {/* Action Bar */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <span className="text-muted-foreground/40">·</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Status:</span>
            <StatusBadge status={proforma.status || 'draft'} />
          </div>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Link
            href={`/proforma/${id}/messages`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border/50 bg-card text-sm font-medium text-foreground hover:border-primary/40 hover:shadow-sm transition-all"
          >
            <MessageSquare className="h-4 w-4 text-primary" />
            View Messages
          </Link>
          <ProformaDropdownActions proformaId={id} currentStatus={proforma.status || 'draft'} />
          <EmailQuoteModal
            proformaId={id}
            clientName={(() => {
              const c = proforma.clients as any;
              return c?.company_name || [c?.first_name, c?.last_name].filter(Boolean).join(' ') || c?.name || 'Client';
            })()}
            clientEmail={(proforma.clients as any)?.email || ''}
            projectName={proforma.project_name}
            total={proforma.total}
          />
        </div>
      </div>


      {/* Printable Document Area */}
      <div className="bg-card print:bg-transparent shadow-xl print:shadow-none border border-border/50 print:border-none p-8 md:p-12 mb-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-border pb-8 mb-8">
          <div>
            <h1 className="font-serif text-4xl font-bold tracking-tight text-[#0D3B47]">EstudioPro</h1>
            <p className="text-sm text-muted-foreground mt-1">Interior Design & Remodeling</p>
          </div>
          <div className="mt-6 sm:mt-0 text-right">
            <h2 className="text-2xl font-bold text-foreground font-serif uppercase tracking-widest text-muted-foreground/40 print:text-muted-foreground/80">Quote</h2>
            <p className="text-sm font-medium mt-2">Nº: <span className="font-mono">{proforma.id.split('-')[0].toUpperCase()}</span></p>
            <p className="text-sm">Date: {new Date(proforma.created_at).toLocaleDateString('en-US')}</p>
            <p className="text-sm">Valid Until: {new Date(proforma.valid_until).toLocaleDateString('en-US')}</p>
          </div>
        </div>

        {/* Client & Project Info */}
        <div className="grid sm:grid-cols-2 gap-8 mb-12">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Prepared For:</h3>
            <p className="font-medium text-lg text-foreground">
              {(() => {
                const c = proforma.clients as any;
                const nameDisplay = [c.title, c.first_name, c.last_name].filter(Boolean).join(' ') || c.name;
                return c.company_name || nameDisplay;
              })()}
            </p>
            {(() => {
              const c = proforma.clients as any;
              const nameDisplay = [c.title, c.first_name, c.last_name].filter(Boolean).join(' ') || c.name;
              if (c.company_name && nameDisplay) {
                return (
                  <p className="text-sm font-medium text-muted-foreground mt-0.5 mb-1">
                    Attn: {nameDisplay}
                  </p>
                );
              }
              return null;
            })()}

            {/* Address block */}
            <div className="text-sm mt-1 space-y-0.5">
              {(() => {
                const c = proforma.clients as any;
                const hasDetailedAddress = c.street_1 || c.city || c.country;
                
                if (hasDetailedAddress) {
                  return (
                    <>
                      {(c.street_1 || c.street_2) && (
                        <p>{[c.street_1, c.street_2].filter(Boolean).join(', ')}</p>
                      )}
                      {(c.city || c.province || c.postal_code) && (
                        <p>{[c.city, c.province, c.postal_code].filter(Boolean).join(', ')}</p>
                      )}
                      {c.country && <p>{c.country}</p>}
                    </>
                  );
                } else if (c.address) {
                  // Fallback to legacy address column just in case
                  return <p>{c.address}</p>;
                }
                return null;
              })()}
            </div>

            <div className="mt-1.5 space-y-0.5">
              {(proforma.clients as any).email && <p className="text-sm text-muted-foreground">{(proforma.clients as any).email}</p>}
              {(proforma.clients as any).phone && <p className="text-sm text-muted-foreground">{(proforma.clients as any).phone}</p>}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Project Details:</h3>
            <p className="font-medium text-lg text-foreground">{proforma.project_name}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-12">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F4F2EC] print:bg-transparent print:border-b-2 print:border-foreground/20 text-[#0D3B47] border-y border-border/50">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider">Description</th>
                <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-right w-24">Qty.</th>
                <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-right w-32">Unit Price</th>
                <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-right w-32">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {items && items.map((item, index) => (
                <tr key={item.id} className="print:break-inside-avoid align-top">
                  <td className="px-4 py-4">
                    <div className="font-medium text-foreground">{item.description}</div>
                    {item.details && (
                      <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{item.details}</div>
                    )}
                    {item.photo_url && (
                      <div className="mt-3 relative w-32 h-32 md:w-48 md:h-48 rounded-md overflow-hidden border border-border/50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.photo_url} alt={item.description} className="object-cover w-full h-full" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">{item.quantity}</td>
                  <td className="px-4 py-4 text-right">${item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-4 text-right font-medium text-foreground">${item.total_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Box */}
        <div className="flex justify-end mb-16 print:break-inside-avoid">
          <div className="w-full sm:w-1/2 p-6 bg-[#F4F2EC] print:bg-transparent print:border print:border-border/50 space-y-3 rounded-lg text-[#0D3B47]">
             <div className="flex justify-between items-center text-sm">
                <span className="font-medium">Subtotal</span>
                <span>${proforma.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm pb-3 border-b border-[#E2E0D8]">
                <span className="font-medium">Tax (16%)</span>
                <span>${proforma.tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-end pt-2">
                <span className="text-lg font-serif font-bold text-[#0D3B47]">Estimated Total</span>
                <span className="text-xl font-bold text-[#306C3E]">${proforma.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="border-t border-border/50 pt-8 mt-auto print:fixed print:bottom-8 print:w-full print:border-t-2">
          <p className="text-xs text-muted-foreground mb-1 text-center font-medium">Terms and Conditions</p>
          <p className="text-xs text-muted-foreground text-center">
             This quote is an initial estimate and is subject to change following final on-site measurements.
             Prices valid until the specified date. A 60% advance payment is required to start the project.
          </p>
        </div>

      </div>

      {/* Messages Link */}
      <div className="mt-4 print:hidden">
        <Link
          href={`/proforma/${id}/messages`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border/50 bg-card text-sm font-medium text-foreground hover:border-primary/40 hover:shadow-sm transition-all group"
        >
          <MessageSquare className="h-4 w-4 text-primary" />
          View Messages
          <span className="ml-auto text-xs text-emerald-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </Link>
      </div>

    </div>
  );
}
