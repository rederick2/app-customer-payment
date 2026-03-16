'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CreditCard, Receipt, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';

interface JobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  proforma: any;
  payments: any[];
  expenses: any[];
}

export function JobDetailModal({ isOpen, onClose, proforma, payments, expenses }: JobDetailModalProps) {
  if (!proforma) return null;

  const jobPayments = payments.filter(p => p.proforma_id === proforma.id && p.status === 'completed');
  const jobExpenses = expenses.filter(e => e.proforma_id === proforma.id);

  const totalPaid = jobPayments.reduce((acc, p) => acc + p.amount, 0);
  const totalExpenses = jobExpenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const balance = totalPaid - totalExpenses;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold uppercase text-[10px]">
              {proforma.status === 'job' ? 'Trabajo' : 'Cotización'}
            </Badge>
            <span className="text-muted-foreground text-sm font-medium">#{proforma.id.split('-')[0].toUpperCase()}</span>
          </div>
          <DialogTitle className="font-serif text-2xl">{proforma.project_name}</DialogTitle>
          <DialogDescription>
            Resumen detallado de movimientos financieros para este trabajo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
            <div className="flex items-center gap-2 text-emerald-700 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-wider">Total Cobrado</span>
            </div>
            <div className="text-xl font-bold text-emerald-900">${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>

          <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4">
            <div className="flex items-center gap-2 text-amber-700 mb-1">
              <TrendingDown className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-wider">Total Gastos</span>
            </div>
            <div className="text-xl font-bold text-amber-900">${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>

          <div className={cn(
            "rounded-xl p-4 border",
            balance >= 0 ? "bg-blue-50/50 border-blue-100" : "bg-red-50/50 border-red-100"
          )}>
            <div className={cn(
              "flex items-center gap-2 mb-1",
              balance >= 0 ? "text-blue-700" : "text-red-700"
            )}>
              <AlertCircle className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-wider">Remanente</span>
            </div>
            <div className={cn(
              "text-xl font-bold",
              balance >= 0 ? "text-blue-900" : "text-red-900"
            )}>${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Pagos / Ingresos */}
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2 mb-3 px-1">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              Ingresos del Trabajo
            </h3>
            {jobPayments.length > 0 ? (
              <div className="space-y-2">
                {jobPayments.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-3 rounded-lg border border-border/40 bg-muted/5">
                    <div>
                      <p className="text-sm font-bold capitalize">{p.type === 'deposit' ? 'Depósito' : 'Pago'}</p>
                      <p className="text-[10px] text-muted-foreground">{format(new Date(p.payment_date), 'PPP', { locale: es })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-700">+${p.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4 bg-muted/5 rounded-lg border border-dashed">No hay pagos registrados.</p>
            )}
          </div>

          {/* Gastos */}
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2 mb-3 px-1">
              <Receipt className="h-4 w-4 text-amber-600" />
              Gastos del Trabajo
            </h3>
            {jobExpenses.length > 0 ? (
              <div className="space-y-2">
                {jobExpenses.map(e => (
                  <div key={e.id} className="flex justify-between items-center p-3 rounded-lg border border-border/40 bg-muted/5">
                    <div>
                      <p className="text-sm font-bold">{e.place || 'Proveedor'}</p>
                      <p className="text-[10px] text-muted-foreground">{e.category} • {format(new Date(e.date), 'PPP', { locale: es })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-700">-${Number(e.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4 bg-muted/5 rounded-lg border border-dashed">No hay gastos registrados.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
