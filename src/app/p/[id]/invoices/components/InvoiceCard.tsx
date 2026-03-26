'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, DollarSign, ExternalLink, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'approved':
      return <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/20 text-[10px] font-black uppercase tracking-widest px-3 py-1">Approved</Badge>;
    case 'invoice':
      return <Badge className="bg-orange-500/10 text-orange-700 hover:bg-orange-500/20 border-orange-500/20 text-[10px] font-black uppercase tracking-widest px-3 py-1">Invoice</Badge>;
    case 'job':
      return <Badge className="bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 border-purple-500/20 text-[10px] font-black uppercase tracking-widest px-3 py-1">In Progress</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-3 py-1">{status}</Badge>;
  }
}

interface InvoiceCardProps {
  invoice: any;
  currentProformaId: string;
}

export default function InvoiceCard({ invoice, currentProformaId }: InvoiceCardProps) {
  const isCurrent = invoice.proforma_id === currentProformaId;

  return (
    <Card className={`group border-border/50 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/20 ${isCurrent ? 'ring-2 ring-primary/20 bg-primary/5' : 'bg-white'}`}>
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center">
          {/* Main Info */}
          <div className="flex-1 p-6 space-y-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <StatusBadge status={invoice.status} />
                {isCurrent && (
                  <Badge variant="outline" className="text-[10px] font-bold bg-primary text-primary-foreground border-none px-2 h-5">Current</Badge>
                )}
              </div>
              <h3 className="text-xl font-serif font-black text-[#0D3B47] group-hover:text-primary transition-colors leading-tight">
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
          <div className="sm:w-64 bg-[#F4F2EC] sm:bg-[#F4F2EC]/50 p-6 flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-4 sm:border-l border-border/30">
            <div className="text-right sm:text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">Total Amount</p>
              <p className="text-2xl font-serif font-black text-primary tabular-nums tracking-tighter">
                ${invoice.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            
            <Link href={`/p/${invoice.proforma_id}?type=invoice`} className="block w-auto sm:w-full">
              <Button 
                variant={isCurrent ? "secondary" : "outline"}
                className={`w-full font-bold text-xs uppercase tracking-widest h-10 rounded-xl shadow-sm transition-all active:scale-95 ${
                  isCurrent ? 'bg-white border-primary/20 text-primary' : 'bg-white hover:bg-white/80'
                }`}
              >
                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                {isCurrent ? 'View Details' : 'Open Invoice'}
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
