'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Download, ExternalLink, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'approved':
      return <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/20 text-[10px] font-black uppercase tracking-widest px-3 py-1">Approved</Badge>;
    case 'invoice':
      return <Badge className="bg-orange-500/10 text-orange-700 hover:bg-orange-500/20 border-orange-500/20 text-[10px] font-black uppercase tracking-widest px-3 py-1">Invoice</Badge>;
    case 'job':
      return <Badge className="bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 border-purple-500/20 text-[10px] font-black uppercase tracking-widest px-3 py-1">In Progress</Badge>;
    case 'paid':
      return <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/20 text-[10px] font-black uppercase tracking-widest px-3 py-1">Paid</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-3 py-1">{status}</Badge>;
  }
}

interface InvoiceCardProps {
  invoice: any;
  currentProformaId: string;
  onViewPDF?: () => void;
}

export default function InvoiceCard({ invoice, currentProformaId, onViewPDF }: InvoiceCardProps) {
  const isCurrent = invoice.proforma_id === currentProformaId;

  return (
    <Card className={cn(
      "group border-border/50 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/20 rounded-2xl",
      isCurrent ? 'ring-2 ring-primary/20 bg-primary/5' : 'bg-white'
    )}>
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center">
          {/* Main Info */}
          <div className="flex-1 p-6 space-y-4 text-left">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <StatusBadge status={invoice.status} />
                {isCurrent && (
                  <Badge variant="outline" className="text-[10px] font-bold bg-primary text-primary-foreground border-none px-2 h-5">Current</Badge>
                )}
              </div>
              <h3 className="text-xl  font-black text-[#0D3B47] group-hover:text-primary transition-colors leading-tight">
                {invoice.proformas?.project_name || 'Project without Name'}
              </h3>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3">
              <div className="flex items-center gap-2">
                <div className="bg-muted/50 p-1.5 rounded-lg border border-border/10">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground/60" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Issue Date</p>
                  <p className="text-sm font-semibold text-[#0D3B47]">
                    {new Date(invoice.issue_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-muted/50 p-1.5 rounded-lg border border-border/10">
                  <Hash className="h-4 w-4 text-muted-foreground/60" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Number</p>
                  <p className="text-sm font-semibold font-mono text-[#0D3B47]">
                    #{invoice.invoice_number}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Amount and Action */}
          <div className="sm:w-64 bg-[#F4F2EC] sm:bg-[#F4F2EC]/50 p-6 flex flex-col items-stretch justify-center gap-3 sm:border-l border-border/30">
            <div className="text-right sm:text-center mb-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">Total Amount</p>
              <p className="text-2xl  font-black text-primary tabular-nums tracking-tighter">
                ${invoice.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="flex flex-col gap-2">

              {onViewPDF && (
                <Button
                  onClick={onViewPDF}
                  variant="outline"
                  className="w-full font-bold text-[10px] uppercase tracking-widest h-9 rounded-xl shadow-sm transition-all active:scale-95 bg-primary/5 hover:bg-primary/10 border-primary/10 text-primary"
                >
                  <Download className="mr-2 h-3.5 w-3.5" />
                  Download PDF
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
