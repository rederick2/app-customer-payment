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
  Quote,
  Search,
  ChevronLeft,
  ChevronUp,
  Eye,
  Pencil,
  Trash2,
  FileDown,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { BillingModals } from './BillingModals';
import { JobDetailModal } from './JobDetailModal';
import { InvoiceFormModal } from '@/app/proforma/[id]/components/InvoiceFormModal';
import { EmailBillingModal } from '@/app/proforma/[id]/components/EmailBillingModal';
import { deleteInvoice, deletePayment } from '../actions';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';
import InvoicePDF from '@/lib/pdf/InvoicePDF';
import PaymentPDF from '@/lib/pdf/PaymentPDF';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ITEMS_PER_PAGE = 10;

interface ClientDetailClientProps {
  client: any;
  proformas: any[];
  payments: any[];
  invoices: any[];
  expenses: any[];
}

export function ClientDetailClient({ client, proformas, payments, invoices, expenses }: ClientDetailClientProps) {
  const [activeTab, setActiveTab] = React.useState('active-work');
  const [openModal, setOpenModal] = React.useState<'payment' | 'deposit' | 'invoice' | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedJobDetail, setSelectedJobDetail] = React.useState<any | null>(null);
  const [showMoreDetails, setShowMoreDetails] = React.useState(false);

  // New States for Actions
  const [editingInvoice, setEditingInvoice] = React.useState<any | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = React.useState<any | null>(null);
  const [paymentToDelete, setPaymentToDelete] = React.useState<any | null>(null);
  const [billingEmailModal, setBillingEmailModal] = React.useState<{ type: 'invoice' | 'payment', data: any } | null>(null);

  // Helper for PDF viewing
  const handleViewInvoicePDF = async (invoice: any) => {
    try {
      const proforma = proformas.find(p => p.id === invoice.proforma_id);
      const user = proformas[0]?.users;
      const blob = await pdf(<InvoicePDF invoice={invoice} proforma={proforma} client={client} user={user} />).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF de la factura.');
    }
  };

  const handleViewReceiptPDF = async (payment: any) => {
    try {
      const proforma = proformas.find(p => p.id === payment.proforma_id);
      const user = proformas[0]?.users;
      const blob = await pdf(<PaymentPDF payment={payment} proforma={proforma} client={client} user={user} />).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el recibo de pago.');
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      const result = await deleteInvoice(id, client.id);
      if (result.success) {
        toast.success('Factura eliminada.');
        setInvoiceToDelete(null);
      } else {
        toast.error(result.error || 'Error al eliminar.');
      }
    } catch (error) {
      toast.error('Error inesperado.');
    }
  };

  const handleDeletePayment = async (id: string) => {
    try {
      const result = await deletePayment(id, client.id);
      if (result.success) {
        toast.success('Pago eliminado.');
        setPaymentToDelete(null);
      } else {
        toast.error(result.error || 'Error al eliminar.');
      }
    } catch (error) {
      toast.error('Error inesperado.');
    }
  };


  // Reset pagination when tab or search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

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
          <Link href={`/proforma/new?clientId=${client.id}`} className={cn(buttonVariants({ variant: 'default' }), "bg-[#306C3E] hover:bg-[#265832] font-bold")}>
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
              <div className="overflow-x-auto rounded-lg border border-border/40">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase bg-muted/20 text-muted-foreground border-b border-border/40">
                    <tr>
                      {/* Asignamos anchos específicos para mejor jerarquía visual */}
                      <th className="px-6 py-3 font-bold text-left tracking-wider w-1/4">Name</th>
                      <th className="px-6 py-3 font-bold text-left tracking-wider w-1/3">Address</th>
                      <th className="px-6 py-3 font-bold text-left tracking-wider">Phone</th>
                      <th className="px-6 py-3 font-bold text-left tracking-wider">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    <tr className="hover:bg-muted/10 transition-colors">
                      {/* Nombre */}
                      <td className="px-6 py-4 font-semibold text-foreground">
                        {[client.first_name, client.last_name].filter(Boolean).join(' ') || client.name}
                      </td>

                      {/* Dirección con Link a Google Maps */}
                      <td className="px-6 py-4 text-muted-foreground">
                        {client.street_1 ? (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${client.street_1}, ${client.city}, ${client.province} ${client.postal_code}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary hover:underline transition-all"
                          >
                            {`${client.street_1}, ${client.city}, ${client.province} ${client.postal_code}`}
                          </a>
                        ) : '-'}
                      </td>

                      {/* Teléfono con Link de marcado */}
                      <td className="px-6 py-4 text-muted-foreground">
                        {client.phone ? (
                          <a href={`tel:${client.phone}`} className="hover:text-primary hover:underline transition-all">
                            {client.phone}
                          </a>
                        ) : '-'}
                      </td>

                      {/* Email con Link mailto */}
                      <td className="px-6 py-4 text-muted-foreground">
                        {client.email ? (
                          <a href={`mailto:${client.email}`} className="hover:text-primary hover:underline transition-all">
                            {client.email}
                          </a>
                        ) : '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {!client.phone && !client.email && (
                <div className="py-8 text-center text-muted-foreground">No hay información de contacto adicional.</div>
              )}

              <div className="p-3 border-t border-border/40 bg-muted/5 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowMoreDetails(!showMoreDetails)}
                >
                  {showMoreDetails ? (
                    <><ChevronUp className="mr-2 h-4 w-4" /> Ocultar detalles</>
                  ) : (
                    <><ChevronDown className="mr-2 h-4 w-4" /> Ver más detalles</>
                  )}
                </Button>
              </div>

              {showMoreDetails && (
                <div className="p-6 border-t border-border/40 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-muted/10 rounded-b-lg">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold border-b pb-2">Teléfonos Adicionales</h4>
                    <div className="space-y-2">
                      {client.work_phone && <p className="text-sm flex justify-between"><span className="text-muted-foreground">Trabajo:</span> <span className="font-medium">{client.work_phone}</span></p>}
                      {client.mobile_phone && <p className="text-sm flex justify-between"><span className="text-muted-foreground">Móvil:</span> <span className="font-medium">{client.mobile_phone}</span></p>}
                      {client.home_phone && <p className="text-sm flex justify-between"><span className="text-muted-foreground">Casa:</span> <span className="font-medium">{client.home_phone}</span></p>}
                      {client.fax_phone && <p className="text-sm flex justify-between"><span className="text-muted-foreground">Fax:</span> <span className="font-medium">{client.fax_phone}</span></p>}
                      {client.other_phones && <p className="text-sm flex justify-between"><span className="text-muted-foreground">Otros:</span> <span className="font-medium">{client.other_phones}</span></p>}
                      {!client.work_phone && !client.mobile_phone && !client.home_phone && !client.fax_phone && !client.other_phones && (
                        <p className="text-sm text-muted-foreground italic">No hay teléfonos registrados.</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold border-b pb-2">Dirección de Facturación</h4>
                    {client.billing_street_1 ? (
                      <div className="text-sm font-medium space-y-1">
                        <p>{client.billing_street_1}</p>
                        {client.billing_street_2 && <p>{client.billing_street_2}</p>}
                        <p>{client.billing_city}{client.billing_state ? `, ${client.billing_state}` : ''} {client.billing_zip_code}</p>
                        <p className="text-muted-foreground">{client.billing_country}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No especificada o igual a la de servicio.</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold border-b pb-2">Otros Datos</h4>
                    <div className="space-y-2">
                      {client.tags && <p className="text-sm flex flex-col"><span className="text-muted-foreground text-xs mb-1">Tags:</span> <span className="font-medium">{client.tags}</span></p>}
                      {client.lead_source && <p className="text-sm flex justify-between"><span className="text-muted-foreground">Lead Source:</span> <span className="font-medium">{client.lead_source}</span></p>}
                      {client.import_id && <p className="text-sm flex justify-between"><span className="text-muted-foreground">ID Externo:</span> <span className="font-medium">{client.import_id}</span></p>}

                      <div className="pt-2">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Preferencias Automáticas:</p>
                        <ul className="text-xs space-y-1.5 list-disc pl-4 font-medium">
                          {client.receives_automatic_visit_reminders && <li>Recordatorios de visita</li>}
                          {client.receives_automatic_job_follow_ups && <li>Seguimientos de trabajo</li>}
                          {client.receives_automatic_quote_follow_ups && <li>Seguimientos de cotización</li>}
                          {client.receives_automatic_invoice_follow_ups && <li>Seguimientos de factura</li>}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
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
              <CardContent className="p-0">                {/* Tab Header with Search */}
                <div className="p-4 border-b border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/5">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={`Buscar ${activeTab === 'invoices-tab' ? 'facturas' : 'proyectos'}...`}
                      className="pl-9 h-9 bg-white border-border/50"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

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
                          <th className="px-6 py-3 font-bold text-right w-[80px]">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {(() => {
                          const filteredInvoices = (invoices || []).filter(inv =>
                            inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase())
                          );
                          const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
                          const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

                          if (paginatedInvoices.length > 0) {
                            return (
                              <>
                                {paginatedInvoices.map(inv => (
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
                                    <td className="px-6 py-4 text-right">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                                          <MoreVertical className="h-4 w-4" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                          <DropdownMenuItem onClick={() => handleViewInvoicePDF(inv)}>
                                            <Eye className="mr-2 h-4 w-4" /> Ver PDF
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => setBillingEmailModal({ type: 'invoice', data: inv })}>
                                            <Mail className="mr-2 h-4 w-4" /> Enviar por Email
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem onClick={() => setEditingInvoice(inv)}>
                                            <Pencil className="mr-2 h-4 w-4" /> Editar
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => setInvoiceToDelete(inv)}
                                            className="text-destructive focus:text-destructive"
                                          >
                                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </td>
                                  </tr>
                                ))}
                                {totalPages > 1 && (
                                  <tr>
                                    <td colSpan={4} className="px-6 py-4 border-t border-border/40">
                                      <div className="flex items-center justify-between">
                                        <div className="text-xs text-muted-foreground">
                                          Página {currentPage} de {totalPages}
                                        </div>
                                        <div className="flex gap-1">
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                          >
                                            <ChevronLeft className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                          >
                                            <ChevronRight className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </>
                            );
                          } else {
                            return (
                              <tr>
                                <td colSpan={4} className="py-12 text-center text-muted-foreground">No hay facturas registradas.</td>
                              </tr>
                            );
                          }
                        })()}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <tbody className="divide-y divide-border/40">
                        {(() => {
                          const filteredProformas = (proformas || []).filter(p => {
                            const matchesTab = activeTab === 'jobs' ? p.status === 'job' : (activeTab === 'quotes' ? p.status !== 'job' : true);
                            const matchesSearch = p.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              p.id.toLowerCase().includes(searchQuery.toLowerCase());
                            return matchesTab && matchesSearch;
                          });
                          const totalPages = Math.ceil(filteredProformas.length / ITEMS_PER_PAGE);
                          const paginatedProformas = filteredProformas.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

                          if (paginatedProformas.length > 0) {
                            return (
                              <>
                                {paginatedProformas.map((item) => (
                                  <tr key={item.id} className="hover:bg-muted/10 transition-colors group">
                                    <td className="px-6 py-4">
                                      <Link href={`/proforma/${item.id}`}>
                                        <div className="flex items-center gap-3">
                                          <div className={cn(
                                            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                                            item.status === 'job' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                                          )}>
                                            {item.status === 'job' ? <Briefcase className="h-5 w-5" /> : <Quote className="h-5 w-5" />}
                                          </div>
                                          <div>
                                            <div className="font-bold text-foreground group-hover:text-primary transition-colors">
                                              {item.status === 'job' ? 'Job #' : 'Quote #'} {String(item.number || item.id.split('-')[0]).toUpperCase()} - {item.project_name}
                                            </div>
                                            <Badge variant="outline" className={cn(
                                              "mt-1 text-[10px] font-extrabold py-0 h-5 px-1.5",
                                              item.status === 'job' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"
                                            )}>
                                              {item.status === 'job' ? 'EN PROGRESO' : 'ESPERANDO RESPUESTA'}
                                            </Badge>
                                          </div>
                                        </div></Link>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                      <div className="text-[10px] font-bold uppercase tracking-tight opacity-60">PROGRAMADO PARA</div>
                                      <div className="text-sm font-medium">{item.valid_until ? format(new Date(item.valid_until), 'MMM d, yyyy') : '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <div className="font-bold text-lg">${item.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full"
                                        onClick={() => setSelectedJobDetail(item)}
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                                {totalPages > 1 && (
                                  <tr>
                                    <td colSpan={4} className="px-6 py-4 border-t border-border/40">
                                      <div className="flex items-center justify-between">
                                        <div className="text-xs text-muted-foreground">
                                          Página {currentPage} de {totalPages}
                                        </div>
                                        <div className="flex gap-1">
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                          >
                                            <ChevronLeft className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                          >
                                            <ChevronRight className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </>
                            );
                          } else {
                            return (
                              <tr>
                                <td colSpan={5} className="py-20 text-center text-muted-foreground">
                                  <div className="flex flex-col items-center gap-2">
                                    <Briefcase className="h-10 w-10 opacity-20" />
                                    <p>No hay proyectos en esta categoría.</p>
                                  </div>
                                </td>
                              </tr>
                            );
                          }
                        })()}
                      </tbody>
                    </table>
                  </div>
                )
                }
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
                <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8 shadow-sm gap-1 font-bold" />}>
                  Nuevo <ArrowLeft className="h-3 w-3 rotate-[270deg]" />
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
                    <div key={payment.id} className="group flex items-center justify-between p-3 rounded-lg bg-card border border-border/40 shadow-sm hover:shadow-md transition-shadow">
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
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                          <Badge variant="outline" className="text-[8px] font-extrabold h-4 leading-none py-0 uppercase">
                            {payment.status}
                          </Badge>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" />}>
                            <MoreVertical className="h-3.5 w-3.5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => handleViewReceiptPDF(payment)} className="text-xs">
                              <FileDown className="mr-2 h-3.5 w-3.5" /> Recibo PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setBillingEmailModal({ type: 'payment', data: payment })} className="text-xs">
                              <Mail className="mr-2 h-3.5 w-3.5" /> Enviar Email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setPaymentToDelete(payment)}
                              className="text-xs text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

      <JobDetailModal
        isOpen={selectedJobDetail !== null}
        onClose={() => setSelectedJobDetail(null)}
        proforma={selectedJobDetail}
        payments={payments}
        expenses={expenses}
      />

      {/* Action Modals */}
      {editingInvoice && (
        <InvoiceFormModal
          clientId={client.id}
          proformaId={editingInvoice.proforma_id}
          initialData={editingInvoice}
          onClose={() => setEditingInvoice(null)}
          onSuccess={() => {
            setEditingInvoice(null);
            toast.success('Factura actualizada');
          }}
        />
      )}

      {billingEmailModal && (
        <EmailBillingModal
          type={billingEmailModal.type}
          id={billingEmailModal.data.id}
          clientEmail={client.email}
          clientName={clientName}
          referenceNumber={billingEmailModal.type === 'invoice' ? billingEmailModal.data.invoice_number : String(billingEmailModal.data.number || billingEmailModal.data.id.split('-')[0]).toUpperCase()}
          onClose={() => setBillingEmailModal(null)}
        />
      )}

      {/* Delete Confirmations */}
      <Dialog open={!!invoiceToDelete} onOpenChange={(isOpen) => !isOpen && setInvoiceToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Factura</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la factura #{invoiceToDelete?.invoice_number}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setInvoiceToDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => invoiceToDelete && handleDeleteInvoice(invoiceToDelete.id)}>Eliminar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!paymentToDelete} onOpenChange={(isOpen) => !isOpen && setPaymentToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Pago</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este registro de pago? Esta acción no se puede deshacer y afectará el balance del cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setPaymentToDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => paymentToDelete && handleDeletePayment(paymentToDelete.id)}>Eliminar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
