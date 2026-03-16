'use client';

import * as React from 'react';
import { 
  ArrowLeft, 
  MessageSquare, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Receipt, 
  Calendar, 
  Plus,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  FileText,
  MapPin,
  Mail,
  Search,
  X
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ProformaDropdownActions from './ProformaDropdownActions';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import ReceiptScanner from '@/components/ReceiptScanner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tag, Trash2, Camera, Loader2, Eye, Pencil, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface JobViewProps {
  proforma: any;
  items: any[];
  id: string;
  expenses: any[];
  visits: any[];
  timeEntries: any[];
  invoices: any[];
  payments: any[];
}

export function JobView({ proforma, items, id, expenses: initialExpenses, visits: initialVisits, timeEntries: initialTimeEntries, invoices, payments: initialPayments }: JobViewProps) {
  const [showProfitability, setShowProfitability] = React.useState(true);
  const [expenses, setExpenses] = React.useState(initialExpenses);
  const [payments, setPayments] = React.useState(initialPayments);
  const [visits, setVisits] = React.useState(initialVisits);
  const [timeEntries, setTimeEntries] = React.useState(initialTimeEntries);
  
  const [isAddingExpense, setIsAddingExpense] = React.useState(false);
  const [isScanningExpense, setIsScanningExpense] = React.useState(false);
  const [isRecordingPayment, setIsRecordingPayment] = React.useState(false);
  const [isAddingVisit, setIsAddingVisit] = React.useState(false);
  const [isAddingLabor, setIsAddingLabor] = React.useState(false);
  
  // Expenses search and pagination state
  const [expenseSearchTerm, setExpenseSearchTerm] = React.useState('');
  const [expenseCurrentPage, setExpenseCurrentPage] = React.useState(1);
  const [selectedExpenseForEdit, setSelectedExpenseForEdit] = React.useState<any>(null);
  const [selectedFileUrl, setSelectedFileUrl] = React.useState<string | null>(null);
  
  const itemsPerPage = 10;
  
  const supabase = createClient();

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('proforma_id', id)
      .order('payment_date', { ascending: false });

    if (!error) {
      setPayments(data || []);
    }
  };

  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from('job_expenses')
      .select('*')
      .eq('proforma_id', id)
      .order('date', { ascending: false });

    if (!error) {
      setExpenses(data || []);
    }
  };

  const fetchVisits = async () => {
    const { data, error } = await supabase
      .from('job_visits')
      .select('*')
      .eq('proforma_id', id)
      .order('visit_date', { ascending: true });

    if (!error) {
      setVisits(data || []);
    } else {
      console.error('Error fetching visits:', error);
    }
  };

  const fetchTimeEntries = async () => {
    const { data, error } = await supabase
      .from('job_time_entries')
      .select('*')
      .eq('proforma_id', id)
      .order('date', { ascending: false });

    if (!error) {
      setTimeEntries(data || []);
    } else {
      console.error('Error fetching time entries:', error);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const { error } = await supabase
      .from('job_expenses')
      .delete()
      .eq('id', expenseId);

    if (error) {
      toast.error('Error al eliminar gasto');
    } else {
      setExpenses(prev => prev.filter(e => e.id !== expenseId));
      toast.success('Gasto eliminado');
    }
  };

  const handleDeleteVisit = async (visitId: string) => {
    const { error } = await supabase
      .from('job_visits')
      .delete()
      .eq('id', visitId);

    if (error) {
      toast.error('Error al eliminar visita');
    } else {
      setVisits(prev => prev.filter(v => v.id !== visitId));
      toast.success('Visita eliminada');
    }
  };

  const handeDeleteLabor = async (laborId: string) => {
    const { error } = await supabase
      .from('job_time_entries')
      .delete()
      .eq('id', laborId);

    if (error) {
      toast.error('Error al eliminar labor');
    } else {
      setTimeEntries(prev => prev.filter(t => t.id !== laborId));
      toast.success('Labor eliminada');
    }
  };

  const handleUpdateVisitStatus = async (visitId: string, status: string) => {
    const { error } = await supabase
      .from('job_visits')
      .update({ status })
      .eq('id', visitId);

    if (error) {
      toast.error('Error al actualizar estado');
    } else {
      setVisits(prev => prev.map(v => v.id === visitId ? { ...v, status } : v));
      toast.success('Estado actualizado');
    }
  };

  // Totals calculations
  // Filtering and Pagination logic
  const filteredExpenses = expenses.filter(exp => 
    (exp.place?.toLowerCase().includes(expenseSearchTerm.toLowerCase()) || '') ||
    (exp.description?.toLowerCase().includes(expenseSearchTerm.toLowerCase()) || '') ||
    (exp.category?.toLowerCase().includes(expenseSearchTerm.toLowerCase()) || '')
  );

  const totalExpensePages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const paginatedExpenses = filteredExpenses.slice(
    (expenseCurrentPage - 1) * itemsPerPage,
    expenseCurrentPage * itemsPerPage
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpenseSearchTerm(e.target.value);
    setExpenseCurrentPage(1); // Reset to first page on search
  };

  const totalInvoiced = items.reduce((acc, item) => acc + item.total_price, 0);
  const totalCost = items.reduce((acc, item) => acc + (item.cost || 0) * item.quantity, 0);
  const totalLaborCost = timeEntries.reduce((acc, entry) => acc + (entry.hours || 0) * (entry.rate || 0), 0); 
  const totalExpenses = expenses.reduce((acc, exp) => acc + Number(exp.amount), 0);
  
  const totalProfit = totalInvoiced - totalCost - totalLaborCost - totalExpenses;
  const profitMargin = totalInvoiced > 0 ? (totalProfit / totalInvoiced) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-500">
      
      {/* Action Bar */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/clients" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Directorio
          </Link>
          <span className="text-muted-foreground/40">·</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground mr-1">Job for</span>
            <span className="text-sm font-bold text-foreground">
              {(() => {
                const c = proforma.clients as any;
                return c?.company_name || [c?.first_name, c?.last_name].filter(Boolean).join(' ') || c?.name || 'Client';
              })()}
            </span>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm" className="h-9 gap-2 shadow-sm">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </Button>
          <ProformaDropdownActions proformaId={id} currentStatus={proforma.status || 'draft'} projectName={proforma.project_name} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        
        {/* Header Summary */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 bg-white p-6 rounded-xl border border-border/40 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <Briefcase className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px] font-black tracking-widest uppercase">
                  {proforma.status.toUpperCase()}
                </Badge>
                <span className="text-muted-foreground text-xs font-medium">Job #{proforma.id.split('-')[0].toUpperCase()}</span>
              </div>
              <h1 className="text-3xl font-serif font-bold text-foreground mb-1">{proforma.project_name}</h1>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{proforma.clients?.street_1 || proforma.clients?.address || 'No address provided'}</span>
                </div>
                <div className="flex items-center gap-2 text-primary font-medium">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{proforma.clients?.email || 'No email'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-4 w-full md:w-auto">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Job Type</p>
              <p className="text-sm font-bold">One-off job</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Started On</p>
              <p className="text-sm font-bold">{proforma.job_start_at ? format(new Date(proforma.job_start_at), 'MMM d, yyyy') : '-'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Ends On</p>
              <p className="text-sm font-bold">{proforma.job_end_at ? format(new Date(proforma.job_end_at), 'MMM d, yyyy') : '-'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">From quote</p>
              <p className="text-sm font-bold text-emerald-600">Quote #{proforma.id.split('-')[0].toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* Profitability Panel */}
        <div className="bg-[#F8F7F2] rounded-xl border border-border/40 overflow-hidden">
          <div className="p-4 border-b border-border/40 flex items-center justify-between">
            <button 
              onClick={() => setShowProfitability(!showProfitability)}
              className="flex items-center gap-2 text-sm font-bold hover:text-primary transition-colors"
            >
              {showProfitability ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showProfitability ? 'Hide Profitability' : 'Show Profitability'}
            </button>
          </div>
          
          {showProfitability && (
            <div className="p-6">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="relative h-24 w-24 flex items-center justify-center">
                    <svg className="h-full w-full transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        fill="transparent"
                        stroke="#E2E0D8"
                        strokeWidth="10"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        fill="transparent"
                        stroke="#306C3E"
                        strokeWidth="10"
                        strokeDasharray={`${(profitMargin / 100) * 251.2} 251.2`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold">{profitMargin.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold font-serif">{profitMargin.toFixed(2)}%</h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Profit margin</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-12 gap-y-4">
                  <div className="text-center md:text-left">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total price</p>
                    <p className="text-xl font-bold font-serif">${totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
                      <span className="w-2 h-0.5 bg-blue-500" /> Line Item Cost
                    </p>
                    <p className="text-xl font-bold font-serif -ml-3"><span className="text-muted-foreground/30 px-1">-</span> ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
                      <span className="w-2 h-0.5 bg-sky-400" /> Labor
                    </p>
                    <p className="text-xl font-bold font-serif -ml-3"><span className="text-muted-foreground/30 px-1">-</span> ${totalLaborCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
                      <span className="w-2 h-0.5 bg-purple-400" /> Expenses
                    </p>
                    <p className="text-xl font-bold font-serif -ml-3"><span className="text-muted-foreground/30 px-1">-</span> ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="h-10 w-px bg-border/40 hidden md:block" />
                  <div className="text-center md:text-left">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
                      <span className="w-2 h-0.5 bg-emerald-500" /> Profit
                    </p>
                    <p className="text-xl font-bold font-serif -ml-3"><span className="text-emerald-600 px-1">=</span> ${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 gap-6">
          
          {/* Line Items */}
          <Card className="border-border/40 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/5">
              <CardTitle className="text-xl font-serif">Line Items</CardTitle>
              <Button size="sm" className="h-8 gap-1 font-bold">
                <Plus className="h-4 w-4" /> New Line Item
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/10 text-muted-foreground border-b border-border/40">
                    <tr>
                      <th className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-left">Product / Service</th>
                      <th className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-center">Quantity</th>
                      <th className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-right">Cost</th>
                      <th className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-right">Price</th>
                      <th className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-emerald-700">{item.description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.details}</p>
                        </td>
                        <td className="px-6 py-4 text-center font-medium">{item.quantity}</td>
                        <td className="px-6 py-4 text-right tabular-nums text-muted-foreground">${(item.cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 text-right tabular-nums text-muted-foreground">${item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 text-right tabular-nums font-bold">${item.total_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    <tr className="bg-muted/5 font-bold">
                      <td colSpan={2} className="px-6 py-4">
                        <Button variant="outline" size="sm" className="h-8 gap-1 font-bold">
                          <Plus className="h-3 w-3" /> New Line Item
                        </Button>
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums">${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4" />
                      <td className="px-6 py-4 text-right tabular-nums text-lg">${totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Payments & Expenses Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payments */}
            <Card className="border-border/40 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/5">
                <CardTitle className="text-xl font-serif">Payments</CardTitle>
                <Button 
                  size="sm" 
                  className="h-8 gap-1 font-bold bg-[#306C3E] hover:bg-[#265832]"
                  onClick={() => setIsRecordingPayment(true)}
                >
                  <Plus className="h-4 w-4" /> Record Payment
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {payments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/10 text-muted-foreground border-b border-border/40">
                        <tr>
                          <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-left text-xs">Date</th>
                          <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-left text-xs">Method</th>
                          <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-right text-xs">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {payments.map(payment => (
                          <tr key={payment.id} className="hover:bg-muted/5 transition-colors">
                            <td className="px-4 py-4 text-muted-foreground whitespace-nowrap text-xs">{format(new Date(payment.payment_date), 'dd/MM/yyyy')}</td>
                            <td className="px-4 py-4 font-bold text-foreground text-xs">{payment.payment_method}</td>
                            <td className="px-4 py-4 text-right tabular-nums font-bold text-emerald-600">${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center flex flex-col items-center gap-2 opacity-60">
                    <DollarSign className="h-10 w-10 text-muted-foreground" />
                    <p className="text-xs font-medium px-8 text-center">No payment records found for this job</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expenses */}
            <Card className="border-border/40 shadow-sm overflow-hidden flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/5">
                <CardTitle className="text-xl font-serif">Expenses</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-1.5 font-bold border-primary/20 hover:bg-primary/5"
                    onClick={() => setIsScanningExpense(true)}
                  >
                    <Camera className="h-4 w-4" /> Scanner AI
                  </Button>
                  <Button 
                    size="sm" 
                    className="h-8 gap-1 font-bold bg-[#306C3E] hover:bg-[#265832]"
                    onClick={() => setIsAddingExpense(true)}
                  >
                    <Plus className="h-4 w-4" /> Nuevo Gasto
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col">
                {/* Search Bar */}
                <div className="p-4 border-b border-border/40 bg-white">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar por lugar, descripción o categoría..." 
                      className="pl-9 h-9 text-xs"
                      value={expenseSearchTerm}
                      onChange={handleSearchChange}
                    />
                  </div>
                </div>

                {paginatedExpenses.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/10 text-muted-foreground border-b border-border/40">
                          <tr>
                            <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-left">Fecha</th>
                            <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-left">Lugar</th>
                            <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-left">Descripción</th>
                            <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-left">Categoría</th>
                            <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-right">Monto</th>
                            <th className="px-4 py-3 w-10 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {paginatedExpenses.map(exp => (
                            <tr key={exp.id} className="hover:bg-muted/5 transition-colors group">
                              <td className="px-4 py-4 text-muted-foreground whitespace-nowrap text-[11px]">{format(new Date(exp.date), 'dd/MM/yyyy')}</td>
                              <td className="px-4 py-4 font-bold text-foreground text-xs">{exp.place || 'Proveedor'}</td>
                              <td className="px-4 py-4 text-xs text-muted-foreground line-clamp-1 max-w-[150px]">{exp.description}</td>
                              <td className="px-4 py-4">
                                <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest">
                                  {exp.category}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right tabular-nums font-bold text-red-600 text-xs">${Number(exp.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                              <td className="px-4 py-4 text-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                      <MoreVertical className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem className="text-xs cursor-pointer gap-2" onClick={() => setSelectedExpenseForEdit(exp)}>
                                      <Pencil className="h-3.5 w-3.5" /> Editar
                                    </DropdownMenuItem>
                                    {exp.image_url && (
                                      <DropdownMenuItem className="text-xs cursor-pointer gap-2" onClick={() => setSelectedFileUrl(exp.image_url)}>
                                        <Eye className="h-3.5 w-3.5" /> Ver Archivo
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem className="text-xs cursor-pointer gap-2 text-red-600 focus:text-red-600" onClick={() => handleDeleteExpense(exp.id)}>
                                      <Trash2 className="h-3.5 w-3.5" /> Eliminar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalExpensePages > 1 && (
                      <div className="p-4 border-t border-border/40 flex items-center justify-between bg-white mt-auto">
                        <p className="text-[10px] text-muted-foreground">
                          Mostrando {(expenseCurrentPage - 1) * itemsPerPage + 1} - {Math.min(expenseCurrentPage * itemsPerPage, filteredExpenses.length)} de {filteredExpenses.length}
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0" 
                            disabled={expenseCurrentPage === 1}
                            onClick={() => setExpenseCurrentPage(prev => prev - 1)}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <div className="flex items-center gap-1.5 px-2">
                            <span className="text-xs font-bold text-foreground">{expenseCurrentPage}</span>
                            <span className="text-[10px] text-muted-foreground">/</span>
                            <span className="text-xs text-muted-foreground">{totalExpensePages}</span>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0" 
                            disabled={expenseCurrentPage === totalExpensePages}
                            onClick={() => setExpenseCurrentPage(prev => prev + 1)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-12 text-center flex flex-col items-center gap-2 opacity-60">
                    <Receipt className="h-10 w-10 text-muted-foreground" />
                    <p className="text-xs font-medium px-8 text-center">
                      {expenseSearchTerm ? 'No se encontraron gastos que coincidan con la búsqueda' : 'Registra tus gastos para tener un control detallado de los costos del trabajo'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Labor & Visits Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Labor */}
            <Card className="border-border/40 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/5">
                <CardTitle className="text-xl font-serif">Labor</CardTitle>
                <Button variant="outline" size="sm" className="h-8 gap-1 font-bold" onClick={() => setIsAddingLabor(true)}>
                  <Plus className="h-4 w-4" /> New Time Entry
                </Button>
              </CardHeader>
              <CardContent className="py-8 text-center bg-white">
                {timeEntries.length > 0 ? (
                  <div className="space-y-4 text-left px-6">
                    {timeEntries.map(entry => (
                      <div key={entry.id} className="flex justify-between items-center p-3 rounded-lg border border-border/40 group">
                        <div className="flex items-center gap-4">
                          <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <Clock className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{entry.user_name || 'Staff'}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{format(new Date(entry.date), 'MMM d, yyyy')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-sm font-bold tabular-nums">{entry.duration}</p>
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32">
                              <DropdownMenuItem className="text-xs gap-2 text-red-600 focus:text-red-600" onClick={() => handeDeleteLabor(entry.id)}>
                                <Trash2 className="h-3.5 w-3.5" /> Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 opacity-60">
                    <Clock className="h-10 w-10 text-muted-foreground" />
                    <p className="text-xs font-medium">Time tracked to this job by you or your team will show here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Visits */}
            <Card className="border-border/40 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/5">
                <CardTitle className="text-xl font-serif">Visits</CardTitle>
                <Button variant="outline" size="sm" className="h-8 gap-1 font-bold" onClick={() => setIsAddingVisit(true)}>
                  <Plus className="h-4 w-4" /> New Visit
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                 {visits.length > 0 ? (
                    <div className="divide-y divide-border/30">
                      {visits.map(visit => (
                        <div key={visit.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-muted/5 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "h-10 w-10 rounded-lg flex items-center justify-center",
                              visit.status === 'overdue' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                            )}>
                               <Calendar className="h-5 w-5" />
                            </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{format(new Date(visit.visit_date), 'MMM d, yyyy')}</span>
                              {visit.status === 'overdue' && (
                                <Badge variant="destructive" className="h-5 px-1.5 text-[10px] font-black uppercase tracking-widest">Overdue</Badge>
                              )}
                              {visit.status === 'completed' && (
                                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 h-5 px-1.5 text-[10px] font-black uppercase tracking-widest">Completed</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">Assigned to: {visit.assigned_name || 'Unassigned'}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem className="text-xs gap-2" onClick={() => handleUpdateVisitStatus(visit.id, 'completed')}>
                              <CheckCircle2 className="h-4 w-4" /> Finalizar Visita
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs gap-2" onClick={() => handleUpdateVisitStatus(visit.id, 'scheduled')}>
                              <Calendar className="h-4 w-4" /> Reprogramar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs gap-2 text-red-600 focus:text-red-600" onClick={() => handleDeleteVisit(visit.id)}>
                              <Trash2 className="h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center flex flex-col items-center gap-3 opacity-60">
                       <AlertCircle className="h-10 w-10 text-muted-foreground" />
                       <p className="text-xs font-medium">No visits scheduled for this job yet</p>
                       <Button size="sm" variant="ghost" className="text-primary font-bold" onClick={() => setIsAddingVisit(true)}>Schedule a Visit</Button>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>

          {/* Invoices */}
          <Card className="border-border/40 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/5 border-b border-border/40">
              <CardTitle className="text-xl font-serif">Invoices</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="border-b border-border/40">
                 <div className="flex gap-8 px-6 py-2 bg-muted/5">
                   <button className="text-sm font-bold text-emerald-600 border-b-2 border-emerald-600 py-1">Billing</button>
                   <button className="text-sm font-medium text-muted-foreground py-1">Reminders</button>
                 </div>
               </div>
               
               <div className="p-6 space-y-6">
                 <div className="flex items-center gap-3 bg-blue-50/30 p-4 rounded-xl border border-blue-100">
                    <input type="checkbox" className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500" />
                    <label className="text-sm font-medium">Split into multiple invoices with a payment schedule</label>
                 </div>

                 <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border/40">
                        <tr>
                          <th className="px-4 py-3 text-left">Invoice</th>
                          <th className="px-4 py-3 text-left">Due Date</th>
                          <th className="px-4 py-3 text-left">Status</th>
                          <th className="px-4 py-3 text-left">Subject</th>
                          <th className="px-4 py-3 text-right">Balance</th>
                          <th className="px-4 py-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {invoices.map(inv => (
                          <tr key={inv.id} className="hover:bg-muted/5 transition-colors">
                            <td className="px-4 py-4 font-bold text-emerald-600">#{inv.invoice_number}</td>
                            <td className="px-4 py-4 text-muted-foreground">{format(new Date(inv.due_date || inv.issue_date), 'd MMM. yyyy', { locale: es })}</td>
                            <td className="px-4 py-4">
                              <Badge variant="outline" className={cn(
                                "flex items-center gap-1.5 w-fit px-2 py-0.5 text-[10px] font-black uppercase tracking-widest",
                                inv.status === 'paid' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"
                              )}>
                                <span className={cn("w-2 h-2 rounded-full", inv.status === 'paid' ? "bg-emerald-500" : "bg-blue-500")} />
                                {inv.status.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 text-muted-foreground">{proforma.project_name}</td>
                            <td className="px-4 py-4 text-right tabular-nums font-bold">${inv.status === 'paid' ? '0.00' : inv.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="px-4 py-4 text-right tabular-nums font-bold text-lg">${inv.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>

                 <Button variant="ghost" className="text-primary font-bold px-0 h-auto hover:bg-transparent">
                   Create Invoice
                 </Button>
               </div>
            </CardContent>
          </Card>

          {/* Internal Notes */}
          <Card className="border-border/40 shadow-sm overflow-hidden">
            <CardHeader className="py-4 bg-muted/5 border-b border-border/40">
              <CardTitle className="text-xl font-serif">Internal notes</CardTitle>
              <p className="text-[10px] font-medium text-muted-foreground uppercase">Internal notes will only be seen by your team</p>
            </CardHeader>
            <CardContent className="p-6">
               <div className="bg-muted/5 border border-border/40 rounded-xl p-4 min-h-[120px]">
                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 font-serif">Note details</p>
                 <textarea 
                  className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none" 
                  placeholder="Click here to add a note..."
                  rows={4}
                 />
               </div>
            </CardContent>
          </Card>

        </div>
      </div>
      {/* Modals */}
      {isAddingExpense && (
        <ExpenseFormModal 
          proformaId={id} 
          onClose={() => setIsAddingExpense(false)} 
          onSuccess={() => {
            setIsAddingExpense(false);
            fetchExpenses();
          }} 
        />
      )}

      {isScanningExpense && (
        <ReceiptScanner 
          proformaId={id} 
          onClose={() => setIsScanningExpense(false)} 
          onSuccess={() => {
            setIsScanningExpense(false);
            fetchExpenses();
          }} 
        />
      )}

      {isRecordingPayment && (
        <RecordPaymentModal 
          proformaId={id}
          clientId={proforma.client_id}
          onClose={() => setIsRecordingPayment(false)}
          onSuccess={() => {
            setIsRecordingPayment(false);
            fetchPayments();
          }}
        />
      )}

      {/* Edit Expense Modal */}
      {selectedExpenseForEdit && (
        <EditExpenseModal 
          expense={selectedExpenseForEdit}
          onClose={() => setSelectedExpenseForEdit(null)}
          onSuccess={() => {
            setSelectedExpenseForEdit(null);
            fetchExpenses();
          }}
        />
      )}

      {/* Labor Modal */}
      {isAddingLabor && (
        <LaborFormModal 
          proformaId={id}
          onClose={() => setIsAddingLabor(false)}
          onSuccess={() => {
            setIsAddingLabor(false);
            fetchTimeEntries();
          }}
        />
      )}

      {/* Visit Modal */}
      {isAddingVisit && (
        <VisitFormModal 
          proformaId={id}
          onClose={() => setIsAddingVisit(false)}
          onSuccess={() => {
            setIsAddingVisit(false);
            fetchVisits();
          }}
        />
      )}

      {/* File Viewer Modal */}
      <Dialog open={!!selectedFileUrl} onOpenChange={(open) => !open && setSelectedFileUrl(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black border-none">
          <DialogHeader className="p-4 bg-white/10 backdrop-blur-md absolute top-0 left-0 right-0 z-10 flex flex-row items-center justify-between">
            <DialogTitle className="text-white text-sm font-bold flex items-center gap-2">
              <Eye className="h-4 w-4" /> Vista de Recibo
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20 h-8 gap-2 font-bold"
              onClick={() => {
                if (selectedFileUrl) window.open(selectedFileUrl, '_blank');
              }}
            >
              <FileDown className="h-4 w-4" /> Descargar
            </Button>
          </DialogHeader>
          <div className="flex items-center justify-center min-h-[50vh] max-h-[85vh] p-4 pt-16">
            {selectedFileUrl ? (
              <img 
                src={selectedFileUrl} 
                alt="Receipt" 
                className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
              />
            ) : (
              <div className="text-white/40 flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-xs uppercase font-black tracking-widest">Cargando...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RecordPaymentModal({ proformaId, clientId, onClose, onSuccess }: { proformaId: string, clientId: string, onClose: () => void, onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const { error } = await supabase
      .from('payments')
      .insert([{
        proforma_id: proformaId,
        client_id: clientId,
        amount: parseFloat(formData.get('amount') as string),
        payment_date: formData.get('payment_date'),
        payment_method: formData.get('payment_method'),
        notes: formData.get('notes')
      }]);

    if (error) {
      toast.error('Error al registrar el pago');
    } else {
      toast.success('Pago registrado correctamente');
      onSuccess();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="bg-[#306C3E] text-white rounded-t-xl">
          <CardTitle className="text-lg">Registrar Pago</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="amount" name="amount" type="number" step="0.01" className="pl-9" placeholder="0.00" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_date">Fecha de Pago</Label>
              <Input id="payment_date" name="payment_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Método de Pago</Label>
              <select 
                id="payment_method" 
                name="payment_method" 
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="Cash">Efectivo</option>
                <option value="Transfer">Transferencia</option>
                <option value="Card">Tarjeta</option>
                <option value="Check">Cheque</option>
                <option value="Other">Otro</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (Opcional)</Label>
              <textarea 
                id="notes" 
                name="notes" 
                className="w-full flex min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Detalles adicionales..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-[#306C3E] hover:bg-[#265832]" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Registrar Pago'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ExpenseFormModal({ proformaId, onClose, onSuccess }: { proformaId: string, onClose: () => void, onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const { error } = await supabase
      .from('job_expenses')
      .insert([{
        proforma_id: proformaId,
        place: formData.get('place'),
        description: formData.get('description'),
        category: formData.get('category'),
        amount: parseFloat(formData.get('amount') as string),
        date: formData.get('date'),
      }]);

    if (error) {
      toast.error('Error al guardar el gasto');
    } else {
      toast.success('Gasto guardado correctamente');
      onSuccess();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="bg-[#0D3B47] text-white rounded-t-xl">
          <CardTitle className="text-lg">Agregar Nuevo Gasto</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="place">Lugar de Compra</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="place" name="place" className="pl-9" placeholder="Ej: Home Depot" required />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" name="description" placeholder="Ej: Pintura y brochas" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="category" name="category" className="pl-9" placeholder="Ej: Materiales" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Monto ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="amount" name="amount" type="number" step="0.01" className="pl-9" placeholder="0.00" required />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-[#0D3B47] hover:bg-[#072a33]" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar Gasto'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function EditExpenseModal({ expense, onClose, onSuccess }: { expense: any, onClose: () => void, onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const { error } = await supabase
      .from('job_expenses')
      .update({
        place: formData.get('place'),
        description: formData.get('description'),
        category: formData.get('category'),
        amount: parseFloat(formData.get('amount') as string),
        date: formData.get('date'),
      })
      .eq('id', expense.id);

    if (error) {
      toast.error('Error al actualizar el gasto');
    } else {
      toast.success('Gasto actualizado correctamente');
      onSuccess();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="bg-[#306C3E] text-white rounded-t-xl">
          <CardTitle className="text-lg flex items-center gap-2">
            <Pencil className="h-5 w-5" /> Editar Gasto
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="place">Lugar de Compra</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="place" name="place" className="pl-9" defaultValue={expense.place} placeholder="Ej: Home Depot" required />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" name="description" defaultValue={expense.description} placeholder="Ej: Pintura y brochas" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="category" name="category" className="pl-9" defaultValue={expense.category} placeholder="Ej: Materiales" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Monto ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="amount" name="amount" type="number" step="0.01" className="pl-9" defaultValue={expense.amount} placeholder="0.00" required />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input id="date" name="date" type="date" defaultValue={expense.date} required />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-[#306C3E] hover:bg-[#265832]" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Actualizar Gasto'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function LaborFormModal({ proformaId, onClose, onSuccess }: { proformaId: string, onClose: () => void, onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [startTime, setStartTime] = React.useState('17:33');
  const [endTime, setEndTime] = React.useState('18:33');
  const [hours, setHours] = React.useState(1);
  const [minutes, setMinutes] = React.useState(0);
  const [hourlyRate, setHourlyRate] = React.useState(0);
  const supabase = createClient();

  // Calculate hours/minutes when start/end time changes
  React.useEffect(() => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    let diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (diffMinutes < 0) diffMinutes += 24 * 60; // Handle overnight

    setHours(Math.floor(diffMinutes / 60));
    setMinutes(diffMinutes % 60);
  }, [startTime, endTime]);

  const totalCost = (hours + minutes / 60) * hourlyRate;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('job_time_entries')
      .insert([{
        proforma_id: proformaId,
        user_id: user?.id,
        user_name: formData.get('user_name'),
        duration: `${hours}h ${minutes}m`,
        hours: hours,
        minutes: minutes,
        start_time: startTime,
        end_time: endTime,
        hourly_rate: hourlyRate,
        total_cost: totalCost,
        date: formData.get('date'),
        notes: formData.get('notes')
      }]);

    if (error) {
      toast.error('Error al registrar labor');
    } else {
      toast.success('Labor registrada correctamente');
      onSuccess();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-lg shadow-2xl border-none overflow-hidden rounded-2xl bg-white">
        <CardHeader className="flex flex-row items-center justify-between py-5 px-8 border-b border-border/10">
          <CardTitle className="text-xl font-bold text-[#0D3B47]">New time entry</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8 hover:bg-muted/10">
            <X className="h-5 w-5 text-muted-foreground" />
          </Button>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Start/End Time Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="relative border border-border/40 rounded-xl px-4 py-2 bg-white">
                  <Label htmlFor="start_time" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Start time</Label>
                  <div className="flex items-center justify-between">
                    <input 
                      id="start_time" 
                      type="time" 
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="text-base font-medium bg-transparent border-none outline-none w-full p-0 h-auto" 
                      required 
                    />
                    <Clock className="h-4 w-4 text-muted-foreground/60" />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="relative border border-border/40 rounded-xl px-4 py-2 bg-white">
                  <Label htmlFor="end_time" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">End time</Label>
                  <div className="flex items-center justify-between">
                    <input 
                      id="end_time" 
                      type="time" 
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="text-base font-medium bg-transparent border-none outline-none w-full p-0 h-auto" 
                      required 
                    />
                    <Clock className="h-4 w-4 text-muted-foreground/60" />
                  </div>
                </div>
              </div>
            </div>

            {/* Hours/Minutes Row */}
            <div className="flex border border-border/40 rounded-xl divide-x divide-border/40 overflow-hidden">
              <div className="flex-1 p-2.5 flex items-center justify-between gap-3 bg-white">
                <input 
                  type="number" 
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-12 border-none shadow-none focus:ring-0 text-base font-medium p-0 text-center bg-transparent" 
                />
                <span className="text-sm font-medium text-muted-foreground">hours</span>
              </div>
              <div className="flex-1 p-2.5 flex items-center justify-between gap-3 bg-white">
                <input 
                  type="number" 
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  className="w-12 border-none shadow-none focus:ring-0 text-base font-medium p-0 text-center bg-transparent" 
                />
                <span className="text-sm font-medium text-muted-foreground">minutes</span>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <div className="relative border border-border/40 rounded-xl p-4 bg-white">
                <textarea 
                  id="notes" 
                  name="notes" 
                  className="w-full min-h-[90px] bg-transparent text-sm resize-none outline-none pt-2"
                  placeholder=" "
                />
                <Label htmlFor="notes" className="absolute left-4 top-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Notes</Label>
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <div className="relative border border-border/40 rounded-xl p-4 bg-white flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="date" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Date</Label>
                  <input 
                    id="date" 
                    name="date" 
                    type="date" 
                    defaultValue={new Date().toISOString().split('T')[0]} 
                    className="text-base font-medium bg-transparent border-none outline-none w-full p-0"
                    required 
                  />
                </div>
                <Calendar className="h-5 w-5 text-[#0D3B47]" />
              </div>
            </div>

            {/* Employee */}
            <div className="space-y-2">
              <div className="relative border border-border/40 rounded-xl p-4 bg-white flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="user_name" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Employee</Label>
                  <select 
                    id="user_name" 
                    name="user_name" 
                    className="w-full bg-transparent border-none outline-none text-base font-medium appearance-none p-0"
                    required
                  >
                    <option value="Erick Santillan">Erick Santillan</option>
                    <option value="Staff Member">Staff Member</option>
                  </select>
                </div>
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            {/* Employee Cost */}
            <div className="space-y-1">
              <div className="relative border border-border/40 rounded-xl px-4 py-3 bg-white flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="hourly_rate" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Employee cost</Label>
                  <div className="flex items-center gap-1">
                    <span className="text-base font-medium text-foreground">$</span>
                    <input 
                      id="hourly_rate" 
                      type="number" 
                      step="0.01" 
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      className="bg-transparent border-none outline-none text-base font-medium w-full p-0" 
                      placeholder="0.00" 
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-muted-foreground">per hour</span>
              </div>
              <p className="text-[11px] text-muted-foreground ml-1">Total cost: ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" className="h-10 px-6 rounded-lg font-bold text-muted-foreground hover:bg-muted/5 border-border/40" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" className="h-10 px-6 rounded-lg font-bold bg-[#306C3E] hover:bg-[#265832] text-white shadow-sm" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Time Entry'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function VisitFormModal({ proformaId, onClose, onSuccess }: { proformaId: string, onClose: () => void, onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const { error } = await supabase
      .from('job_visits')
      .insert([{
        proforma_id: proformaId,
        assigned_name: formData.get('assigned_name'),
        visit_date: formData.get('visit_date'),
        status: formData.get('status'),
        notes: formData.get('notes')
      }]);

    if (error) {
      toast.error('Error al programar visita');
    } else {
      toast.success('Visita programada correctamente');
      onSuccess();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="bg-[#306C3E] text-white rounded-t-xl">
          <CardTitle className="text-lg">Programar Nueva Visita</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assigned_name">Asignar a</Label>
              <Input id="assigned_name" name="assigned_name" placeholder="Nombre completo" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="visit_date">Fecha y Hora</Label>
                <Input id="visit_date" name="visit_date" type="datetime-local" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <select 
                  id="status" 
                  name="status" 
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="scheduled">Programada</option>
                  <option value="completed">Completada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <textarea 
                id="notes" 
                name="notes" 
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Instrucciones para la visita..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-[#306C3E] hover:bg-[#265832]" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Programar Visita'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
