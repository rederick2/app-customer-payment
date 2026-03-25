import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createAdminClient } from '@/lib/supabase/admin';
import { Printer } from 'lucide-react';
import PrintButton from '@/components/PrintButton';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import PublicProformaActions from './components/PublicProformaActions';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ZoomIn } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { LineItemImage } from '@/components/LineItemImage';

export const revalidate = 0;

type Props = {
  params: Promise<{ id: string }>
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'approved':
      return <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-500/20 text-sm py-1 px-3">Aprobada</Badge>;
    case 'rejected':
      return <Badge variant="destructive" className="bg-red-500/10 text-red-700 hover:bg-red-500/20 border-red-500/20 text-sm py-1 px-3">Rechazada</Badge>;
    case 'sent':
      return <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-blue-500/20 text-sm py-1 px-3">Enviada</Badge>;
    default:
      return <Badge variant="outline" className="text-sm py-1 px-3">Borrador</Badge>;
  }
}

export default async function PublicProformaView({ params }: Props) {
  const { id } = await params;

  // Use admin client because the user is not authenticated on this public link
  const supabase = createAdminClient();

  // Fetch proforma and its client
  const { data: proforma, error: proformaError } = await supabase
    .from('proformas')
    .select(`
      *,
      clients (*),
      applied_taxes:users (taxes (*))
    `)
    .eq('id', id)
    .single();

  if (proformaError || !proforma) {
    console.error("Proforma error:", proformaError);
    notFound();
  }

  // Fetch line items
  const { data: items, error: itemsError } = await supabase
    .from('proforma_items')
    .select('*')
    .eq('proforma_id', id)
    .order('sort_order', { ascending: true });

  // Fetch task media for Work Progress gallery
  const { data: taskMediaRows } = await supabase
    .from('task_media')
    .select('*, job_tasks(title)')
    .eq('proforma_id', id)
    .order('created_at', { ascending: true });

  // Group media by task
  const mediaByTask: Record<string, { taskTitle: string; items: any[] }> = {};
  for (const row of taskMediaRows || []) {
    const taskTitle = row.job_tasks?.title || 'Task';
    if (!mediaByTask[row.task_id]) {
      mediaByTask[row.task_id] = { taskTitle, items: [] };
    }
    mediaByTask[row.task_id].items.push(row);
  }

  return (
    <div className="px-6 py-8 md:p-12 max-w-5xl mx-auto animate-in fade-in duration-500">

      {/* Action Bar */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-medium text-muted-foreground mr-2">Estado:</h2>
          <StatusBadge status={proforma.status || 'draft'} />
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <PublicProformaActions proformaId={proforma.id} status={proforma.status || 'draft'} />
          <PrintButton proforma={proforma} items={items || []} />
        </div>
      </div>

      {/* Printable Document Area */}
      <div className="bg-card print:bg-transparent shadow-xl print:shadow-none border border-border/50 print:border-none p-8 md:p-12 mb-8 relative overflow-hidden">

        {/* Invalid watermark if rejected */}
        {proforma.status === 'rejected' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 rotate-[-30deg] z-10">
            <span className="text-9xl font-bold font-serif uppercase tracking-widest text-red-500">Rechazada</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-border pb-8 mb-8 relative z-20">
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
        <div className="grid sm:grid-cols-2 gap-8 mb-12 relative z-20">
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
        <div className="mb-12 relative z-20">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/30 print:bg-transparent print:border-b-2 print:border-foreground/20 text-muted-foreground border-y border-border/50">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider w-10 text-center">Opcional</th>
                <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider">Concepto</th>
                <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-center w-24">Imagen</th>
                <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-right w-24">Cant.</th>
                <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-right w-32">Precio Unit.</th>
                <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-right w-32">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {items && items.map((item, index) => (
                <tr key={item.id} className={cn("print:break-inside-avoid align-top", item.is_optional && "opacity-60 bg-muted/5")}>
                  <td className="px-4 py-5 text-center">
                    {item.is_optional ? (
                      <Checkbox checked={!item.is_excluded} className="opacity-100 cursor-default" />
                    ) : (
                      <span className="text-muted-foreground/20 text-[10px] font-black uppercase tracking-widest">Fijo</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-bold text-foreground text-md">{item.description}</div>
                    {item.details && (
                      <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">{item.details}</div>
                    )}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Box */}
        <div className="flex justify-end mb-16 print:break-inside-avoid relative z-20">
          <div className="w-full sm:w-1/2 p-6 bg-muted/20 print:bg-transparent print:border print:border-border/50 space-y-3 rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-medium">Subtotal</span>
              <span>${proforma.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>

            {/* Dynamic Taxes */}
            {Array.isArray(proforma.applied_taxes?.taxes) && proforma.applied_taxes.taxes.length > 0 ? (
              proforma.applied_taxes.taxes.map((tax: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">{tax.name} ({tax.percentage}%)</span>
                  <span>${((tax.percentage * proforma.subtotal) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              ))
            ) : (
              <div className="flex justify-between items-center text-sm pb-3 border-b border-border/50">
                <span className="text-muted-foreground font-medium">IVA (16%)</span>
                <span>${proforma.tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            <div className="flex justify-between items-end pt-2 border-t border-border/50">
              <span className="text-lg font-serif font-bold text-foreground">Total Estimado</span>
              <span className="text-xl font-bold text-primary">${proforma.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="border-t border-border/50 pt-8 mt-auto print:fixed print:bottom-8 print:w-full print:border-t-2 relative z-20">
          <p className="text-xs text-muted-foreground mb-1 text-center font-medium">Términos y Condiciones</p>
          <p className="text-xs text-muted-foreground text-center">
            Esta proforma representa un estimado inicial y está sujeta a cambios tras la medición final en sitio.
            Precios válidos hasta la fecha indicada. Para iniciar el proyecto se requiere un anticipo del 60%.
          </p>
        </div>

        {/* Work Progress Gallery */}
        {Object.keys(mediaByTask).length > 0 && (
          <div className="mt-8 border-t border-border/50 pt-8 relative z-20 print:hidden">
            <h2 className="text-xl font-serif font-bold text-foreground mb-1">Work Progress</h2>
            <p className="text-sm text-muted-foreground mb-6">Photos and videos from completed tasks</p>
            <div className="space-y-8">
              {Object.values(mediaByTask).map((group) => (
                <div key={group.taskTitle}>
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                    {group.taskTitle}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {group.items.map((m: any) => (
                      <a
                        key={m.id}
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group relative aspect-square rounded-xl overflow-hidden border border-border/50 bg-muted/10 hover:shadow-md transition-all"
                      >
                        {m.type === 'video' ? (
                          <>
                            <video
                              src={m.url}
                              className="w-full h-full object-cover"
                              muted
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </>
                        ) : (
                          <img
                            src={m.url}
                            alt={m.caption || group.taskTitle}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                        {m.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                            <p className="text-white text-[10px] truncate">{m.caption}</p>
                          </div>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
