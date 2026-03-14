'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  Receipt,
  Clock,
  Briefcase,
  Quote
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { BillingModals } from './BillingModals';

interface ClientDetailClientProps {
  client: any;
  proformas: any[];
  payments: any[];
  invoices: any[];
}

export function ClientDetailClient({ client, proformas, payments, invoices }: ClientDetailClientProps) {
  const [activeTab, setActiveTab] = React.useState('active-work');
  const [openModal, setOpenModal] = React.useState<'payment' | 'deposit' | 'invoice' | null>(null);

  const clientName = client.company_name || [client.title, client.first_name, client.last_name].filter(Boolean).join(' ') || client.name;

  // Calculations
  const totalPaid = payments?.reduce((acc, p) => acc + (p.status === 'completed' ? p.amount : 0), 0) || 0;
  const totalInvoiced = invoices?.reduce((acc, i) => acc + i.total_amount, 0) || 0;
  const balance = totalInvoiced - totalPaid;

  const tabs = [
    { id: 'active-work', label: 'Trabajo Activo' },
    { id: 'requests', label: 'Solicitudes' },
    { id: 'quotes', label: 'Cotizaciones' },
    { id: 'jobs', label: 'Jobs' },
    { id: 'invoices-tab', label: 'Invoices' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-500">

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/clients" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-2 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Directorio de Clientes
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">{clientName}</h1>
            {client.company_name && (
              <Badge variant="secondary" className="mt-1">Empresa</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/clients/${client.id}/edit`} className={cn(buttonVariants({ variant: 'outline' }), "shadow-sm font-bold")}>
            Editar Perfil
          </Link>
          <Link href="/proforma/new" className={cn(buttonVariants({ variant: 'default' }), "bg-[#306C3E] hover:bg-[#265832] font-bold")}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proyecto
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">

          {/* Contacts Section */}
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg font-serif">Contactos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase bg-muted/20 text-muted-foreground border-b border-border/40">
                    <tr>
                      <th className="px-6 py-3 font-bold text-left tracking-wider">Nombre</th>
                      <th className="px-6 py-3 font-bold text-left tracking-wider">Rol</th>
                      <th className="px-6 py-3 font-bold text-left tracking-wider">Teléfono</th>
                      <th className="px-6 py-3 font-bold text-left tracking-wider">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    <tr className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-semibold">{[client.first_name, client.last_name].filter(Boolean).join(' ') || client.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">Principal</td>
                      <td className="px-6 py-4 text-muted-foreground">{client.phone || '-'}</td>
                      <td className="px-6 py-4 text-muted-foreground">{client.email || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {!client.phone && !client.email && (
                <div className="py-8 text-center text-muted-foreground">No hay información de contacto adicional.</div>
              )}
            </CardContent>
          </Card>

          {/* Tabs Section */}
          <div className="space-y-4">
            <div className="flex border-b border-border/40 pb-px overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-6 py-3 text-sm font-bold transition-all whitespace-nowrap -mb-px border-b-2",
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-0">
                {/* Specific content based on activeTab */}
                {activeTab === 'invoices-tab' ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-muted/10 text-muted-foreground border-b border-border/40">
                        <tr>
                          <th className="px-6 py-3 font-bold">Número</th>
                          <th className="px-6 py-3 font-bold">Fecha</th>
                          <th className="px-6 py-3 font-bold">Estado</th>
                          <th className="px-6 py-3 font-bold text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {invoices && invoices.length > 0 ? (
                          invoices.map(inv => (
                            <tr key={inv.id} className="hover:bg-muted/5">
                              <td className="px-6 py-4 font-bold">#{inv.invoice_number}</td>
                              <td className="px-6 py-4 text-muted-foreground">{format(new Date(inv.issue_date), 'MMM d, yyyy')}</td>
                              <td className="px-6 py-4">
                                <Badge variant="outline" className={cn(
                                  "bg-blue-50 text-blue-700 border-blue-200",
                                  inv.status === 'paid' && "bg-emerald-50 text-emerald-700 border-emerald-200"
                                )}>
                                  {inv.status.toUpperCase()}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-right font-bold">
                                ${inv.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-12 text-center text-muted-foreground">No hay facturas registradas.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <tbody className="divide-y divide-border/40">
                        {proformas && proformas.length > 0 ? (
                          proformas.filter(p => {
                            if (activeTab === 'jobs') return p.status === 'job';
                            if (activeTab === 'quotes') return p.status !== 'job';
                            return true; // Simple filtering for demo
                          }).map((item) => (
                            <tr key={item.id} className="hover:bg-muted/10 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                                    item.status === 'job' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                                  )}>
                                    {item.status === 'job' ? <Briefcase className="h-5 w-5" /> : <Quote className="h-5 w-5" />}
                                  </div>
                                  <div>
                                    <div className="font-bold text-foreground group-hover:text-primary transition-colors">
                                      {item.status === 'job' ? 'Job #' : 'Quote #'}{item.id.split('-')[0].toUpperCase()} - {item.project_name}
                                    </div>
                                    <Badge variant="outline" className={cn(
                                      "mt-1 text-[10px] font-extrabold py-0 h-5 px-1.5",
                                      item.status === 'job' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"
                                    )}>
                                      {item.status === 'job' ? 'EN PROGRESO' : 'ESPERANDO RESPUESTA'}
                                    </Badge>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-muted-foreground">
                                <div className="text-[10px] font-bold uppercase tracking-tight opacity-60">PROGRAMADO PARA</div>
                                <div className="text-sm font-medium">{item.valid_until ? format(new Date(item.valid_until), 'MMM d, yyyy') : '-'}</div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="font-bold text-lg">${item.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <Link href={`/proforma/${item.id}`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-20 text-center text-muted-foreground">
                              <div className="flex flex-col items-center gap-2">
                                <Briefcase className="h-10 w-10 opacity-20" />
                                <p>No hay proyectos en esta categoría.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">

          {/* Billing History Card */}
          <Card className="border-border/50 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-serif">Facturación & Pagos</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button variant="outline" size="sm" className="h-8 shadow-sm gap-1 font-bold">
                    Nuevo <ArrowLeft className="h-3 w-3 rotate-[270deg]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1">
                  <DropdownMenuItem onClick={() => setOpenModal('payment')} className="cursor-pointer gap-2 py-2 font-medium">
                    <CreditCard className="h-4 w-4 text-emerald-600" /> Registrar Pago
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setOpenModal('deposit')} className="cursor-pointer gap-2 py-2 font-medium">
                    <Receipt className="h-4 w-4 text-amber-600" /> Registrar Depósito
                  </DropdownMenuItem>
                  <div className="h-px bg-muted my-1" />
                  <DropdownMenuItem onClick={() => setOpenModal('invoice')} className="cursor-pointer gap-2 py-2 font-medium">
                    <FileText className="h-4 w-4 text-blue-600" /> Crear Factura (Invoice)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-6">

              {(!payments || payments.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-border/40 rounded-xl bg-muted/5">
                  <div className="h-14 w-14 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                    <Receipt className="h-8 w-8 text-muted/40" />
                  </div>
                  <p className="text-sm font-bold text-foreground/80 mb-1">Sin historial</p>
                  <p className="text-[11px] text-muted-foreground max-w-[200px]">Empieza registrando un depósito o creando una factura.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {payments.map(payment => (
                    <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/40 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-9 w-9 rounded-full flex items-center justify-center",
                          payment.type === 'deposit' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                        )}>
                          {payment.type === 'deposit' ? <Clock className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{payment.type === 'deposit' ? 'Depósito' : 'Pago'}</p>
                          <p className="text-[10px] font-medium text-muted-foreground">{format(new Date(payment.payment_date), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        <Badge variant="outline" className="text-[8px] font-extrabold h-4 leading-none py-0 uppercase">
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-[#F4F2EC] rounded-xl p-5 border border-[#E2E0D8] shadow-inner">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[#0D3B47] mb-2 opacity-60">
                  Balance Pendiente
                </div>
                <div className="flex justify-between items-end">
                  <div className={cn(
                    "text-3xl font-bold font-serif tabular-nums tracking-tight",
                    balance > 0 ? "text-red-700" : "text-[#0D3B47]"
                  )}>
                    ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <Badge className={cn(
                    "h-6 font-bold shadow-sm",
                    balance <= 0 ? "bg-[#306C3E] text-white" : "bg-red-100 text-red-700 border-red-200"
                  )}>
                    {balance <= 0 ? 'AL DÍA' : 'DEUDOR'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Internal Notes */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-serif">Notas Internas</CardTitle>
              <CardDescription className="text-[11px]">Notas privadas sobre este cliente.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <textarea
                  className="w-full min-h-[100px] bg-muted/10 border border-border/50 rounded-lg p-3 text-sm focus:ring-1 focus:ring-primary outline-none resize-none transition-all placeholder:text-muted-foreground/50"
                  placeholder="Añade una nota interna..."
                />
                <Button variant="secondary" size="sm" className="w-full font-bold text-[11px] uppercase tracking-wider h-9">
                  Guardar Nota
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      <BillingModals
        clientId={client.id}
        proformas={proformas}
        payments={payments}
        invoices={invoices}
        openType={openModal}
        onClose={() => setOpenModal(null)}
      />
    </div>
  );
}
