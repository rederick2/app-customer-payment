'use client';

import { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Briefcase,
  CheckCircle,
  CheckSquare,
  DollarSign,
  FileText,
  History,
  Receipt,
  User,
  FileOutput,
  Clock
} from 'lucide-react';

interface ClientActivityTriggerProps {
  client: any;
  latestActivity: Date | null;
}

export function ClientActivityTrigger({ client, latestActivity }: ClientActivityTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const buildTimeline = () => {
    const activities: { date: Date; label: string; icon: any; color: string }[] = [];

    // 1. Client Creation
    activities.push({
      date: new Date(client.created_at),
      label: 'Client Registered in the Directory',
      icon: User,
      color: 'bg-blue-500/10 text-blue-600 border-blue-200'
    });

    // 2. Proformas and their nested activities
    if (client.proformas) {
      client.proformas.forEach((p: any) => {
        if (p.created_at) {
          activities.push({
            date: new Date(p.created_at),
            label: `Quotation Created: ${p.number || p.id.split('-')[0].toUpperCase()}`,
            icon: FileText,
            color: 'bg-slate-500/10 text-slate-600 border-slate-200'
          });
        }

        if (p.approved_at) {
          activities.push({
            date: new Date(p.approved_at),
            label: `Quotation Approved: ${p.number || p.id.split('-')[0].toUpperCase()}`,
            icon: CheckCircle,
            color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
          });
        }

        if (p.job_converted_at) {
          activities.push({
            date: new Date(p.job_converted_at),
            label: `Converted to Job: ${p.number || p.id.split('-')[0].toUpperCase()}`,
            icon: Briefcase,
            color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200'
          });
        }

        if (p.job_tasks) {
          p.job_tasks.forEach((t: any) => {
            activities.push({
              date: new Date(t.created_at),
              label: `Task Created: ${t.title || 'New Task'}`,
              icon: CheckSquare,
              color: 'bg-purple-500/10 text-purple-600 border-purple-200'
            });
          });
        }

        if (p.job_expenses) {
          p.job_expenses.forEach((e: any) => {
            activities.push({
              date: new Date(e.created_at),
              label: `Expense Added: $${e.amount} (${e.place || 'General'})`,
              icon: Receipt,
              color: 'bg-orange-500/10 text-orange-600 border-orange-200'
            });
          });
        }
      });
    }

    // 3. Payments
    if (client.payments) {
      client.payments.forEach((pay: any) => {
        activities.push({
          date: new Date(pay.created_at),
          label: `Payment Registered: $${pay.amount}`,
          icon: DollarSign,
          color: 'bg-green-500/10 text-green-600 border-green-200'
        });
      });
    }

    // 4. Invoices
    if (client.invoices) {
      client.invoices.forEach((inv: any) => {
        activities.push({
          date: new Date(inv.created_at),
          label: `Factura Emitida: ${inv.invoice_number}`,
          icon: FileOutput,
          color: 'bg-red-500/10 text-red-600 border-red-200'
        });
      });
    }

    // Sort descending by date (newest first)
    activities.sort((a, b) => b.date.getTime() - a.date.getTime());

    return activities;
  };

  const timeline = buildTimeline();

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 group w-full px-6 py-4 transition-all hover:bg-primary/5 text-left border-none bg-transparent">
        <Clock className="h-4 w-4 text-primary/40 group-hover:text-primary transition-colors" />
        <span className="text-muted-foreground font-medium group-hover:text-primary transition-colors">
          {latestActivity
            ? formatDistanceToNow(latestActivity, { addSuffix: true })
            : 'Never'}
        </span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-3xl border-border/50 shadow-2xl">
          <DialogHeader className="p-8 pb-4 bg-muted/20 border-b border-border/50">
            <DialogTitle className="text-2xl  tracking-tight flex items-center gap-3">
              <History className="h-6 w-6 text-primary" />
              Línea de Tiempo del Cliente
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Registro cronológico de todas las interacciones, cotizaciones, pagos y tareas generadas para{' '}
              <span className="font-bold text-foreground">
                {client.company_name || [client.first_name, client.last_name].filter(Boolean).join(' ') || client.name}
              </span>.
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-8 relative scroll-smooth">
            {timeline.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <p>No hay actividades registradas aún.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-primary/10 pl-6 space-y-8 pb-8">
                {timeline.map((act, idx) => {
                  const Icon = act.icon;
                  return (
                    <div key={idx} className="relative group animate-in slide-in-from-left-4 fade-in duration-500" style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}>
                      {/* Activity Bullet / Icon Center */}
                      <div className={`absolute -left-[39px] h-8 w-8 rounded-full border shadow-sm flex items-center justify-center bg-card ${act.color} transition-transform group-hover:scale-110`}>
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Content Card */}
                      <div className="bg-card border border-border/40 rounded-2xl p-4 shadow-sm group-hover:shadow-md transition-all group-hover:border-primary/20 hover:bg-muted/10">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-foreground text-sm">{act.label}</h4>
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 whitespace-nowrap ml-4">
                            {formatDistanceToNow(act.date, { addSuffix: true, locale: es })}
                          </span>
                        </div>
                        <time className="text-xs text-muted-foreground opacity-80 font-mono">
                          {format(act.date, "EEEE d 'de' MMMM, yyyy - h:mm a", { locale: es })}
                        </time>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
