import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { ArrowLeft, Printer, FileDown } from 'lucide-react';
import PrintButton from '@/components/PrintButton';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 0;

type Props = {
  params: Promise<{ id: string }>
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
      
      {/* Non-printable Action Bar */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Link>
        </div>
        <div className="flex gap-2">
          <PrintButton />
        </div>
      </div>

      {/* Printable Document Area */}
      <div className="bg-card print:bg-transparent shadow-xl print:shadow-none border border-border/50 print:border-none p-8 md:p-12 mb-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-border pb-8 mb-8">
          <div>
            <h1 className="font-serif text-4xl font-bold tracking-tight text-primary">EstudioPro</h1>
            <p className="text-sm text-muted-foreground mt-1">Diseño de Interiores & Remodelaciones</p>
          </div>
          <div className="mt-6 sm:mt-0 text-right">
            <h2 className="text-2xl font-bold text-foreground font-serif uppercase tracking-widest text-muted-foreground/40 print:text-muted-foreground/80">Proforma</h2>
            <p className="text-sm font-medium mt-2">Nº: <span className="font-mono">{proforma.id.split('-')[0].toUpperCase()}</span></p>
            <p className="text-sm">Fecha: {new Date(proforma.created_at).toLocaleDateString('es-ES')}</p>
            <p className="text-sm">Válida hasta: {new Date(proforma.valid_until).toLocaleDateString('es-ES')}</p>
          </div>
        </div>

        {/* Client & Project Info */}
        <div className="grid sm:grid-cols-2 gap-8 mb-12">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Preparado Para:</h3>
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
                    Atte: {nameDisplay}
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
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Detalles del Proyecto:</h3>
            <p className="font-medium text-lg text-foreground">{proforma.project_name}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-12">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/30 print:bg-transparent print:border-b-2 print:border-foreground/20 text-muted-foreground border-y border-border/50">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider">Descripción</th>
                <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-right w-24">Cant.</th>
                <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-right w-32">Precio Unit.</th>
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
          <div className="w-full sm:w-1/2 p-6 bg-muted/20 print:bg-transparent print:border print:border-border/50 space-y-3 rounded-lg">
             <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Subtotal</span>
                <span>${proforma.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm pb-3 border-b border-border/50">
                <span className="text-muted-foreground font-medium">IVA (16%)</span>
                <span>${proforma.tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-end pt-2">
                <span className="text-lg font-serif font-bold text-foreground">Total Estimado</span>
                <span className="text-xl font-bold text-primary">${proforma.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="border-t border-border/50 pt-8 mt-auto print:fixed print:bottom-8 print:w-full print:border-t-2">
          <p className="text-xs text-muted-foreground mb-1 text-center font-medium">Términos y Condiciones</p>
          <p className="text-xs text-muted-foreground text-center">
             Esta proforma representa un estimado inicial y está sujeta a cambios tras la medición final en sitio. 
             Precios válidos hasta la fecha indicada. Para iniciar el proyecto se requiere un anticipo del 60%.
          </p>
        </div>

      </div>
    </div>
  );
}
