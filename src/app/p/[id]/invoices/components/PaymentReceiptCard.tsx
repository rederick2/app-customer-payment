'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, CreditCard, Download, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaymentCardProps {
  payment: any;
  onViewPDF: () => void;
}

export default function PaymentReceiptCard({ payment, onViewPDF }: PaymentCardProps) {
  const isDeposit = payment.type === 'deposit';

  return (
    <Card className="group border-border/50 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/20 bg-white rounded-2xl">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center">
          {/* Main Info */}
          <div className="flex-1 p-6 space-y-4 text-left">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Badge className={isDeposit ?
                  "bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border-amber-500/20 text-[10px] font-black uppercase tracking-widest px-3 py-1" :
                  "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/20 text-[10px] font-black uppercase tracking-widest px-3 py-1"
                }>
                  {isDeposit ? 'Deposit' : 'Payment'}
                </Badge>
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-blue-50/50 text-blue-700 border-blue-200">
                  {payment.status}
                </Badge>
              </div>
              <h3 className="text-xl  font-black text-[#0D3B47] group-hover:text-primary transition-colors leading-tight">
                {payment.proformas?.project_name || 'Payment for Project'}
              </h3>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3">
              <div className="flex items-center gap-2">
                <div className="bg-muted/50 p-1.5 rounded-lg border border-border/10">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground/60" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Date</p>
                  <p className="text-sm font-semibold text-[#0D3B47]">
                    {new Date(payment.payment_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-muted/50 p-1.5 rounded-lg border border-border/10">
                  <CreditCard className="h-4 w-4 text-muted-foreground/60" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Method</p>
                  <p className="text-sm font-semibold text-[#0D3B47] uppercase">
                    {payment.payment_method || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-muted/50 p-1.5 rounded-lg border border-border/10">
                  <Hash className="h-4 w-4 text-muted-foreground/60" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Receipt</p>
                  <p className="text-sm font-semibold font-mono text-[#0D3B47]">
                    #REC-{payment.id.split('-')[0].toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Amount and Action */}
          <div className="sm:w-64 bg-[#F4F2EC] sm:bg-[#F4F2EC]/50 p-6 flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-4 sm:border-l border-border/30">
            <div className="text-right sm:text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">Amount Received</p>
              <p className="text-2xl  font-black text-emerald-600 tabular-nums tracking-tighter">
                ${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <Button
              onClick={onViewPDF}
              variant="outline"
              className="w-auto sm:w-full font-bold text-xs uppercase tracking-widest h-10 rounded-xl shadow-sm transition-all active:scale-95 bg-white hover:bg-white/80 border-primary/20 text-primary"
            >
              <Download className="mr-2 h-3.5 w-3.5" />
              Receipt PDF
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
