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
  X,
  ListTodo,
  CheckCircle,
  CalendarDays,
  User as UserIcon,
  Tag,
  Trash2,
  Camera,
  Loader2,
  Eye,
  Pencil,
  ChevronLeft,
  ChevronRight,
  FileDown,
  ZoomIn,
  History as HistoryIcon,
  Save,
  RefreshCw,
  PenLine,
  Download,
  Check,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format, parseISO, formatISO } from 'date-fns';
import { es } from 'date-fns/locale';
import ProformaDropdownActions from './ProformaDropdownActions';
import EmailMaterialsModal from './EmailMaterialsModal';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import ReceiptScanner from '@/components/ReceiptScanner';
import WorkProgressSection from './WorkProgressSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LineItemImage } from '@/components/LineItemImage';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { StatusHistory } from './StatusHistory';
import { InvoiceFormModal } from './InvoiceFormModal';
import { EmailBillingModal } from './EmailBillingModal';
import { pdf } from '@react-pdf/renderer';
import InvoicePDF from '@/lib/pdf/InvoicePDF';
import PaymentPDF from '@/lib/pdf/PaymentPDF';
import { deleteInvoice, deleteProformaItem, updateJobDates, getQuickBooksVendors, getQuickBooksAccounts, syncExpenseToQuickBooks } from './actions';
import { approveProforma } from '@/app/p/[id]/actions';
import SignatureModal from '@/app/p/[id]/components/SignatureModal';

interface JobViewProps {
  proforma: any;
  items: any[];
  id: string;
  expenses: any[];
  visits: any[];
  timeEntries: any[];
  invoices: any[];
  payments: any[];
  tasks: any[];
  teamMembers: any[];
  materials: any[];
}

export default function JobView({
  proforma,
  items: itemsProp,
  id,
  expenses: initialExpenses,
  visits: initialVisits,
  timeEntries: initialTimeEntries,
  invoices: initialInvoices,
  payments: initialPayments,
  tasks: initialTasks,
  teamMembers: initialTeamMembers,
  materials: initialMaterials
}: JobViewProps) {
  const router = useRouter();
  const [items, setItems] = React.useState(itemsProp);
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null);
  const [tempCost, setTempCost] = React.useState<string>('');
  const [isSavingCost, setIsSavingCost] = React.useState(false);
  const [showProfitability, setShowProfitability] = React.useState(true);
  const [expenses, setExpenses] = React.useState(initialExpenses);
  const [payments, setPayments] = React.useState(initialPayments);
  const [visits, setVisits] = React.useState(initialVisits);
  const [timeEntries, setTimeEntries] = React.useState(initialTimeEntries);
  const [tasks, setTasks] = React.useState(initialTasks);
  const [teamMembers, setTeamMembers] = React.useState(initialTeamMembers);
  const [materials, setMaterials] = React.useState(initialMaterials);
  const [invoices, setInvoices] = React.useState(initialInvoices);

  // Materials local state
  const [editingMaterialId, setEditingMaterialId] = React.useState<string | null>(null);
  const [tempMaterialQty, setTempMaterialQty] = React.useState<string>('');
  const [isSavingMaterialQty, setIsSavingMaterialQty] = React.useState(false);
  const [materialSearchTerm, setMaterialSearchTerm] = React.useState('');
  const [materialCurrentPage, setMaterialCurrentPage] = React.useState(1);
  const materialsPerPage = 10;

  const [isAddingExpense, setIsAddingExpense] = React.useState(false);
  const [isGeneratingMaterials, setIsGeneratingMaterials] = React.useState(false);
  const [aiMaterialPrompt, setAiMaterialPrompt] = React.useState('');
  const [isAddingMaterial, setIsAddingMaterial] = React.useState(false);
  const [isAddingMaterialManually, setIsAddingMaterialManually] = React.useState(false);

  const [isSearchingSodimac, setIsSearchingSodimac] = React.useState(false);
  const [sodimacQuery, setSodimacQuery] = React.useState('');
  const [sodimacResults, setSodimacResults] = React.useState<any[]>([]);
  const [isSodimacLoading, setIsSodimacLoading] = React.useState(false);
  const [searchStore, setSearchStore] = React.useState<'homedepot' | 'ace'>('homedepot');
  const [isScanningExpense, setIsScanningExpense] = React.useState(false);
  const [isRecordingPayment, setIsRecordingPayment] = React.useState(false);
  const [isAddingVisit, setIsAddingVisit] = React.useState(false);
  const [isAddingLabor, setIsAddingLabor] = React.useState(false);
  const [isAddingTask, setIsAddingTask] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<any>(null);
  const [isEmailingMaterials, setIsEmailingMaterials] = React.useState(false);
  const [isAddingLineItem, setIsAddingLineItem] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<any | null>(null);
  const [paymentToDelete, setPaymentToDelete] = React.useState<any | null>(null);
  const [expenseToDelete, setExpenseToDelete] = React.useState<any | null>(null);
  const [laborToDelete, setLaborToDelete] = React.useState<any | null>(null);
  const [taskToDelete, setTaskToDelete] = React.useState<any | null>(null);
  const [editingPayment, setEditingPayment] = React.useState<any | null>(null);
  const [editingLabor, setEditingLabor] = React.useState<any | null>(null);
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());
  const [adjustments, setAdjustments] = React.useState((proforma.adjustments || []) as any[]);
  const [isAddingInvoice, setIsAddingInvoice] = React.useState(false); // Deprecated
  const [editingInvoice, setEditingInvoice] = React.useState<any>(null); // Deprecated
  const [invoiceToDelete, setInvoiceToDelete] = React.useState<any>(null);
  const [billingEmailModal, setBillingEmailModal] = React.useState<{ type: 'invoice' | 'payment', data: any } | null>(null);
  const [isEditingAdjustments, setIsEditingAdjustments] = React.useState(false);
  const [isEditingDates, setIsEditingDates] = React.useState(false);
  const [tempStartDate, setTempStartDate] = React.useState(proforma.job_start_at || '');
  const [tempEndDate, setTempEndDate] = React.useState(proforma.job_end_at || '');
  const [isSavingDates, setIsSavingDates] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);
  const [qboIntegration, setQboIntegration] = React.useState<any>(null);

  // Signature state
  const [isSignatureModalOpen, setIsSignatureModalOpen] = React.useState(false);
  const [isSigningJob, setIsSigningJob] = React.useState(false);
  const [jobStatus, setJobStatus] = React.useState(proforma.status);
  const [hasSignature, setHasSignature] = React.useState(!!(proforma.client_signature_data || proforma.client_signed_name));
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);

  const handleCollectSignature = async (signatureData: string | null, signatureName: string | null) => {
    setIsSigningJob(true);
    try {
      const result = await approveProforma(id, signatureData || undefined, signatureName || undefined);
      if (result.success) {
        setHasSignature(true);
        setJobStatus('approved');
        setIsSignatureModalOpen(false);
        toast.success('Signature collected. Job approved!');
      } else {
        toast.error('Error saving signature');
      }
    } catch (err) {
      toast.error('Error saving signature');
    } finally {
      setIsSigningJob(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const { pdf: renderPdf } = await import('@react-pdf/renderer');
      const ProformaPDFModule = await import('@/lib/pdf/ProformaPDF');
      const ProformaPDFComponent = ProformaPDFModule.default;
      const blob = await renderPdf(
        <ProformaPDFComponent proforma={proforma} items={items} client={proforma.clients} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `job_${String(proforma.number || proforma.id.split('-')[0]).toUpperCase()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Error generating PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleEndJob = async () => {
    const { updateProformaStatus } = await import('./actions');
    const result = await updateProformaStatus(id, 'job_terminated');
    if (result.error) {
      toast.error('Error ending job');
    } else {
      setJobStatus('job_terminated');
      toast.success('Job ended');
      router.refresh();
    }
  };

  const toggleItemExpansion = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Task media
  const [uploadingForTask, setUploadingForTask] = React.useState<any | null>(null);
  const [taskMedia, setTaskMedia] = React.useState<Record<string, any[]>>({});
  const [isUploadingMedia, setIsUploadingMedia] = React.useState(false);
  const [mediaCaption, setMediaCaption] = React.useState('');

  // Expenses search and pagination state
  const [expenseSearchTerm, setExpenseSearchTerm] = React.useState('');
  const [expenseCurrentPage, setExpenseCurrentPage] = React.useState(1);
  const [selectedExpenseForEdit, setSelectedExpenseForEdit] = React.useState<any>(null);
  const [selectedFileUrl, setSelectedFileUrl] = React.useState<string | null>(null);
  const [itemPresets, setItemPresets] = React.useState<any[]>([]);
  const [syncingExpenseId, setSyncingExpenseId] = React.useState<string | null>(null);

  const itemsPerPage = 10;

  const supabase = createClient();

  React.useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        // Fetch QBO integration status
        const { data: integration } = await supabase
          .from('user_integrations')
          .select('*')
          .eq('user_id', user.id)
          .eq('service_name', 'quickbooks')
          .maybeSingle();
        setQboIntegration(integration);
      }
    };
    getUser();
  }, []);

  const syncTotalsToDatabase = async (currentItems: any[], currentAdjustments: any[] = adjustments) => {
    const newSubtotal = currentItems.reduce((acc, item) => {
      if (item.is_excluded) return acc;
      return acc + (item.total_price || 0);
    }, 0);

    const discountAdjustments = currentAdjustments.filter(a => a.type === 'discount');
    const taxAdjustments = currentAdjustments.filter(a => a.type === 'tax');

    const totalDiscount = discountAdjustments.reduce((acc, adj) => {
      const amount = adj.valueType === 'percentage' ? (newSubtotal * adj.value) / 100 : adj.value;
      return acc + amount;
    }, 0);

    const taxableAmount = newSubtotal - totalDiscount;
    const totalTax = taxAdjustments.reduce((acc, adj) => {
      const amount = adj.valueType === 'percentage' ? (taxableAmount * adj.value) / 100 : adj.value;
      return acc + amount;
    }, 0);

    const newTotal = newSubtotal - totalDiscount + totalTax;

    const { error } = await supabase
      .from('proformas')
      .update({
        subtotal: newSubtotal,
        total: newTotal,
        tax: totalTax,
        adjustments: currentAdjustments
      })
      .eq('id', id);

    if (error) {
      console.error('Error syncing totals to DB:', error);
    }
  };

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('proforma_items')
      .select('*')
      .eq('proforma_id', id)
      .order('sort_order', { ascending: true });

    if (!error) {
      setItems(data || []);
      // Sync totals to DB whenever items are fetched (e.g., after addition)
      if (data) syncTotalsToDatabase(data, adjustments);
    }
  };

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

  const fetchInvoices = async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('proforma_id', id)
      .order('created_at', { ascending: false });

    if (!error) {
      setInvoices(data || []);
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
      .select(`
        *,
        team_members (*)
      `)
      .eq('proforma_id', id)
      .order('date', { ascending: false });

    if (!error) {
      setTimeEntries(data || []);
    } else {
      console.error('Error fetching time entries:', error);
    }
  };
  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('job_tasks')
      .select(`
        *,
        team_members (*)
      `)
      .eq('proforma_id', id)
      .order('due_date', { ascending: true });

    if (!error) {
      setTasks(data || []);
    }
  };

  const fetchItemPresets = async () => {
    const { data, error } = await supabase
      .from('proforma_items')
      .select('description, details, unit_price, cost')
      .order('description', { ascending: true });

    if (!error && data) {
      // Group by description to get unique presets
      const unique = data.reduce((acc: any[], cur: any) => {
        if (!acc.find(item => item.description === cur.description)) {
          acc.push(cur);
        }
        return acc;
      }, []);
      setItemPresets(unique);
    }
  };

  const fetchTaskMedia = async (taskId: string) => {
    const res = await fetch(`/api/tasks/${taskId}/media`);
    if (res.ok) {
      const { media } = await res.json();
      setTaskMedia(prev => ({ ...prev, [taskId]: media || [] }));
    }
  };

  const handleOpenMediaUpload = async (task: any) => {
    setUploadingForTask(task);
    setMediaCaption('');
    await fetchTaskMedia(task.id);
  };

  const handleUploadTaskMedia = async (files: FileList | null) => {
    if (!files || files.length === 0 || !uploadingForTask) return;
    setIsUploadingMedia(true);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append('file', file);
        form.append('proforma_id', id);
        form.append('caption', mediaCaption);
        const res = await fetch(`/api/tasks/${uploadingForTask.id}/media`, {
          method: 'POST',
          body: form,
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Upload failed');
        }
      }
      toast.success('Media uploaded successfully');
      setMediaCaption('');
      await fetchTaskMedia(uploadingForTask.id);
    } catch (err: any) {
      toast.error(err.message || 'Error uploading media');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleSyncExpenseToQBO = async (expense: any) => {
    if (!user || !qboIntegration) {
      toast.error('QuickBooks integration not found');
      return;
    }

    if (!expense.qbo_vendor_id || !expense.qbo_account_id || !expense.qbo_bank_account_id) {
      toast.error('Please assign a QuickBooks Vendor, Category, and Bank Account first');
      setSelectedExpenseForEdit(expense);
      return;
    }

    setSyncingExpenseId(expense.id);
    try {
      const res = await syncExpenseToQuickBooks({
        expenseId: expense.id,
        proformaId: id,
        vendorRef: expense.qbo_vendor_id,
        bankAccountRef: expense.qbo_bank_account_id,
        expenseAccountRef: expense.qbo_account_id,
        userId: user.id
      });

      if (res.success) {
        toast.success('Expense synced to QuickBooks');
        fetchExpenses();
      } else {
        toast.error(res.error || 'Failed to sync expense');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error syncing to QuickBooks');
    } finally {
      setSyncingExpenseId(null);
    }
  };

  const fetchTeamMembers = async () => {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('name', { ascending: true });

    if (!error) {
      setTeamMembers(data || []);
    }
  };

  React.useEffect(() => {
    fetchItemPresets();
    fetchInvoices();

    // Track recently visited job
    try {
      const recentlyVisited = JSON.parse(localStorage.getItem('recentlyVisitedJobs') || '[]');
      const updated = [id, ...recentlyVisited.filter((viewedId: string) => viewedId !== id)].slice(0, 20);
      localStorage.setItem('recentlyVisitedJobs', JSON.stringify(updated));
    } catch (e) {
      console.error('Error tracking visited job:', e);
    }
  }, [id]);

  const handleStartEditing = (item: any) => {
    setEditingItemId(item.id);
    setTempCost((item.cost || 0).toString());
  };

  const handleCancelEditing = () => {
    setEditingItemId(null);
    setTempCost('');
  };

  const handleSaveCost = async (itemId: string) => {
    if (isSavingCost) return;
    setIsSavingCost(true);

    const newCost = parseFloat(tempCost) || 0;

    const { error } = await supabase
      .from('proforma_items')
      .update({ cost: newCost })
      .eq('id', itemId);

    if (error) {
      toast.error('Error updating cost');
    } else {
      setItems(prev => prev.map(item => item.id === itemId ? { ...item, cost: newCost } : item));
      toast.success('Cost updated');
      handleCancelEditing();
    }
    setIsSavingCost(false);
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const result = await deleteProformaItem(itemId, id);
      if (result.error) {
        toast.error(result.error);
      } else {
        setItems(prev => prev.filter(item => item.id !== itemId));
        toast.success('Item deleted');
        setItemToDelete(null);
      }
    } catch (err) {
      toast.error('Error deleting item');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, itemId: string) => {
    if (e.key === 'Enter') {
      handleSaveCost(itemId);
    } else if (e.key === 'Escape') {
      handleCancelEditing();
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId);

    if (error) {
      toast.error('Error deleting payment');
    } else {
      setPayments(prev => prev.filter(p => p.id !== paymentId));
      toast.success('Payment deleted');
      setPaymentToDelete(null);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const { error } = await supabase
      .from('job_expenses')
      .delete()
      .eq('id', expenseId);

    if (error) {
      toast.error('Error deleting expense');
    } else {
      setExpenses(prev => prev.filter(e => e.id !== expenseId));
      toast.success('Expense deleted');
      setExpenseToDelete(null);
    }
  };

  const handleDeleteVisit = async (visitId: string) => {
    const { error } = await supabase
      .from('job_visits')
      .delete()
      .eq('id', visitId);

    if (error) {
      toast.error('Error deleting visit');
    } else {
      setVisits(prev => prev.filter(v => v.id !== visitId));
      toast.success('Visit deleted');
    }
  };

  const handeDeleteLabor = async (laborId: string) => {
    const { error } = await supabase
      .from('job_time_entries')
      .delete()
      .eq('id', laborId);

    if (error) {
      toast.error('Error deleting labor');
    } else {
      setTimeEntries(prev => prev.filter(t => t.id !== laborId));
      toast.success('Labor deleted');
      setLaborToDelete(null);
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

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('job_tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      toast.error('Error deleting task');
    } else {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success('Task deleted');
      setTaskToDelete(null);
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    const { error } = await supabase
      .from('job_tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (error) {
      toast.error('Error al actualizar tarea');
    } else {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    }
  };

  const handleSaveDates = async () => {
    setIsSavingDates(true);
    try {
      const res = await updateJobDates(id, tempStartDate, tempEndDate);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Fechas actualizadas');
        setIsEditingDates(false);
        router.refresh();
      }
    } catch (err) {
      toast.error('Error al guardar fechas');
    } finally {
      setIsSavingDates(false);
    }
  };

  const handleGenerateMaterials = async () => {
    if (!aiMaterialPrompt.trim()) {
      toast.error('Ingrese una descripción para generar materiales.');
      return;
    }

    setIsGeneratingMaterials(true);
    try {
      const response = await fetch('/api/materials/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName: proforma.project_name,
          projectDescription: aiMaterialPrompt
        }),
      });

      if (!response.ok) {
        throw new Error('Error al generar materiales');
      }

      const data = await response.json();

      if (data.materials && data.materials.length > 0) {
        // Save to Supabase
        const materialsToInsert = data.materials.map((m: any) => ({
          proforma_id: id,
          name: m.name,
          description: m.description,
          quantity: m.quantity || 1,
          unit_price: m.unit_price || 0,
          total_price: (m.quantity || 1) * (m.unit_price || 0),
          photo_url: null,
          product_url: null
        }));

        const { data: inserted, error } = await supabase
          .from('job_materials')
          .insert(materialsToInsert)
          .select();

        if (error) throw error;

        setMaterials(prev => [...(inserted || []), ...prev]);
        toast.success('Materiales generados y agregados exitosamente.');
        setIsAddingMaterial(false);
        setAiMaterialPrompt('');
      } else {
        toast.error('No se generaron materiales.');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error de conexión');
    } finally {
      setIsGeneratingMaterials(false);
    }
  };

  const handleSearchSodimac = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sodimacQuery.trim()) return;

    if (searchStore === 'ace') {
      return handleSearchAce(e);
    }

    setIsSodimacLoading(true);
    setSodimacResults([]);
    try {
      const response = await fetch(`/api/materials/search?q=${encodeURIComponent(sodimacQuery)}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Error al buscar en Home Depot');
      setSodimacResults(data.materials || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSodimacLoading(false);
    }
  };

  const handleSearchAce = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sodimacQuery.trim()) return;

    setIsSodimacLoading(true);
    setSodimacResults([]);
    try {
      const response = await fetch(`/api/materials/searcha?q=${encodeURIComponent(sodimacQuery)}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Error al buscar en Ace Hardware');
      setSodimacResults(data.materials || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSodimacLoading(false);
    }
  };

  const handleAddSodimacMaterial = async (mat: any) => {
    try {
      const { data: inserted, error } = await supabase
        .from('job_materials')
        .insert([{
          proforma_id: id,
          name: mat.name,
          description: mat.description,
          quantity: mat.quantity || 1,
          unit_price: mat.unit_price || 0,
          total_price: (mat.quantity || 1) * (mat.unit_price || 0),
          photo_url: mat.photo_url || null,
          product_url: mat.product_url || null
        }])
        .select();

      if (error) throw error;

      setMaterials(prev => [...(inserted || []), ...prev]);
      toast.success('Material de Sodimac añadido exitosamente.');
    } catch (error: any) {
      console.error(error);
      toast.error('Error al guardar el material de Sodimac');
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    const { error } = await supabase
      .from('job_materials')
      .delete()
      .eq('id', materialId);

    if (error) {
      toast.error('Error deleting material');
    } else {
      setMaterials(prev => prev.filter(m => m.id !== materialId));
      toast.success('Material deleted');
    }
  };

  const handleToggleMaterialStatus = async (materialId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('job_materials')
      .update({ is_purchased: !currentStatus })
      .eq('id', materialId);

    if (error) {
      toast.error('Error al actualizar material');
    } else {
      setMaterials(prev => prev.map(m => m.id === materialId ? { ...m, is_purchased: !currentStatus } : m));
    }
  };

  const handleStartEditingMaterial = (mat: any) => {
    setEditingMaterialId(mat.id);
    setTempMaterialQty((mat.quantity || 1).toString());
  };

  const handleCancelEditingMaterial = () => {
    setEditingMaterialId(null);
    setTempMaterialQty('');
  };

  const handleSaveMaterialQty = async (materialId: string) => {
    if (isSavingMaterialQty) return;
    setIsSavingMaterialQty(true);

    const newQty = parseFloat(tempMaterialQty) || 1;
    const material = materials.find(m => m.id === materialId);
    if (!material) {
      setIsSavingMaterialQty(false);
      return;
    }
    const newTotalPrice = newQty * (material.unit_price || 0);

    const { error } = await supabase
      .from('job_materials')
      .update({ quantity: newQty, total_price: newTotalPrice })
      .eq('id', materialId);

    if (error) {
      toast.error('Error al actualizar cantidad');
    } else {
      setMaterials(prev => prev.map(m => m.id === materialId ? { ...m, quantity: newQty, total_price: newTotalPrice } : m));
      toast.success('Cantidad actualizada');
      handleCancelEditingMaterial();
    }
    setIsSavingMaterialQty(false);
  };

  const handleMaterialKeyDown = (e: React.KeyboardEvent, materialId: string) => {
    if (e.key === 'Enter') {
      handleSaveMaterialQty(materialId);
    } else if (e.key === 'Escape') {
      handleCancelEditingMaterial();
    }
  };

  // Totals calculations
  // Filtering and Pagination logic

  const filteredMaterials = (materials || []).filter(mat =>
    (mat.name?.toLowerCase().includes(materialSearchTerm.toLowerCase()) || '') ||
    (mat.description?.toLowerCase().includes(materialSearchTerm.toLowerCase()) || '')
  );

  const totalMaterialPages = Math.ceil(filteredMaterials.length / materialsPerPage);
  const paginatedMaterials = filteredMaterials.slice(
    (materialCurrentPage - 1) * materialsPerPage,
    materialCurrentPage * materialsPerPage
  );

  const handleMaterialSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaterialSearchTerm(e.target.value);
    setMaterialCurrentPage(1);
  };

  const totalMaterialsCost = (materials || []).reduce((acc, mat) => acc + (mat.total_price || 0), 0);


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

  const subtotal = items.reduce((acc, item) => {
    if (item.is_excluded) return acc;
    return acc + (item.total_price || 0);
  }, 0);

  const discountAdjustments = adjustments.filter(adj => adj.type === 'discount');
  const taxAdjustments = adjustments.filter(adj => adj.type === 'tax');

  const totalDiscount = discountAdjustments.reduce((acc, adj) => {
    const amount = adj.valueType === 'percentage' ? (subtotal * adj.value) / 100 : adj.value;
    return acc + amount;
  }, 0);

  const taxableAmount = subtotal - totalDiscount;
  const totalTax = taxAdjustments.reduce((acc, adj) => {
    const amount = adj.valueType === 'percentage' ? (taxableAmount * adj.value) / 100 : adj.value;
    return acc + amount;
  }, 0);

  const totalInvoiced = subtotal - totalDiscount + totalTax;
  const totalCost = items.reduce((acc, item) => acc + (item.cost || 0) * item.quantity, 0);
  const totalLaborCost = timeEntries.reduce((acc, entry) => acc + (Number(entry.total_cost) || 0), 0);
  const totalExpenses = expenses.reduce((acc, exp) => acc + Number(exp.amount), 0);

  const totalProfit = totalInvoiced - totalCost - totalLaborCost - totalExpenses;
  const profitMargin = totalInvoiced > 0 ? (totalProfit / totalInvoiced) * 100 : 0;

  const handleViewInvoicePDF = async (invoice: any) => {
    try {
      const blob = await pdf(
        <InvoicePDF
          invoice={invoice}
          proforma={proforma}
          client={proforma.clients}
          user={proforma.users}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error generating Invoice PDF:', error);
      toast.error('Error generating of PDF of Invoice');
    }
  };

  const handleViewPaymentPDF = async (payment: any) => {
    try {
      const blob = await pdf(
        <PaymentPDF
          payment={payment}
          proforma={proforma}
          client={proforma.clients}
          user={proforma.users}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error generating Payment PDF:', error);
      toast.error('Error al generar el recibo de pago');
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      const result = await deleteInvoice(invoiceId, id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Invoice deleted');
        setInvoiceToDelete(null);
        fetchInvoices();
      }
    } catch (error) {
      toast.error('Error deleting invoice');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-500">

      {/* Action Bar */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
        </div>
        <div className="flex gap-2 items-center flex-wrap">

          {/* Collect Signature — only when job is active and unsigned */}
          {jobStatus === 'job' && (
            hasSignature ? (
              <div className="flex items-center gap-2 px-4 h-9 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700">
                <Check className="h-3.5 w-3.5" />
                Signed
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => setIsSignatureModalOpen(true)}
                className="h-9 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 rounded-xl"
              >
                <PenLine className="h-4 w-4" />
                <span className="hidden sm:inline">Collect Signature</span>
                <span className="sm:hidden">Sign</span>
              </Button>
            )
          )}

          {/* Download PDF */}
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span className="hidden sm:inline">Download PDF</span>
          </Button>

          {/* Create Invoice */}
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2"
            onClick={() => router.push(`/clients/${proforma.client_id}/invoices/new?proformaId=${id}`)}
          >
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Create Invoice</span>
          </Button>

          {/* History */}
          <Dialog>
            <DialogTrigger render={
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <HistoryIcon className="h-4 w-4 text-muted-foreground" />
                <span className="hidden sm:inline">History</span>
              </Button>
            } />
            <DialogContent className="sm:max-w-[540px]">
              <DialogHeader className="mb-4">
                <DialogTitle>Job History</DialogTitle>
                <DialogDescription>
                  Track all status changes made to this job.
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto pr-2 pb-4">
                <StatusHistory proformaId={id} />
              </div>
            </DialogContent>
          </Dialog>

          {/* End Job */}
          {jobStatus === 'job' && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={handleEndJob}
            >
              <XCircle className="h-4 w-4" />
              <span className="hidden sm:inline">End Job</span>
            </Button>
          )}
        </div>
      </div>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onConfirm={handleCollectSignature}
        isLoading={isSigningJob}
      />

      {/* Main Content Area */}
      <div className="space-y-6">

        {/* Header Summary */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8 bg-card p-6 md:p-8 border border-border/40 rounded-2xl shadow-sm">
          <div className="flex flex-col sm:flex-row items-start gap-5 w-full">
            <div className="p-4 bg-primary/10 text-primary rounded-2xl shrink-0">
              <Briefcase className="h-8 w-8" />
            </div>
            <div className="space-y-2 w-full">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn(
                  "text-[10px] font-black tracking-widest uppercase rounded-md px-2",
                  proforma.status === 'job_terminated'
                    ? "bg-slate-500/10 text-slate-700 border-slate-500/20"
                    : "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                )}>
                  {proforma.status === 'job_terminated' ? 'TERMINATED' : 'ACTIVE JOB'}
                </Badge>
                <span className="text-muted-foreground text-[10px] font-black uppercase tracking-widest opacity-60">REF: {String(proforma.number || proforma.id.split('-')[0]).toUpperCase()}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight">{proforma.project_name} - #{proforma.number}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-2 text-sm text-muted-foreground font-medium">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-3.5 w-3.5 text-primary/60" />
                  <Link href={`/clients/${proforma.clients?.id}`} className="hover:text-primary hover:underline transition-colors">
                    {proforma.clients?.company_name || proforma.clients?.name || 'No name provided'}
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-primary/60" />
                  <span className="truncate max-w-[200px]">{proforma.clients?.street_1 || proforma.clients?.address || 'No address provided'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-8 sm:grid-cols-8 lg:grid-cols-8 gap-6 w-full lg:w-auto pt-6 lg:pt-0 border-t lg:border-t-0 lg:border-l border-border/40 lg:pl-8">
            <div className="space-y-1 col-span-4">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Job Type</p>
              <p className="text-sm font-bold">One-off job</p>
            </div>
            <div className="space-y-1 relative group col-span-4">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 flex items-center gap-2">
                Started On
                {!isEditingDates && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setIsEditingDates(true)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </p>
              {isEditingDates ? (
                <Input
                  type="date"
                  value={tempStartDate ? tempStartDate.split('T')[0] : ''}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  className="h-8 text-xs p-1 mt-1"
                />
              ) : (
                <p className="text-sm font-bold text-foreground">{proforma.job_start_at ? format(new Date(proforma.job_start_at), 'MMM d, yyyy') : '-'}</p>
              )}
            </div>
            <div className="space-y-1 relative group col-span-4">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Ends On</p>
              {isEditingDates ? (
                <Input
                  type="date"
                  value={tempEndDate ? tempEndDate.split('T')[0] : ''}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  className="h-8 text-xs p-1 mt-1"
                />
              ) : (
                <p className="text-sm font-bold text-foreground">{proforma.job_end_at ? format(new Date(proforma.job_end_at), 'MMM d, yyyy') : '-'}</p>
              )}
            </div>
            <div className="space-y-1 col-span-2">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Original Quote</p>
              <p className="text-sm font-bold text-primary">#{String(proforma.number || proforma.id.split('-')[0]).toUpperCase()}</p>
            </div>
            {isEditingDates && (
              <div className="col-span-2 sm:col-span-4 lg:col-span-2 mt-2 flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs rounded-lg px-3"
                  onClick={() => {
                    setIsEditingDates(false);
                    setTempStartDate(proforma.job_start_at || '');
                    setTempEndDate(proforma.job_end_at || '');
                  }}
                  disabled={isSavingDates}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs rounded-lg px-4 font-bold"
                  onClick={handleSaveDates}
                  disabled={isSavingDates}
                >
                  {isSavingDates ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />} Save
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Profitability Panel */}
        <div className="bg-muted/10 border border-border/40 overflow-hidden">
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
            <div className="p-6 md:p-8 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
                <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                  <div className="relative h-28 w-28 flex items-center justify-center shrink-0">
                    <svg className="h-full w-full transform -rotate-90">
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        fill="transparent"
                        stroke="currentColor"
                        className="text-border/40"
                        strokeWidth="10"
                      />
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        fill="transparent"
                        stroke="currentColor"
                        className="text-primary transition-all duration-1000 ease-in-out"
                        strokeWidth="10"
                        strokeDasharray={`${(profitMargin / 100) * 301.5} 301.5`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-black">{profitMargin.toFixed(1)}%</span>
                      {/*<span className="text-[8px] font-black uppercase tracking-tighter opacity-40">Margin</span>*/}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tight">{profitMargin.toFixed(2)}%</h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Estimated Profit Margin</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-end gap-x-10 gap-y-6 w-full">
                  <div className="text-center md:text-left space-y-1 min-w-[100px]">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Total price</p>
                    <p className="text-xl font-bold ">${totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-center md:text-left space-y-1 min-w-[100px]">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 flex items-center justify-center md:justify-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Items Cost
                    </p>
                    <p className="text-xl font-bold  italic text-muted-foreground"><span className="text-muted-foreground/30 px-1">-</span>${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-center md:text-left space-y-1 min-w-[100px]">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 flex items-center justify-center md:justify-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> Labor
                    </p>
                    <p className="text-xl font-bold  italic text-muted-foreground"><span className="text-muted-foreground/30 px-1">-</span>${totalLaborCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-center md:text-left space-y-1 min-w-[100px]">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 flex items-center justify-center md:justify-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Expenses
                    </p>
                    <p className="text-xl font-bold  italic text-muted-foreground"><span className="text-muted-foreground/30 px-1">-</span>${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="h-12 w-px bg-border/40 hidden xl:block" />
                  <div className="text-center md:text-left space-y-1 min-w-[120px] bg-emerald-50/50 p-3 rounded-2xl border border-emerald-500/10">
                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center justify-center md:justify-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Profit
                    </p>
                    <p className="text-xl font-black  text-emerald-600">${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="items" className="space-y-6">
          <TabsList className="bg-muted/20 p-1 h-auto grid grid-cols-2 sm:flex items-center gap-1 border border-border/40 rounded-2xl overflow-hidden shadow-inner">
            <TabsTrigger value="items" className="data-[state=active]:bg-background data-[state=active]:shadow-md py-2.5 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">
              Job Items
            </TabsTrigger>
            <TabsTrigger value="work" className="data-[state=active]:bg-background data-[state=active]:shadow-md py-2.5 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">
              Progress
            </TabsTrigger>
            <TabsTrigger value="finance" className="data-[state=active]:bg-background data-[state=active]:shadow-md py-2.5 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">
              Financials
            </TabsTrigger>
            <TabsTrigger value="materials" className="data-[state=active]:bg-background data-[state=active]:shadow-md py-2.5 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">
              Materials
            </TabsTrigger>
          </TabsList>
          {/* Tab: Items */}
          <TabsContent value="items" className="space-y-6 mt-0">
            <Card className="border-border/40 overflow-hidden rounded-xl shadow-none">
              <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/5">
                <CardTitle className="text-lg font-bold">Line Items</CardTitle>
                <Button size="sm" className="h-8 gap-1 font-bold text-primary-foreground transition-all hover:-translate-y-0.5" onClick={() => setIsAddingLineItem(true)}>
                  <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Line Item</span>
                </Button>
              </CardHeader>

              <CardContent className="p-0">
                {/* VISTA DESKTOP: Se mantiene la tabla pero se oculta en mobile */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/10 text-muted-foreground border-b border-border/40 text-[10px] font-bold uppercase tracking-widest">
                      <tr>
                        <th className="px-4 py-3 text-left w-10"></th>
                        <th className="px-6 py-3 text-left">Product / Service</th>
                        <th className="px-4 py-3 text-center w-24">Image</th>
                        <th className="px-6 py-3 text-center w-24">Qty</th>
                        <th className="px-6 py-3 text-right">Cost</th>
                        <th className="px-6 py-3 text-right">Price</th>
                        <th className="px-6 py-3 text-right">Total</th>
                        <th className="px-4 py-3 text-center w-10">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {items.map((item) => (
                        <tr
                          key={item.id}
                          className={cn(
                            "hover:bg-muted/5 transition-colors cursor-pointer align-top",
                            editingItemId === item.id && "bg-primary/5",
                            item.is_optional && "opacity-60 bg-muted/5"
                          )}

                        >
                          <td className="px-4 py-5 text-center">
                            <Checkbox checked={!item.is_optional} className="opacity-100 cursor-default" />
                          </td>
                          <td className="px-6 py-4 max-w-md">
                            <p className="font-bold text-foreground text-base leading-tight">{item.description}</p>
                            {item.details && (
                              <div className="mt-1.5">
                                <p className={cn(
                                  "text-sm text-muted-foreground leading-relaxed transition-all duration-300 whitespace-pre-wrap",
                                  !expandedItems.has(item.id) && "line-clamp-2"
                                )}>
                                  {item.details}
                                </p>
                                {item.details.length > 100 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleItemExpansion(item.id);
                                    }}
                                    className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80 mt-1 flex items-center gap-1 group"
                                  >
                                    {expandedItems.has(item.id) ? (
                                      <>view less <ChevronUp className="h-3 w-3 transition-transform group-hover:-translate-y-0.5" /></>
                                    ) : (
                                      <>view more <ChevronDown className="h-3 w-3 transition-transform group-hover:translate-y-0.5" /></>
                                    )}
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {item.photo_url ? (
                              <LineItemImage
                                src={item.photo_url}
                                alt={item.description}
                                className="h-12 w-12 mx-auto"
                              />
                            ) : (
                              <div className="h-12 w-12 mx-auto bg-muted/10 rounded-lg border border-dashed border-border/50 flex items-center justify-center text-muted-foreground/30">
                                <ZoomIn className="h-4 w-4" />
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center font-medium">{item.quantity}</td>
                          <td className="px-6 py-4 text-right tabular-nums" onClick={() => editingItemId !== item.id && handleStartEditing(item)}>
                            {editingItemId === item.id ? (
                              <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                <div className="relative">
                                  <span className="absolute left-2 top-1.5 text-muted-foreground text-xs">$</span>
                                  <Input
                                    autoFocus
                                    className="w-24 h-8 text-right pl-5 text-sm font-bold"
                                    value={tempCost}
                                    onChange={(e) => setTempCost(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, item.id)}
                                    type="number"
                                    step="1"
                                  />
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                    onClick={() => handleSaveCost(item.id)}
                                    disabled={isSavingCost}
                                  >
                                    {isSavingCost ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={handleCancelEditing}
                                    disabled={isSavingCost}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground font-medium">
                                ${(item.cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right tabular-nums text-muted-foreground">${item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td className={cn("px-6 py-4 text-right tabular-nums font-bold", item.is_optional && "line-through italic text-muted-foreground")}>
                            ${item.total_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                setItemToDelete(item);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {proforma.notes && (
                        <tr className="bg-amber-50/20 border-t border-border/40">
                          <td colSpan={2} className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-muted-foreground align-top">
                            Notes / Terms
                          </td>
                          <td colSpan={5} className="px-6 py-4 text-sm text-foreground italic whitespace-pre-wrap">
                            {proforma.notes}
                          </td>
                          <td />
                        </tr>
                      )}
                      <tr className="bg-muted/5 font-bold border-t border-border/40">
                        <td colSpan={3} className="px-6 py-4 text-left">
                          <Button variant="outline" size="sm" className="h-8 gap-1 font-bold" onClick={() => setIsAddingLineItem(true)}>
                            <Plus className="h-3 w-3" /> New Line Item
                          </Button>
                        </td>
                        <td className="px-6 py-4" />
                        <td className="px-6 py-4 text-right text-[10px] uppercase tracking-widest text-muted-foreground">Subtotal</td>
                        <td className="px-6 py-4" />
                        <td className="px-6 py-4 text-right tabular-nums">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4" />
                      </tr>
                      {discountAdjustments.map((adj, idx) => {
                        const amount = adj.valueType === 'percentage' ? (subtotal * adj.value) / 100 : adj.value;
                        return (
                          <tr key={`discount-${idx}`} className="italic text-xs">
                            <td colSpan={4} />
                            <td className="px-6 py-2 text-right uppercase tracking-tighter font-black">
                              {adj.label} {adj.valueType === 'percentage' ? `(${adj.value}%)` : ''}
                            </td>
                            <td className="px-6 py-2" />
                            <td className="px-6 py-2 text-right tabular-nums">-${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="px-6 py-2" />
                          </tr>
                        );
                      })}
                      {taxAdjustments.map((adj, idx) => {
                        const amount = adj.valueType === 'percentage' ? (taxableAmount * adj.value) / 100 : adj.value;
                        return (
                          <tr key={`tax-${idx}`} className="bg-muted/5 font-bold border-t border-border/40">
                            <td colSpan={4} />
                            <td className="px-6 py-4 text-right text-[10px] uppercase tracking-widest text-muted-foreground">
                              {adj.label} {adj.valueType === 'percentage' ? `(${adj.value}%)` : ''}
                            </td>
                            <td className="px-6 py-4" />
                            <td className="px-6 py-4 text-right tabular-nums">+${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="px-6 py-4" />
                          </tr>
                        );
                      })}
                      <tr className="bg-emerald-50/30 font-bold border-t border-emerald-500/20">
                        <td colSpan={2} className="px-6 py-4 text-left">
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-black tracking-widest text-primary hover:bg-primary/5" onClick={() => setIsEditingAdjustments(true)}>
                            <Tag className="h-3 w-3 mr-1" /> Manage Adjustments
                          </Button>
                        </td>
                        <td colSpan={2} />
                        <td className="px-6 py-4 text-right text-[10px] uppercase tracking-widest">Total Job Value</td>
                        <td className="px-6 py-4" />
                        <td className="px-6 py-4 text-right tabular-nums text-xl">${totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4" />
                      </tr>
                    </tbody>
                  </table>
                </div>                {/* VISTA MOBILE: Se convierte en lista de cards con diseño premium */}
                <div className="md:hidden space-y-4 p-4 bg-muted/5">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "bg-card border border-border/40 rounded-[2rem] shadow-sm overflow-hidden active:scale-[0.98] transition-all",
                        item.is_optional && "opacity-60 bg-muted/5"
                      )}
                      onClick={() => handleStartEditing(item)}
                    >
                      <div className="p-5 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-4">
                            <div className="mt-1">
                              <Checkbox checked={!item.is_optional} className="h-5 w-5 rounded-md" />
                            </div>
                            <div className="space-y-1">
                              <h3 className="font-bold text-base text-foreground leading-tight">{item.description}</h3>
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                                Unit Price: ${item.unit_price.toLocaleString('en-US')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={cn(
                              "text-lg font-black text-primary leading-none",
                              item.is_optional && "line-through italic text-muted-foreground"
                            )}>
                              ${item.total_price.toLocaleString('en-US')}
                            </p>
                            <p className="text-[9px] font-black text-muted-foreground uppercase mt-1 tracking-widest">Total</p>
                          </div>
                        </div>

                        {item.details && (
                          <div className="bg-muted/30 p-3 rounded-2xl">
                            <p className={cn(
                              "text-xs text-muted-foreground leading-relaxed transition-all",
                              !expandedItems.has(item.id) && "line-clamp-2"
                            )}>
                              {item.details}
                            </p>
                            {item.details.length > 80 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleItemExpansion(item.id);
                                }}
                                className="text-[9px] font-black uppercase tracking-widest text-primary mt-2 flex items-center gap-1"
                              >
                                {expandedItems.has(item.id) ? 'View Less' : 'View More'}
                                {expandedItems.has(item.id) ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </button>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {item.photo_url ? (
                              <LineItemImage
                                src={item.photo_url}
                                alt={item.description}
                                className="h-12 w-12 rounded-xl object-cover border border-border/40"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-xl bg-muted/20 border border-dashed border-border/40 flex items-center justify-center text-muted-foreground/30">
                                <Plus className="h-4 w-4" />
                              </div>
                            )}
                            <div className="bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/10">
                              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Qty: {item.quantity}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right mr-2">
                              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60 leading-none mb-1">Current Cost</p>
                              <p className="text-sm font-bold text-foreground leading-none">${(item.cost || 0).toLocaleString('en-US')}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-2xl text-red-600 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                setItemToDelete(item);
                              }}
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer de Totales resumido para mobile */}
                <div className="p-4 bg-muted/5 border-t border-border/40 space-y-4 md:hidden">
                  {proforma.notes && (
                    <div className="p-3 bg-amber-50/30 rounded-lg border border-amber-200/50">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">Notes</p>
                      <p className="text-xs text-foreground italic whitespace-pre-wrap">{proforma.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Materials */}
          <TabsContent value="materials" className="space-y-6 mt-0">
            <Card className="border-border/40 overflow-hidden rounded-xl shadow-none flex flex-col">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between py-4 bg-muted/5 gap-4 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-bold">Materials</CardTitle>
                </div>
                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button size="sm" className="h-8 gap-1 font-bold text-primary-foreground transition-all hover:-translate-y-0.5" />}>
                      <Plus className="h-4 w-4" /> Add Materials
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem className="text-xs gap-2 py-2" onClick={() => setIsEmailingMaterials(true)}>
                        <Mail className="h-4 w-4 text-blue-600" /> Send Email List
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-xs gap-2 py-2" onClick={() => setIsSearchingSodimac(true)}>
                        <Search className="h-4 w-4 text-primary" /> Search Products
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-xs gap-2 py-2" onClick={() => setIsAddingMaterial(true)}>
                        <TrendingUp className="h-4 w-4 text-primary" /> AI Auto-Gen
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-xs gap-2 py-2" onClick={() => setIsAddingMaterialManually(true)}>
                        <Pencil className="h-4 w-4 text-primary" /> Manual Add
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col">
                {/* Materials Search Bar */}
                <div className="p-4 border-b border-border/40 bg-card">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search materials..."
                      className="pl-9 h-9 text-xs"
                      value={materialSearchTerm}
                      onChange={handleMaterialSearchChange}
                    />
                  </div>
                </div>

                {paginatedMaterials && paginatedMaterials.length > 0 ? (
                  <>
                    {/* VISTA DESKTOP: Tabla de Materiales */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/10 text-muted-foreground border-b border-border/40 text-[10px] font-black uppercase tracking-widest">
                          <tr>
                            <th className="px-4 py-3 text-left w-10">Done</th>
                            <th className="px-4 py-3 text-center w-16">Img</th>
                            <th className="px-6 py-3 text-left">Material</th>
                            <th className="px-6 py-3 text-center w-32 border-x border-emerald-500/30">Qty</th>
                            <th className="px-6 py-3 text-right">Unit Price</th>
                            <th className="px-6 py-3 text-right">Total</th>
                            <th className="px-4 py-3 text-center w-10">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {paginatedMaterials.map((mat: any) => (
                            <tr
                              key={mat.id}
                              className={cn("hover:bg-muted/5 transition-colors align-top cursor-pointer", mat.is_purchased && "opacity-60 bg-muted/5", editingMaterialId === mat.id && "bg-primary/5")}

                            >
                              <td className="px-4 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={mat.is_purchased}
                                  onCheckedChange={() => handleToggleMaterialStatus(mat.id, mat.is_purchased)}
                                />
                              </td>
                              <td className="px-4 py-4 text-center">
                                {mat.photo_url ? (
                                  <img src={mat.photo_url} alt={mat.name} className="h-10 w-10 object-cover rounded-md mx-auto border border-border/50" />
                                ) : (
                                  <div className="h-10 w-10 mx-auto bg-muted/10 rounded-md border border-dashed border-border/50 flex items-center justify-center text-muted-foreground/30">
                                    <ListTodo className="h-4 w-4" />
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {mat.product_url ? (
                                  <a href={mat.product_url} target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                                    {mat.name}
                                  </a>
                                ) : (
                                  <p className="font-bold text-foreground">{mat.name}</p>
                                )}
                                {mat.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{mat.description}</p>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center bg-emerald-50/20 border-x border-emerald-500/10 hover:bg-emerald-50/50 transition-colors cursor-text" onClick={() => editingMaterialId !== mat.id && handleStartEditingMaterial(mat)}>
                                {editingMaterialId === mat.id ? (
                                  <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    <Input
                                      autoFocus
                                      className="w-16 h-8 text-center text-sm font-bold"
                                      value={tempMaterialQty}
                                      onChange={(e) => setTempMaterialQty(e.target.value)}
                                      onKeyDown={(e) => handleMaterialKeyDown(e, mat.id)}
                                      type="number"
                                      step="0.01"
                                    />
                                    <div className="flex flex-col gap-0.5 ml-1">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-4 w-4 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full"
                                        onClick={() => handleSaveMaterialQty(mat.id)}
                                        disabled={isSavingMaterialQty}
                                      >
                                        {isSavingMaterialQty ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-4 w-4 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                                        onClick={handleCancelEditingMaterial}
                                        disabled={isSavingMaterialQty}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="font-bold text-emerald-700 border-b border-dashed border-emerald-600/30 pb-0.5">
                                    {mat.quantity}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right tabular-nums text-muted-foreground">${(mat.unit_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                              <td className={cn("px-6 py-4 text-right tabular-nums font-bold", mat.is_purchased && "line-through italic text-muted-foreground")}>
                                ${(mat.total_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-4 text-center">
                                {!mat.is_purchased && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteMaterial(mat.id);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                          {/* Total Materials Footer inside table */}
                          <tr className="bg-muted/5 font-bold border-t border-border/40">
                            <td colSpan={5} className="px-6 py-4 text-right text-[10px] uppercase tracking-widest text-muted-foreground">
                              Total Materials
                            </td>
                            <td className="px-6 py-4 text-right tabular-nums text-emerald-600 text-lg">
                              ${totalMaterialsCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td />
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* VISTA MOBILE: Cards de Materiales */}
                    <div className="md:hidden divide-y divide-border/20">
                      {paginatedMaterials.map((mat: any) => (
                        <div
                          key={mat.id}
                          className={cn(
                            "p-5 space-y-4 active:bg-muted/5 transition-colors",
                            mat.is_purchased && "opacity-60 bg-muted/5"
                          )}
                          onClick={() => editingMaterialId !== mat.id && handleStartEditingMaterial(mat)}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex gap-4">
                              <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={mat.is_purchased}
                                  onCheckedChange={() => handleToggleMaterialStatus(mat.id, mat.is_purchased)}
                                  className="h-5 w-5 rounded-md"
                                />
                              </div>
                              <div className="min-w-0">
                                {mat.product_url ? (
                                  <a href={mat.product_url} target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-600 hover:underline leading-tight block truncate max-w-[180px]">
                                    {mat.name}
                                  </a>
                                ) : (
                                  <p className="font-bold text-foreground leading-tight truncate max-w-[180px]">{mat.name}</p>
                                )}
                                {mat.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{mat.description}</p>}
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2 opacity-60">
                                  Unit: ${(mat.unit_price || 0).toLocaleString('en-US')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={cn("text-base font-black text-emerald-600 leading-none", mat.is_purchased && "line-through italic text-muted-foreground")}>
                                ${(mat.total_price || 0).toLocaleString('en-US')}
                              </p>
                              <div className="bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 mt-2">
                                <p className="text-[10px] font-black text-emerald-700 leading-none">Qty: {mat.quantity}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {mat.photo_url ? (
                                <img src={mat.photo_url} className="h-10 w-10 rounded-xl object-cover border" />
                              ) : (
                                <div className="h-10 w-10 rounded-xl bg-muted/20 border border-dashed flex items-center justify-center text-muted-foreground/30">
                                  <ListTodo className="h-4 w-4" />
                                </div>
                              )}
                              <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">
                                {mat.is_purchased ? 'Purchased' : 'Pending'}
                              </span>
                            </div>
                            {!mat.is_purchased && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-2xl text-red-600 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMaterial(mat.id);
                                }}
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Summary for mobile */}
                      <div className="p-5 bg-emerald-50/30 border-y border-emerald-500/10 flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Total Materials Value</span>
                        <span className="text-xl font-black text-emerald-600">${totalMaterialsCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    {/* Materials Pagination Controls */}
                    {totalMaterialPages > 1 && (
                      <div className="p-4 border-t border-border/40 flex items-center justify-between bg-card mt-auto">
                        <p className="text-[10px] text-muted-foreground">
                          Showing {(materialCurrentPage - 1) * materialsPerPage + 1} - {Math.min(materialCurrentPage * materialsPerPage, filteredMaterials.length)} of {filteredMaterials.length}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={materialCurrentPage === 1}
                            onClick={() => setMaterialCurrentPage(prev => prev - 1)}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <div className="flex items-center gap-1.5 px-2">
                            <span className="text-xs font-bold text-foreground">{materialCurrentPage}</span>
                            <span className="text-[10px] text-muted-foreground">/</span>
                            <span className="text-xs text-muted-foreground">{totalMaterialPages}</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={materialCurrentPage === totalMaterialPages}
                            onClick={() => setMaterialCurrentPage(prev => prev + 1)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-8 text-center flex flex-col items-center justify-center opacity-60">
                    <ListTodo className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">
                      {materialSearchTerm ? 'No materials found matching your search' : 'No materials registered.'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Auto-generate a list using AI based on Home Depot prices.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Work Progress */}
          <TabsContent value="work" className="space-y-6 mt-0">
            {/* Work Progress Photos Section */}
            <WorkProgressSection proformaId={proforma.id} proformaName={proforma.project_name} />

            {/* Tasks Section */}
            <Card className="border-border/40 overflow-hidden rounded-xl shadow-none mt-6">
              <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/5 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-bold">Tasks</CardTitle>
                </div>
                <Button size="sm" className="h-8 gap-1 font-bold text-primary-foreground transition-all hover:-translate-y-0.5" onClick={() => setIsAddingTask(true)}>
                  <Plus className="h-4 w-4" /> New Task
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {tasks.length > 0 ? (
                  <>
                    {/* VISTA DESKTOP: Tabla de Tareas */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/10 text-muted-foreground border-b border-border/40">
                          <tr>
                            <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-left w-10">Done</th>
                            <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-left">Task Description</th>
                            <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-left">Associate</th>
                            <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-left">Due Date</th>
                            <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-left">Assigned To</th>
                            <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {tasks.map(task => (
                            <tr key={task.id} className="hover:bg-muted/5 transition-colors group">
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => handleToggleTaskStatus(task.id, task.status)}
                                  className={cn(
                                    "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                    task.status === 'completed'
                                      ? "bg-emerald-500 border-emerald-500 text-white"
                                      : "border-muted-foreground/30 hover:border-emerald-500"
                                  )}
                                >
                                  {task.status === 'completed' && <CheckCircle className="h-4 w-4" />}
                                </button>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <h3 className={cn(
                                    "font-bold",
                                    task.status === 'completed' && "line-through text-muted-foreground"
                                  )}>{task.title}</h3>
                                  {task.status === 'completed' && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 rounded-full text-emerald-600 hover:bg-emerald-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenMediaUpload(task);
                                      }}
                                    >
                                      <Camera className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </div>
                                {task.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {task.proforma_item_id ? (
                                  <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 border-blue-200">
                                    Item Associated
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground/40">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {task.due_date ? (
                                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    <span>{format(new Date(task.due_date), 'MMM d, h:mm a')}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground/40">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {task.team_members ? (
                                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground">
                                    <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>{task.team_members.name}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground/40">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-60 group-hover:opacity-100" />}>
                                    <MoreVertical className="h-4 w-4" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuItem className="text-xs gap-2" onClick={() => handleOpenMediaUpload(task)}>
                                      <Camera className="h-3.5 w-3.5 text-emerald-600" /> Upload Media
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-xs gap-2" onClick={() => setEditingTask(task)}>
                                      <Pencil className="h-3.5 w-3.5" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-xs gap-2 text-red-600 focus:text-red-600" onClick={() => setTaskToDelete(task)}>
                                      <Trash2 className="h-3.5 w-3.5" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* VISTA MOBILE: Cards de Tareas */}
                    <div className="md:hidden divide-y divide-border/20">
                      {tasks.map(task => (
                        <div key={task.id} className="p-5 space-y-4 hover:bg-muted/5 transition-colors">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex gap-4">
                              <button
                                onClick={() => handleToggleTaskStatus(task.id, task.status)}
                                className={cn(
                                  "h-8 w-8 rounded-2xl border-2 flex items-center justify-center shrink-0 transition-all",
                                  task.status === 'completed'
                                    ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                    : "border-muted-foreground/20 hover:border-emerald-500"
                                )}
                              >
                                {task.status === 'completed' && <CheckCircle className="h-5 w-5" />}
                              </button>
                              <div className="min-w-0">
                                <h3 className={cn(
                                  "font-bold text-base leading-tight",
                                  task.status === 'completed' && "line-through text-muted-foreground/60"
                                )}>{task.title}</h3>
                                {task.description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                                )}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-10 w-10 -mr-2 rounded-2xl" />}>
                                <MoreVertical className="h-5 w-5" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem className="text-xs gap-2 py-3" onClick={() => handleOpenMediaUpload(task)}>
                                  <Camera className="h-4 w-4 text-emerald-600" /> Upload Media
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-xs gap-2 py-3" onClick={() => setEditingTask(task)}>
                                  <Pencil className="h-4 w-4" /> Edit Task
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-xs gap-2 py-3 text-red-600 focus:text-red-600" onClick={() => setTaskToDelete(task)}>
                                  <Trash2 className="h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            {task.due_date && (
                              <div className="flex items-center gap-1.5 bg-muted/30 px-3 py-1.5 rounded-xl border border-border/40">
                                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{format(new Date(task.due_date), 'MMM d')}</span>
                              </div>
                            )}
                            {task.team_members && (
                              <div className="flex items-center gap-1.5 bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/10">
                                <UserIcon className="h-3.5 w-3.5 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">{task.team_members.name}</span>
                              </div>
                            )}
                            {task.proforma_item_id && (
                              <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-none p-0 text-blue-700">Linked Item</Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center flex flex-col items-center gap-2 opacity-60">
                    <ListTodo className="h-10 w-10 text-muted-foreground" />
                    <p className="text-xs font-medium px-8 text-center">No tasks for this job yet. Add tasks to keep your team organized.</p>
                    <Button size="sm" variant="ghost" className="text-primary font-bold mt-2" onClick={() => setIsAddingTask(true)}>Create First Task</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Financials (Block 1) */}
          <TabsContent value="finance" className="space-y-6 mt-0">
            {/* Payments */}
            <Card className="border-border/40 overflow-hidden rounded-xl shadow-none">
              <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/5 border-b border-border/40">
                <CardTitle className="text-lg font-bold">Payments</CardTitle>
                <Button
                  size="sm"
                  className="h-8 gap-1 font-bold text-primary-foreground transition-all hover:-translate-y-0.5"
                  onClick={() => setIsRecordingPayment(true)}
                >
                  <Plus className="h-4 w-4" /> Record Payment
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {payments.length > 0 ? (
                  <>
                    {/* VISTA DESKTOP: Tabla de Pagos */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/10 text-muted-foreground border-b border-border/40">
                          <tr>
                            <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-left">Date</th>
                            <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-left">Method</th>
                            <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-right">Amount</th>
                            <th className="px-6 py-3 w-10 text-center font-bold text-[10px] uppercase tracking-widest">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {payments.map(payment => (
                            <tr key={payment.id} className="hover:bg-muted/5 transition-colors group">
                              <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{format(new Date(payment.payment_date), 'dd/MM/yyyy')}</td>
                              <td className="px-6 py-4 font-bold text-foreground">{payment.payment_method}</td>
                              <td className="px-6 py-4 text-right tabular-nums font-bold text-emerald-600">${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                              <td className="px-6 py-4 text-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-60 group-hover:opacity-100" />}>
                                    <MoreVertical className="h-4 w-4" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem className="text-xs cursor-pointer gap-2" onClick={() => handleViewPaymentPDF(payment)}>
                                      <Eye className="h-3.5 w-3.5" /> View Receipt
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-xs cursor-pointer gap-2" onClick={() => setBillingEmailModal({ type: 'payment', data: payment })}>
                                      <Mail className="h-3.5 w-3.5" /> Send by Email
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-xs cursor-pointer gap-2" onClick={() => setEditingPayment(payment)}>
                                      <Pencil className="h-3.5 w-3.5" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-xs cursor-pointer gap-2 text-red-600 focus:text-red-600" onClick={() => setPaymentToDelete(payment)}>
                                      <Trash2 className="h-3.5 w-3.5" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* VISTA MOBILE: Cards de Pagos */}
                    <div className="md:hidden divide-y divide-border/20">
                      {payments.map(payment => (
                        <div key={payment.id} className="p-5 flex justify-between items-center hover:bg-muted/5 transition-colors">
                          <div className="space-y-1">
                            <p className="font-bold text-base text-foreground leading-none">{payment.payment_method}</p>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                              {format(new Date(payment.payment_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-lg font-black text-emerald-600 leading-none">${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-10 w-10 -mr-2 rounded-2xl" />}>
                                <MoreVertical className="h-5 w-5" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem className="text-xs gap-2 py-3" onClick={() => handleViewPaymentPDF(payment)}>
                                  <Eye className="h-4 w-4" /> View Receipt
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-xs gap-2 py-3" onClick={() => setBillingEmailModal({ type: 'payment', data: payment })}>
                                  <Mail className="h-4 w-4" /> Send Email
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-xs gap-2 py-3" onClick={() => setEditingPayment(payment)}>
                                  <Pencil className="h-4 w-4" /> Edit Record
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-xs gap-2 py-3 text-red-600 focus:text-red-600" onClick={() => setPaymentToDelete(payment)}>
                                  <Trash2 className="h-4 w-4" /> Delete Payment
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center flex flex-col items-center gap-2 opacity-60">
                    <DollarSign className="h-10 w-10 text-muted-foreground" />
                    <p className="text-xs font-medium px-8 text-center">No payment records found for this job</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expenses */}
            <Card className="border-border/40 overflow-hidden rounded-xl shadow-none flex flex-col mt-6">
              <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/5 border-b border-border/40">
                <CardTitle className="text-lg font-bold">Expenses</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 font-bold border-primary/20 text-primary hover:bg-primary/5"
                    onClick={() => setIsScanningExpense(true)}
                  >
                    <Camera className="h-4 w-4" /> Scanner AI
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 gap-1 font-bold text-primary-foreground transition-all hover:-translate-y-0.5"
                    onClick={() => setIsAddingExpense(true)}
                  >
                    <Plus className="h-4 w-4" /> New Expense
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col">
                {/* Search Bar */}
                <div className="p-4 border-b border-border/40 bg-card">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by place, description or category..."
                      className="pl-9 h-9 text-xs"
                      value={expenseSearchTerm}
                      onChange={handleSearchChange}
                    />
                  </div>
                </div>

                {paginatedExpenses.length > 0 ? (
                  <>
                    {/* VISTA DESKTOP: Tabla de Gastos */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/10 text-muted-foreground border-b border-border/40">
                          <tr>
                            <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-left">Date</th>
                            <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-left">Place</th>
                            <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-left">Description</th>
                            <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-left">Category</th>
                            <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-center">Sync</th>
                            <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-right">Amount</th>
                            <th className="px-6 py-3 w-10 text-center font-bold text-[10px] uppercase tracking-widest">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {paginatedExpenses.map(exp => (
                            <tr key={exp.id} className="hover:bg-muted/5 transition-colors group">
                              <td className="px-6 py-4 text-muted-foreground whitespace-nowrap text-[11px]">{format(new Date(exp.date), 'dd/MM/yyyy')}</td>
                              <td className="px-6 py-4 font-bold text-foreground text-xs">{exp.place || 'Supplier'}</td>
                              <td className="px-6 py-4 text-xs text-muted-foreground line-clamp-1 max-w-[150px]">{exp.description}</td>
                              <td className="px-6 py-4">
                                <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest">
                                  {exp.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                {exp.sync_status === 'synced' ? (
                                  <div className="flex items-center justify-center text-emerald-600 bg-emerald-50 rounded-full h-6 w-6 mx-auto" title="Synced to QuickBooks">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  </div>
                                ) : (
                                  qboIntegration && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                                      onClick={() => handleSyncExpenseToQBO(exp)}
                                      disabled={syncingExpenseId === exp.id}
                                      title="Sync to QuickBooks"
                                    >
                                      {syncingExpenseId === exp.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <RefreshCw className="h-3.5 w-3.5" />
                                      )}
                                    </Button>
                                  )
                                )}
                              </td>
                              <td className="px-6 py-4 text-right tabular-nums font-bold text-red-600 text-xs">${Number(exp.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                              <td className="px-6 py-4 text-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-7 w-7" />}>
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem className="text-xs cursor-pointer gap-2" onClick={() => setSelectedExpenseForEdit(exp)}>
                                      <Pencil className="h-3.5 w-3.5" /> Edit
                                    </DropdownMenuItem>
                                    {exp.image_url && (
                                      <DropdownMenuItem className="text-xs cursor-pointer gap-2" onClick={() => setSelectedFileUrl(exp.image_url)}>
                                        <Eye className="h-3.5 w-3.5" /> View File
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem className="text-xs cursor-pointer gap-2 text-red-600 focus:text-red-600" onClick={() => setExpenseToDelete(exp)}>
                                      <Trash2 className="h-3.5 w-3.5" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* VISTA MOBILE: Cards de Gastos */}
                    <div className="md:hidden divide-y divide-border/20">
                      {paginatedExpenses.map(exp => (
                        <div key={exp.id} className="p-5 space-y-3 hover:bg-muted/5 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <p className="font-bold text-sm text-foreground">{exp.place || 'Supplier'}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                                  {format(new Date(exp.date), 'MMM d, yyyy')}
                                </p>
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <span className="text-[9px] font-black tracking-widest uppercase text-primary/70">{exp.category}</span>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-lg font-black text-red-600 leading-none">${Number(exp.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" />}>
                                  <MoreVertical className="h-4 w-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem className="text-xs gap-2 py-3" onClick={() => setSelectedExpenseForEdit(exp)}>
                                    <Pencil className="h-4 w-4" /> Edit Expense
                                  </DropdownMenuItem>
                                  {exp.image_url && (
                                    <DropdownMenuItem className="text-xs gap-2 py-3" onClick={() => setSelectedFileUrl(exp.image_url)}>
                                      <Eye className="h-4 w-4" /> View File
                                    </DropdownMenuItem>
                                  )}
                                  {qboIntegration && exp.sync_status !== 'synced' && (
                                    <DropdownMenuItem className="text-xs gap-2 py-3" onClick={() => handleSyncExpenseToQBO(exp)}>
                                      <RefreshCw className="h-4 w-4 text-orange-500" /> Sync to QBO
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem className="text-xs gap-2 py-3 text-red-600 focus:text-red-600" onClick={() => setExpenseToDelete(exp)}>
                                    <Trash2 className="h-4 w-4" /> Delete Expense
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {exp.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 italic">"{exp.description}"</p>
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2">
                              {exp.sync_status === 'synced' ? (
                                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-100">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span className="text-[9px] font-black uppercase tracking-widest">QBO Synced</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 bg-muted/30 text-muted-foreground px-2.5 py-1 rounded-lg border border-border/40">
                                  <RefreshCw className="h-3 w-3" />
                                  <span className="text-[9px] font-black uppercase tracking-widest">Not Synced</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination Controls - Responsive */}
                    {totalExpensePages > 1 && (
                      <div className="p-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between bg-card mt-auto gap-4">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                          Showing {(expenseCurrentPage - 1) * itemsPerPage + 1} - {Math.min(expenseCurrentPage * itemsPerPage, filteredExpenses.length)} OF {filteredExpenses.length}
                        </p>
                        <div className="flex gap-2 w-full sm:w-auto justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 px-4 rounded-xl border-border/40"
                            disabled={expenseCurrentPage === 1}
                            onClick={() => setExpenseCurrentPage(prev => prev - 1)}
                          >
                            <ChevronLeft className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Prev</span>
                          </Button>
                          <div className="flex items-center bg-muted/30 px-4 rounded-xl border border-border/40 min-w-[80px] justify-center">
                            <span className="text-xs font-black text-foreground">{expenseCurrentPage}</span>
                            <span className="mx-2 text-[10px] text-muted-foreground">/</span>
                            <span className="text-xs text-muted-foreground">{totalExpensePages}</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 px-4 rounded-xl border-border/40"
                            disabled={expenseCurrentPage === totalExpensePages}
                            onClick={() => setExpenseCurrentPage(prev => prev + 1)}
                          >
                            <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Next</span>
                            <ChevronRight className="h-4 w-4 sm:ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-12 text-center flex flex-col items-center gap-2 opacity-60">
                    <Receipt className="h-10 w-10 text-muted-foreground" />
                    <p className="text-xs font-medium px-8 text-center">
                      {expenseSearchTerm ? 'No expenses found matching your search' : 'Log your expenses to track detailed job costs'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Work Progress (Block 2) */}
          <TabsContent value="work" className="space-y-6 mt-0">
            {/* Labor */}
            <Card className="border-border/40 overflow-hidden rounded-xl shadow-none">
              <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/5 border-b border-border/40">
                <CardTitle className="text-lg font-bold">Labor</CardTitle>
                <Button size="sm" className="h-8 gap-1 font-bold text-primary-foreground transition-all hover:-translate-y-0.5" onClick={() => setIsAddingLabor(true)}>
                  <Plus className="h-4 w-4" /> New Time Entry
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {timeEntries.length > 0 ? (
                  <>
                    {/* VISTA DESKTOP: Tabla de Labor */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/10 text-muted-foreground border-b border-border/40">
                          <tr>
                            <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-left">Date</th>
                            <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-left">Employee</th>
                            <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-center">Duration</th>
                            <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-right">Rate</th>
                            <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-right">Total</th>
                            <th className="px-6 py-3 w-10 text-center font-bold text-[10px] uppercase tracking-widest">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {timeEntries.map(entry => (
                            <tr key={entry.id} className="hover:bg-muted/5 transition-colors group">
                              <td className="px-6 py-4 text-muted-foreground whitespace-nowrap text-[11px]">{format(new Date(entry.date), 'dd/MM/yyyy')}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                    <UserIcon className="h-3 w-3" />
                                  </div>
                                  <span className="font-bold text-xs">{entry.user_name || 'Staff Member'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center text-xs font-medium">{entry.duration}</td>
                              <td className="px-6 py-4 text-right tabular-nums text-muted-foreground text-xs">${(Number(entry.hourly_rate) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}/hr</td>
                              <td className="px-6 py-4 text-right tabular-nums font-bold text-foreground text-xs">${(Number(entry.total_cost) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                              <td className="px-6 py-4 text-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-7 w-7 opacity-60 group-hover:opacity-100 transition-opacity" />}>
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-32">
                                    <DropdownMenuItem className="text-xs gap-2" onClick={() => setEditingLabor(entry)}>
                                      <Pencil className="h-3.5 w-3.5" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-xs gap-2 text-red-600 focus:text-red-600" onClick={() => setLaborToDelete(entry)}>
                                      <Trash2 className="h-3.5 w-3.5" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-muted/5 font-bold">
                            <td colSpan={4} className="px-6 py-4 text-right text-[10px] uppercase tracking-widest text-muted-foreground">Total Labor Cost</td>
                            <td className="px-6 py-4 text-right tabular-nums text-xs">${totalLaborCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td />
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* VISTA MOBILE: Cards de Labor */}
                    <div className="md:hidden divide-y divide-border/20">
                      {timeEntries.map(entry => (
                        <div key={entry.id} className="p-5 space-y-4 hover:bg-muted/5 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                                <UserIcon className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-bold text-sm text-foreground">{entry.user_name || 'Staff Member'}</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">
                                  {format(new Date(entry.date), 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-black text-foreground leading-none">${(Number(entry.total_cost) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1 opacity-60">Total Cost</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between bg-muted/30 p-3 rounded-2xl border border-border/40">
                            <div className="space-y-0.5">
                              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Duration</p>
                              <p className="text-xs font-bold text-foreground">{entry.duration}</p>
                            </div>
                            <div className="h-8 w-px bg-border/40" />
                            <div className="space-y-0.5 text-right">
                              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Hourly Rate</p>
                              <p className="text-xs font-bold text-foreground">${(Number(entry.hourly_rate) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}/hr</p>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest" onClick={() => setEditingLabor(entry)}>
                              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-red-600 hover:bg-red-50" onClick={() => setLaborToDelete(entry)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {/* Labor Summary Mobile */}
                      <div className="p-5 bg-emerald-50/30 border-y border-emerald-500/10 flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Total Labor Cost</span>
                        <span className="text-xl font-black text-emerald-600">${totalLaborCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center flex flex-col items-center gap-2 opacity-60 bg-card">
                    <Clock className="h-10 w-10 text-muted-foreground" />
                    <p className="text-xs font-medium px-8 text-center">Time tracked to this job by you or your team will show here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Visits */}
            <Card className="border-border/40 overflow-hidden rounded-xl shadow-none mt-6">
              <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/5 border-b border-border/40">
                <CardTitle className="text-lg font-bold">Visits</CardTitle>
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
                                <Badge variant="destructive" className="h-5 px-1.5 text-[10px] font-bold uppercase tracking-widest">Overdue</Badge>
                              )}
                              {visit.status === 'completed' && (
                                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 h-5 px-1.5 text-[10px] font-bold uppercase tracking-widest">Completed</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">Assigned to: {visit.assigned_name || 'Unassigned'}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" />}>
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem className="text-xs gap-2" onClick={() => handleUpdateVisitStatus(visit.id, 'completed')}>
                              <CheckCircle2 className="h-4 w-4" /> Complete Visit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs gap-2" onClick={() => handleUpdateVisitStatus(visit.id, 'scheduled')}>
                              <Calendar className="h-4 w-4" /> Reschedule
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs gap-2 text-red-600 focus:text-red-600" onClick={() => handleDeleteVisit(visit.id)}>
                              <Trash2 className="h-4 w-4" /> Delete
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
          </TabsContent>

          {/* Tab: Financials (Block 2) */}
          <TabsContent value="finance" className="space-y-6 mt-0">
            {/* Invoices */}
            <Card className="border-border/40 overflow-hidden rounded-xl shadow-none">
              <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/5 border-b border-border/40">
                <CardTitle className="text-lg font-bold">Invoices</CardTitle>
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

                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/40">
                        <tr>
                          <th className="px-4 py-3 text-left">Invoice</th>
                          <th className="px-4 py-3 text-left">Due Date</th>
                          <th className="px-4 py-3 text-left">Status</th>
                          <th className="px-4 py-3 text-left">Subject</th>
                          <th className="px-4 py-3 text-right">Balance</th>
                          <th className="px-4 py-3 text-right">Total</th>
                          <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {invoices.map(inv => (
                          <tr key={inv.id} className="hover:bg-muted/5 transition-colors group">
                            <td className="px-4 py-4 font-bold text-emerald-600">#{inv.invoice_number}</td>
                            <td className="px-4 py-4 text-muted-foreground">{format(new Date(inv.due_date || inv.issue_date), 'd MMM. yyyy', { locale: es })}</td>
                            <td className="px-4 py-4">
                              <Badge variant="outline" className={cn(
                                "flex items-center gap-1.5 w-fit px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                                inv.status === 'paid' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                  inv.status === 'sent' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                    "bg-muted text-muted-foreground border-border"
                              )}>
                                <span className={cn("w-2 h-2 rounded-full",
                                  inv.status === 'paid' ? "bg-emerald-500" :
                                    inv.status === 'sent' ? "bg-blue-500" : "bg-muted-foreground")}
                                />
                                {inv.status.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 text-muted-foreground text-xs">{proforma.project_name}</td>
                            <td className="px-4 py-4 text-right tabular-nums font-bold">${inv.status === 'paid' ? '0.00' : Number(inv.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="px-4 py-4 text-right tabular-nums font-bold text-lg">${Number(inv.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="px-4 py-4 text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-60 group-hover:opacity-100" />}>
                                  <MoreVertical className="h-4 w-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuItem className="text-xs cursor-pointer gap-2" onClick={() => handleViewInvoicePDF(inv)}>
                                    <Eye className="h-3.5 w-3.5" /> View PDF
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-xs cursor-pointer gap-2" onClick={() => setBillingEmailModal({ type: 'invoice', data: inv })}>
                                    <Mail className="h-3.5 w-3.5" /> Send by Email
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="p-0">
                                    <Link
                                      href={`/invoices/${inv.id}/edit`}
                                      className="flex w-full items-center gap-2 px-2 py-1.5 text-xs transition-colors hover:bg-muted"
                                    >
                                      <Pencil className="h-3.5 w-3.5" /> Edit
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-xs cursor-pointer gap-2 text-red-600 focus:text-red-600" onClick={() => setInvoiceToDelete(inv)}>
                                    <Trash2 className="h-3.5 w-3.5" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* VISTA MOBILE: Cards de Facturas */}
                  <div className="md:hidden space-y-4">
                    {invoices.map(inv => (
                      <div key={inv.id} className="p-5 rounded-2xl border border-border/40 bg-card hover:shadow-md transition-all space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h3 className="font-bold text-lg text-emerald-600 leading-none">#{inv.invoice_number}</h3>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                              Due: {format(new Date(inv.due_date || inv.issue_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <Badge variant="outline" className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest",
                            inv.status === 'paid' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              inv.status === 'sent' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                "bg-muted text-muted-foreground border-border"
                          )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full",
                              inv.status === 'paid' ? "bg-emerald-500" :
                                inv.status === 'sent' ? "bg-blue-500" : "bg-muted-foreground")}
                            />
                            {inv.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border/30">
                          <div className="space-y-0.5">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Balance</p>
                            <p className="text-sm font-bold text-foreground">
                              ${inv.status === 'paid' ? '0.00' : Number(inv.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="space-y-0.5 text-right ">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Total</p>
                            <p className="text-lg font-black text-foreground">
                              ${Number(inv.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2"
                            onClick={() => handleViewInvoicePDF(inv)}
                          >
                            <Eye className="h-4 w-4" /> View PDF
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl border border-border/40" />}>
                              <MoreVertical className="h-5 w-5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem className="text-xs gap-2 py-3" onClick={() => setBillingEmailModal({ type: 'invoice', data: inv })}>
                                <Mail className="h-4 w-4" /> Send by Email
                              </DropdownMenuItem>
                              <DropdownMenuItem className="p-0">
                                <Link
                                  href={`/invoices/${inv.id}/edit`}
                                  className="flex w-full items-center gap-2 px-3 py-3 text-xs"
                                >
                                  <Pencil className="h-4 w-4" /> Edit Invoice
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-xs gap-2 py-3 text-red-600 focus:text-red-600" onClick={() => setInvoiceToDelete(inv)}>
                                <Trash2 className="h-4 w-4" /> Delete Invoice
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Link
                    href={`/clients/${proforma.client_id}/invoices/new?proformaId=${id}`}
                    className={cn(buttonVariants({ variant: 'ghost' }), "text-primary font-bold px-0 h-auto hover:bg-transparent")}
                  >
                    Create Invoice
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Work Progress (Block 3) */}
          <TabsContent value="work" className="space-y-6 mt-0">
            {/* Internal Notes */}
            <Card className="border-border/40 overflow-hidden rounded-xl shadow-none">
              <CardHeader className="py-4 bg-muted/5 border-b border-border/40">
                <CardTitle className="text-lg font-bold">Internal notes</CardTitle>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">Internal notes will only be seen by your team</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="bg-muted/5 border border-border/40 rounded-xl p-4 min-h-[120px]">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 ">Note details</p>
                  <textarea
                    className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none"
                    placeholder="Click here to add a note..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isAddingMaterial} onOpenChange={setIsAddingMaterial}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Generate Materials with AI</DialogTitle>
            <DialogDescription>
              Describe what materials you need (e.g. "Bathroom remodel 10m2").
              The AI will calculate quantities using average Home Depot prices.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="aiPrompt">Project / Materials Description</Label>
              <textarea
                id="aiPrompt"
                className="w-full min-h-[100px] rounded-md border border-input bg-background p-3 text-sm"
                placeholder="E.g: Laminate floor installation for a 20 square meter living room..."
                value={aiMaterialPrompt}
                onChange={(e) => setAiMaterialPrompt(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsAddingMaterial(false)} disabled={isGeneratingMaterials}>
              Cancel
            </Button>
            <Button onClick={handleGenerateMaterials} disabled={isGeneratingMaterials} className="font-bold">
              {isGeneratingMaterials ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate with AI'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSearchingSodimac} onOpenChange={setIsSearchingSodimac}>
        <DialogContent className="sm:max-w-[700px] bg-background">
          <DialogHeader>
            <DialogTitle>Manual Search</DialogTitle>
            <DialogDescription>
              Search products directly and add them to the proforma.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4 min-h-[400px]">
            <form onSubmit={handleSearchSodimac} className="flex gap-2">
              <Input
                placeholder="Ejemplo: Cemento sol, pintura latex blanco..."
                value={sodimacQuery}
                onChange={(e) => setSodimacQuery(e.target.value)}
                className="flex-1"
                autoFocus
              />
              <select
                value={searchStore}
                onChange={(e) => setSearchStore(e.target.value as 'homedepot' | 'ace')}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="homedepot">Home Depot</option>
                <option value="ace">Ace Hardware</option>
              </select>
              <Button type="submit" disabled={isSodimacLoading} className="font-bold">
                {isSodimacLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                Search
              </Button>
            </form>

            <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: '50vh' }}>
              {isSodimacLoading ? (
                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground opacity-60">
                  <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                  <p>Searching {searchStore === 'ace' ? 'Ace Hardware' : 'Home Depot'}...</p>
                </div>
              ) : sodimacResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sodimacResults.map((result, idx) => (
                    <div key={idx} className="border border-border/50 rounded-lg p-3 flex gap-4 bg-muted/10 hover:bg-muted/30 transition-colors">
                      <div className="h-16 w-16 bg-card rounded flex-shrink-0 flex items-center justify-center border border-border/50">
                        {result.photo_url ? (
                          <img src={result.photo_url} alt={result.name} className="h-full w-full object-contain" />
                        ) : (
                          <ListTodo className="h-6 w-6 text-muted-foreground/30" />
                        )}
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <a href={result.product_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-foreground leading-tight hover:underline line-clamp-2">
                          {result.name}
                        </a>
                        <p className="text-sm font-bold text-emerald-600 mt-1">$ {result.unit_price.toFixed(2)}</p>
                        <Button
                          size="sm"
                          className="mt-2 h-7 text-[10px] w-fit"
                          onClick={() => handleAddSodimacMaterial(result)}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : sodimacQuery && !isSodimacLoading ? (
                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground opacity-60">
                  <p>No results found for "{sodimacQuery}"</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground opacity-60">
                  <p>Type a term and press Search</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isAddingExpense && (
        <ExpenseFormModal
          proformaId={id}
          user={user}
          qboIntegration={qboIntegration}
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
          user={user}
          qboIntegration={qboIntegration}
          onClose={() => setSelectedExpenseForEdit(null)}
          onSuccess={() => {
            setSelectedExpenseForEdit(null);
            fetchExpenses();
          }}
        />
      )}

      {isEmailingMaterials && (
        <EmailMaterialsModal
          proformaId={id}
          proformaNumber={proforma.number}
          projectName={proforma.project_name}
          teamMembers={teamMembers}
          openOverride={isEmailingMaterials}
          setOpenOverride={setIsEmailingMaterials}
        />
      )}

      {/* Labor Modal */}

      {isAddingLabor && (
        <LaborFormModal proformaId={id} teamMembers={teamMembers} onClose={() => setIsAddingLabor(false)} onSuccess={() => { setIsAddingLabor(false); fetchTimeEntries(); }} />
      )}
      {isAddingTask && (
        <TaskFormModal
          proformaId={id}
          items={items}
          teamMembers={teamMembers}
          onClose={() => setIsAddingTask(false)}
          onSuccess={() => { setIsAddingTask(false); fetchTasks(); }}
        />
      )}
      {/* Visit Modal */}
      {isAddingVisit && (
        <VisitFormModal
          proformaId={id}
          teamMembers={teamMembers}
          onClose={() => setIsAddingVisit(false)}
          onSuccess={() => {
            setIsAddingVisit(false);
            fetchVisits();
          }}
        />
      )}

      {/* Task Media Upload Dialog */}
      <Dialog open={!!uploadingForTask} onOpenChange={(open) => !open && setUploadingForTask(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Camera className="h-4 w-4 text-emerald-600" />
              Upload Work Media
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {uploadingForTask?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Caption */}
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Caption (optional)</Label>
              <Input
                placeholder="e.g. Tile installation completed"
                value={mediaCaption}
                onChange={e => setMediaCaption(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            {/* File Picker */}
            <div>
              <label className="cursor-pointer block">
                <div className={cn(
                  "border-2 border-dashed border-border/50 rounded-xl p-8 text-center hover:border-emerald-400 hover:bg-emerald-50/30 transition-all",
                  isUploadingMedia && "opacity-60 pointer-events-none"
                )}>
                  {isUploadingMedia ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                      <p className="text-sm font-medium">Uploading…</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Camera className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm font-medium">Click to select photos or videos</p>
                      <p className="text-xs">JPG, PNG, WEBP, MP4 supported</p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={e => handleUploadTaskMedia(e.target.files)}
                  disabled={isUploadingMedia}
                />
              </label>
            </div>

            {/* Uploaded media thumbnails */}
            {uploadingForTask && (taskMedia[uploadingForTask.id] || []).length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Uploaded</p>
                <div className="grid grid-cols-4 gap-2">
                  {(taskMedia[uploadingForTask.id] || []).map((m: any) => (
                    <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer"
                      className="block aspect-square rounded-lg overflow-hidden border border-border/50 hover:opacity-80 transition-opacity bg-muted/10">
                      {m.type === 'video' ? (
                        <video src={m.url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={m.url} alt={m.caption || 'media'} className="w-full h-full object-cover" />
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* File Viewer Modal */}
      <Dialog open={!!selectedFileUrl} onOpenChange={(open) => !open && setSelectedFileUrl(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black border-none">
          <DialogHeader className="p-4 bg-card/10 backdrop-blur-md absolute top-0 left-0 right-0 z-10 flex flex-row items-center justify-between">
            <DialogTitle className="text-white text-sm font-bold flex items-center gap-2">
              <Eye className="h-4 w-4" /> Receipt View
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-card/20 h-8 gap-2 font-bold"
              onClick={() => {
                if (selectedFileUrl) window.open(selectedFileUrl, '_blank');
              }}
            >
              <FileDown className="h-4 w-4" /> Download
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
                <p className="text-xs uppercase font-black tracking-widest">Loading...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {isAddingMaterialManually && (
        <ManualMaterialFormModal
          proformaId={id}
          onClose={() => setIsAddingMaterialManually(false)}
          onSuccess={() => {
            //fetchMaterials();
            setIsAddingMaterialManually(false);
          }}
        />
      )}
      {isAddingLineItem && (
        <LineItemFormModal
          proformaId={id}
          itemsCount={items.length}
          itemPresets={itemPresets}
          onClose={() => setIsAddingLineItem(false)}
          onSuccess={() => {
            fetchItems();
            setIsAddingLineItem(false);
          }}
        />
      )}

      <Dialog open={!!itemToDelete} onOpenChange={(isOpen) => !isOpen && setItemToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{itemToDelete?.description}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setItemToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => itemToDelete && handleDeleteItem(itemToDelete.id)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!invoiceToDelete} onOpenChange={(isOpen) => !isOpen && setInvoiceToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice #{invoiceToDelete?.invoice_number}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setInvoiceToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => invoiceToDelete && handleDeleteInvoice(invoiceToDelete.id)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* InvoiceFormModal has been removed in favor of dedicated pages */}

      {billingEmailModal && (
        <EmailBillingModal
          type={billingEmailModal.type}
          id={billingEmailModal.data.id}
          clientEmail={proforma.clients?.email || ''}
          clientName={proforma.clients?.first_name || proforma.clients?.name || 'Cliente'}
          referenceNumber={billingEmailModal.type === 'invoice' ? billingEmailModal.data.invoice_number : String(proforma.number || billingEmailModal.data.id.split('-')[0]).toUpperCase()}
          onClose={() => setBillingEmailModal(null)}
        />
      )}

      <Dialog open={!!paymentToDelete} onOpenChange={(isOpen) => !isOpen && setPaymentToDelete(null)}>
        <DialogContent className="border-slate-200">
          <DialogHeader>
            <DialogTitle>Delete Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment of ${Number(paymentToDelete?.amount || 0).toLocaleString()}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setPaymentToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => paymentToDelete && handleDeletePayment(paymentToDelete.id)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!expenseToDelete} onOpenChange={(isOpen) => !isOpen && setExpenseToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the expense "{expenseToDelete?.description || expenseToDelete?.place}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setExpenseToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => expenseToDelete && handleDeleteExpense(expenseToDelete.id)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!laborToDelete} onOpenChange={(isOpen) => !isOpen && setLaborToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Labor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this labor entry for {laborToDelete?.user_name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setLaborToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => laborToDelete && handeDeleteLabor(laborToDelete.id)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!taskToDelete} onOpenChange={(isOpen) => !isOpen && setTaskToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the task "{taskToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setTaskToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => taskToDelete && handleDeleteTask(taskToDelete.id)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Editing Modals */}
      {editingPayment && (
        <RecordPaymentModal
          proformaId={id}
          clientId={proforma.client_id}
          payment={editingPayment}
          onClose={() => setEditingPayment(null)}
          onSuccess={() => {
            setEditingPayment(null);
            fetchPayments();
          }}
        />
      )}

      {editingLabor && (
        <LaborFormModal
          proformaId={id}
          teamMembers={teamMembers}
          entry={editingLabor}
          onClose={() => setEditingLabor(null)}
          onSuccess={() => {
            setEditingLabor(null);
            fetchTimeEntries();
          }}
        />
      )}

      {editingTask && (
        <TaskFormModal
          proformaId={id}
          items={items}
          teamMembers={teamMembers}
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSuccess={() => {
            setEditingTask(null);
            fetchTasks();
          }}
        />
      )}

      {isEditingAdjustments && (
        <AdjustmentsModal
          initialAdjustments={adjustments}
          onClose={() => setIsEditingAdjustments(false)}
          onSave={async (newAdjustments) => {
            setAdjustments(newAdjustments);
            await syncTotalsToDatabase(items, newAdjustments);
            setIsEditingAdjustments(false);
            toast.success('Adjustments updated');
          }}
        />
      )}
    </div>
  );
}

function AdjustmentsModal({ initialAdjustments, onClose, onSave }: {
  initialAdjustments: any[],
  onClose: () => void,
  onSave: (adjustments: any[]) => Promise<void>
}) {
  const [adjustments, setAdjustments] = React.useState([...initialAdjustments]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleAddAdjustment = (type: 'tax' | 'discount') => {
    setAdjustments([
      ...adjustments,
      {
        id: crypto.randomUUID(),
        label: type === 'tax' ? 'Sales Tax' : 'Discount',
        type,
        valueType: 'percentage',
        value: 0
      }
    ]);
  };

  const handleUpdateAdjustment = (id: string, field: string, value: any) => {
    setAdjustments(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const handleRemoveAdjustment = (id: string) => {
    setAdjustments(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSave(adjustments);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Manage Adjustments
          </DialogTitle>
          <DialogDescription>
            Add or modify taxes and discounts for this job.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {adjustments.length > 0 ? (
              adjustments.map((adj, index) => (
                <div key={adj.id || index} className="p-4 rounded-xl border border-border/40 bg-muted/5 space-y-4 relative group">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-full"
                    onClick={() => handleRemoveAdjustment(adj.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Label</Label>
                      <Input
                        value={adj.label}
                        onChange={(e) => handleUpdateAdjustment(adj.id, 'label', e.target.value)}
                        placeholder="e.g. Christmas Discount"
                        className="h-9 text-sm font-bold"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</Label>
                      <select
                        value={adj.type}
                        onChange={(e) => handleUpdateAdjustment(adj.id, 'type', e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm font-bold focus:ring-2 focus:ring-ring outline-none"
                      >
                        <option value="tax">Tax (+)</option>
                        <option value="discount">Discount (-)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Value Type</Label>
                      <div className="flex bg-muted/20 p-1 rounded-lg border border-border/40">
                        <button
                          type="button"
                          onClick={() => handleUpdateAdjustment(adj.id, 'valueType', 'percentage')}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter transition-all",
                            adj.valueType === 'percentage' ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Percent (%)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateAdjustment(adj.id, 'valueType', 'amount')}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter transition-all",
                            adj.valueType === 'amount' ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Fixed Amount ($)
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Value</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">
                          {adj.valueType === 'percentage' ? '%' : '$'}
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          value={adj.value}
                          onChange={(e) => handleUpdateAdjustment(adj.id, 'value', parseFloat(e.target.value) || 0)}
                          className="pl-7 h-9 text-sm font-bold"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center border-2 border-dashed border-border/40 rounded-2xl bg-muted/5">
                <p className="text-sm text-muted-foreground">No adjustments applied yet.</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 gap-2 border-dashed font-bold h-11"
              onClick={() => handleAddAdjustment('tax')}
            >
              <Plus className="h-4 w-4" /> Add Tax
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 gap-2 border-dashed font-bold h-11"
              onClick={() => handleAddAdjustment('discount')}
            >
              <Plus className="h-4 w-4" /> Add Discount
            </Button>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} className="font-bold">
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 font-bold min-w-[120px]" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Adjustments'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RecordPaymentModal({ proformaId, clientId, onClose, onSuccess, payment }: { proformaId: string, clientId: string, onClose: () => void, onSuccess: () => void, payment?: any }) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const paymentData = {
      proforma_id: proformaId,
      client_id: clientId,
      amount: parseFloat(formData.get('amount') as string),
      payment_date: formData.get('payment_date'),
      payment_method: formData.get('payment_method'),
      type: 'payment',
      notes: formData.get('notes')
    };

    const { error } = payment
      ? await supabase.from('payments').update(paymentData).eq('id', payment.id)
      : await supabase.from('payments').insert([paymentData]);

    if (error) {
      toast.error(payment ? 'Error updating payment' : 'Error recording payment');
    } else {
      toast.success(payment ? 'Payment updated successfully' : 'Payment recorded successfully');
      onSuccess();
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{payment ? 'Edit Payment' : 'Record Payment'}</DialogTitle>
          <DialogDescription>{payment ? 'Update the details of this payment.' : 'Log a payment received for this job.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="amount" name="amount" type="number" step="0.01" className="pl-9" defaultValue={payment?.amount} placeholder="0.00" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_date">Payment Date</Label>
            <Input id="payment_date" name="payment_date" type="date" defaultValue={payment?.payment_date || new Date().toISOString().split('T')[0]} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Payment Method</Label>
            <select
              id="payment_method"
              name="payment_method"
              defaultValue={payment?.payment_method || 'Cash'}
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              <option value="Cash">Cash</option>
              <option value="Transfer">Transfer</option>
              <option value="Card">Card</option>
              <option value="Check">Check</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <textarea
              id="notes"
              name="notes"
              defaultValue={payment?.notes || ''}
              className="w-full flex min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Additional details..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 font-bold" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : payment ? 'Update Payment' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ExpenseFormModal({
  proformaId,
  user,
  qboIntegration,
  onClose,
  onSuccess
}: {
  proformaId: string,
  user: any,
  qboIntegration: any,
  onClose: () => void,
  onSuccess: () => void
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [vendors, setVendors] = React.useState<any[]>([]);
  const [accounts, setAccounts] = React.useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = React.useState<any[]>([]);
  const [isLoadingQbo, setIsLoadingQbo] = React.useState(false);
  const supabase = createClient();

  React.useEffect(() => {
    if (qboIntegration && user) {
      const loadQboData = async () => {
        setIsLoadingQbo(true);
        try {
          const [vRes, aRes, bRes] = await Promise.all([
            getQuickBooksVendors(user.id),
            getQuickBooksAccounts(user.id, 'Expense'),
            getQuickBooksAccounts(user.id, 'Bank')
          ]);
          if (vRes.success) setVendors(vRes.vendors);
          if (aRes.success) setAccounts(aRes.accounts);
          if (bRes.success) setBankAccounts(bRes.accounts);
        } catch (err) {
          console.error('Error loading QBO data:', err);
        } finally {
          setIsLoadingQbo(false);
        }
      };
      loadQboData();
    }
  }, [qboIntegration, user]);

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
        qbo_vendor_id: formData.get('qbo_vendor_id'),
        qbo_account_id: formData.get('qbo_account_id'),
        qbo_bank_account_id: formData.get('qbo_bank_account_id'),
      }]);

    if (error) {
      toast.error('Error saving expense');
    } else {
      toast.success('Expense saved successfully');
      onSuccess();
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>Log a purchase or cost for this job.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {qboIntegration && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="space-y-2">
                <Label htmlFor="qbo_vendor_id" className="text-[10px] uppercase font-bold text-muted-foreground">QuickBooks Vendor</Label>
                {isLoadingQbo ? (
                  <div className="h-9 flex items-center justify-center bg-background rounded-md border border-input">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <select
                    id="qbo_vendor_id"
                    name="qbo_vendor_id"
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select vendor...</option>
                    {vendors.map(v => (
                      <option key={v.Id} value={v.Id}>{v.DisplayName}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="qbo_account_id" className="text-[10px] uppercase font-bold text-muted-foreground">QBO Category (Expense)</Label>
                {isLoadingQbo ? (
                  <div className="h-9 flex items-center justify-center bg-background rounded-md border border-input">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <select
                    id="qbo_account_id"
                    name="qbo_account_id"
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select account...</option>
                    {accounts.map(a => (
                      <option key={a.Id} value={a.Id}>{a.Name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="qbo_bank_account_id" className="text-[10px] uppercase font-bold text-muted-foreground">Bank / Source</Label>
                {isLoadingQbo ? (
                  <div className="h-9 flex items-center justify-center bg-background rounded-md border border-input">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <select
                    id="qbo_bank_account_id"
                    name="qbo_bank_account_id"
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select bank...</option>
                    {bankAccounts.map(a => (
                      <option key={a.Id} value={a.Id}>{a.Name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="place">Place of Purchase</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="place" name="place" className="pl-9" placeholder="e.g. Home Depot" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" placeholder="e.g. Paint and brushes" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <div className="relative">
                <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="category" name="category" className="pl-9" placeholder="e.g. Materials" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="amount" name="amount" type="number" step="0.01" className="pl-9" placeholder="0.00" required />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" className="flex-1 text-primary-foreground font-bold" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Expense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditExpenseModal({
  expense,
  user,
  qboIntegration,
  onClose,
  onSuccess
}: {
  expense: any,
  user: any,
  qboIntegration: any,
  onClose: () => void,
  onSuccess: () => void
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [vendors, setVendors] = React.useState<any[]>([]);
  const [accounts, setAccounts] = React.useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = React.useState<any[]>([]);
  const [isLoadingQbo, setIsLoadingQbo] = React.useState(false);
  const supabase = createClient();

  React.useEffect(() => {
    if (qboIntegration && user) {
      const loadQboData = async () => {
        setIsLoadingQbo(true);
        try {
          const [vRes, aRes, bRes] = await Promise.all([
            getQuickBooksVendors(user.id),
            getQuickBooksAccounts(user.id, 'Expense'),
            getQuickBooksAccounts(user.id, 'Bank')
          ]);
          if (vRes.success) setVendors(vRes.vendors);
          if (aRes.success) setAccounts(aRes.accounts);
          if (bRes.success) setBankAccounts(bRes.accounts);
        } catch (err) {
          console.error('Error loading QBO data:', err);
        } finally {
          setIsLoadingQbo(false);
        }
      };
      loadQboData();
    }
  }, [qboIntegration, user]);

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
        qbo_vendor_id: formData.get('qbo_vendor_id'),
        qbo_account_id: formData.get('qbo_account_id'),
        qbo_bank_account_id: formData.get('qbo_bank_account_id'),
      })
      .eq('id', expense.id);

    if (error) {
      toast.error('Error updating expense');
    } else {
      toast.success('Expense updated successfully');
      onSuccess();
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Pencil className="h-4 w-4" /> Edit Expense</DialogTitle>
          <DialogDescription>Update the details of this expense.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {qboIntegration && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="space-y-2">
                <Label htmlFor="qbo_vendor_id" className="text-[10px] uppercase font-bold text-muted-foreground">QuickBooks Vendor</Label>
                {isLoadingQbo ? (
                  <div className="h-9 flex items-center justify-center bg-background rounded-md border border-input">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <select
                    id="qbo_vendor_id"
                    name="qbo_vendor_id"
                    defaultValue={expense.qbo_vendor_id || ""}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select vendor...</option>
                    {vendors.map(v => (
                      <option key={v.Id} value={v.Id}>{v.DisplayName}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="qbo_account_id" className="text-[10px] uppercase font-bold text-muted-foreground">QBO Category (Expense)</Label>
                {isLoadingQbo ? (
                  <div className="h-9 flex items-center justify-center bg-background rounded-md border border-input">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <select
                    id="qbo_account_id"
                    name="qbo_account_id"
                    defaultValue={expense.qbo_account_id || ""}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select account...</option>
                    {accounts.map(a => (
                      <option key={a.Id} value={a.Id}>{a.Name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="qbo_bank_account_id" className="text-[10px] uppercase font-bold text-muted-foreground">Bank / Source</Label>
                {isLoadingQbo ? (
                  <div className="h-9 flex items-center justify-center bg-background rounded-md border border-input">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <select
                    id="qbo_bank_account_id"
                    name="qbo_bank_account_id"
                    defaultValue={expense.qbo_bank_account_id || ""}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select bank...</option>
                    {bankAccounts.map(a => (
                      <option key={a.Id} value={a.Id}>{a.Name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="place">Place of Purchase</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="place" name="place" className="pl-9" defaultValue={expense.place} placeholder="e.g. Home Depot" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" defaultValue={expense.description} placeholder="e.g. Paint and brushes" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <div className="relative">
                <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="category" name="category" className="pl-9" defaultValue={expense.category} placeholder="e.g. Materials" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="amount" name="amount" type="number" step="0.01" className="pl-9" defaultValue={expense.amount} placeholder="0.00" required />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" defaultValue={expense.date} required />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" className="flex-1 font-bold" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Expense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LaborFormModal({ proformaId, teamMembers, onClose, onSuccess, entry }: {
  proformaId: string,
  teamMembers: any[],
  onClose: () => void,
  onSuccess: () => void,
  entry?: any
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [startTime, setStartTime] = React.useState(entry?.start_time || '08:00');
  const [endTime, setEndTime] = React.useState(entry?.end_time || '17:00');
  const [hours, setHours] = React.useState(entry?.hours || 8);
  const [minutes, setMinutes] = React.useState(entry?.minutes || 0);
  const [hourlyRate, setHourlyRate] = React.useState(entry?.hourly_rate || 0);
  const [date, setDate] = React.useState(entry?.date || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = React.useState(entry?.notes || '');
  const [teamMemberId, setTeamMemberId] = React.useState(entry?.team_member_id || '');

  const supabase = createClient();

  // Calculate hours/minutes when start/end time changes
  React.useEffect(() => {
    if (!startTime || !endTime) return;
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

    const laborData = {
      proforma_id: proformaId,
      team_member_id: teamMemberId,
      user_name: teamMembers.find(m => m.id === teamMemberId)?.name,
      duration: `${hours}h ${minutes}m`,
      hours: hours,
      minutes: minutes,
      start_time: startTime,
      end_time: endTime,
      hourly_rate: hourlyRate,
      total_cost: totalCost,
      date: date,
      notes: notes
    };

    const { error } = entry
      ? await supabase.from('job_time_entries').update(laborData).eq('id', entry.id)
      : await supabase.from('job_time_entries').insert([laborData]);

    if (error) {
      toast.error(entry ? 'Error updating labor' : 'Error logging labor');
    } else {
      toast.success(entry ? 'Labor updated successfully' : 'Labor logged successfully');
      onSuccess();
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{entry ? 'Edit Labor Entry' : 'Time Entry'}</DialogTitle>
          <DialogDescription>{entry ? 'Update the details of this labor entry.' : 'Record a new shift or labor assignment.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Start / End Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Duration (calculated) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hours">Hours</Label>
              <Input
                id="hours"
                type="number"
                min={0}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minutes">Minutes</Label>
              <Input
                id="minutes"
                type="number"
                min={0}
                max={59}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Team Member */}
          <div className="space-y-2">
            <Label htmlFor="team_member_id">Team Member</Label>
            <select
              id="team_member_id"
              name="team_member_id"
              value={teamMemberId}
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(e) => {
                const id = e.target.value;
                setTeamMemberId(id);
                const selectedMember = teamMembers.find(m => m.id === id);
                if (selectedMember && selectedMember.hourly_cost !== undefined) {
                  setHourlyRate(Number(selectedMember.hourly_cost));
                }
              }}
              required
            >
              <option value="" disabled>Select an employee...</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.id}>{member.name} {member.hourly_cost ? `($${member.hourly_cost}/hr)` : ''}</option>
              ))}
            </select>
          </div>

          {/* Hourly Rate + Total */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="pl-9"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Total Labor Cost</Label>
              <div className="flex h-10 items-center rounded-md border border-input bg-muted/30 px-3 text-sm font-semibold text-foreground">
                ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Shift Notes (Optional)</Label>
            <textarea
              id="notes"
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Record summary of work completed during this shift..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : entry ? 'Update Labor' : 'Log Time Entry'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function VisitFormModal({ proformaId, teamMembers, onClose, onSuccess }: { proformaId: string, teamMembers: { id: string, name: string }[], onClose: () => void, onSuccess: () => void }) {
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
        assigned_to: formData.get('assigned_to'),
        visit_date: formData.get('visit_date'),
        status: formData.get('status'),
        notes: formData.get('notes')
      }]);

    if (error) {
      toast.error('Error scheduling visit');
    } else {
      toast.success('Visit scheduled successfully');
      onSuccess();
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule New Visit</DialogTitle>
          <DialogDescription>Plan an on-site visit for this job.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assign To</Label>
            <select
              id="assigned_to"
              name="assigned_to"
              defaultValue={''}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Unassigned</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visit_date">Date &amp; Time</Label>
              <Input id="visit_date" name="visit_date" type="datetime-local" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Visit instructions..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Schedule Visit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TaskFormModal({ proformaId, items, teamMembers, onClose, onSuccess, task }: {
  proformaId: string,
  items: any[],
  teamMembers: any[],
  onClose: () => void,
  onSuccess: () => void,
  task?: any
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const taskData = {
      proforma_id: proformaId,
      proforma_item_id: (formData.get('proforma_item_id') as string) || null,
      assigned_to: (formData.get('assigned_to') as string) || null,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      due_date: formData.get('due_date') ? formatISO(new Date(formData.get('due_date') as string)) : null,
      end_date: formData.get('end_date') ? formatISO(new Date(formData.get('end_date') as string)) : null,
      status: task ? task.status : 'pending'
    };

    const { error } = task
      ? await supabase.from('job_tasks').update(taskData).eq('id', task.id)
      : await supabase.from('job_tasks').insert([taskData]);

    if (error) {
      toast.error(task ? 'Error updating task' : 'Error creating task');
    } else {
      toast.success(task ? 'Task updated successfully' : 'Task created successfully');
      onSuccess();
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'New Task'}</DialogTitle>
          <DialogDescription>
            {task ? 'Update task details and assignments.' : 'Create a task and optionally assign it to a team member.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input id="title" name="title" defaultValue={task?.title} placeholder="e.g. Buy paint" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proforma_item_id">Link to Line Item (Optional)</Label>
            <select
              id="proforma_item_id"
              name="proforma_item_id"
              defaultValue={task?.proforma_item_id || ''}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">None</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>{item.description}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assign To</Label>
            <select
              id="assigned_to"
              name="assigned_to"
              defaultValue={task?.assigned_to || ''}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Unassigned</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Start Date/Time</Label>
              <Input
                id="due_date"
                name="due_date"
                type="datetime-local"
                defaultValue={task?.due_date ? format(new Date(task.due_date), "yyyy-MM-dd'T'HH:mm") : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date/Time</Label>
              <Input
                id="end_date"
                name="end_date"
                type="datetime-local"
                defaultValue={task?.end_date ? format(new Date(task.end_date), "yyyy-MM-dd'T'HH:mm") : ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              defaultValue={task?.description || ''}
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Additional details..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : task ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


const formatUSDInModal = (val: string | number) => {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const parseUSDInModal = (val: string) => {
  return val.replace(/[^0-9.]/g, '');
};

const CurrencyInputInModal = ({
  value,
  onChange,
  className,
  ...props
}: any) => {
  const [localValue, setLocalValue] = React.useState(value?.toString() || '');
  const [isFocused, setIsFocused] = React.useState(false);

  React.useEffect(() => {
    if (!isFocused) setLocalValue(value?.toString() || '');
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseUSDInModal(e.target.value);
    setLocalValue(e.target.value);
    onChange(raw);
  };

  return (
    <Input
      {...props}
      value={isFocused ? localValue : formatUSDInModal(value)}
      onFocus={() => {
        setIsFocused(true);
        setLocalValue(value?.toString() || '');
      }}
      onBlur={() => setIsFocused(false)}
      onChange={handleChange}
      className={className}
    />
  );
};

function LineItemFormModal({ proformaId, itemsCount, itemPresets = [], onClose, onSuccess }: {
  proformaId: string,
  itemsCount: number,
  itemPresets?: any[],
  onClose: () => void,
  onSuccess: () => void
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [comboboxOpen, setComboboxOpen] = React.useState(false);

  // Controlled fields
  const [description, setDescription] = React.useState('');
  const [details, setDetails] = React.useState('');
  const [quantity, setQuantity] = React.useState('1');
  const [unitPrice, setUnitPrice] = React.useState('0.00');
  const [cost, setCost] = React.useState('0.00');
  const [isOptional, setIsOptional] = React.useState(false);

  const uniquePresets = React.useMemo(() => {
    const map = new Map();
    [...itemPresets].reverse().forEach(p => {
      if (p.description && !map.has(p.description.toLowerCase())) {
        map.set(p.description.toLowerCase(), p);
      }
    });
    return Array.from(map.values());
  }, [itemPresets]);

  const handleSelectPreset = (preset: any) => {
    setDescription(preset.description || '');
    setDetails(preset.details || '');
    setUnitPrice((preset.unit_price || 0).toString());
    setCost((preset.cost || 0).toString());
    setComboboxOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const qty = parseFloat(quantity) || 1;
    const price = parseFloat(unitPrice) || 0;
    const totalPrice = qty * price;

    const { error } = await supabase
      .from('proforma_items')
      .insert([{
        proforma_id: proformaId,
        description: description,
        details: details,
        quantity: qty,
        unit_price: price,
        total_price: totalPrice,
        cost: parseFloat(cost) || 0,
        is_optional: isOptional,
        sort_order: itemsCount
      }]);

    if (error) {
      toast.error('Error adding item');
      console.error(error);
    } else {
      toast.success('Item added successfully');
      onSuccess();
    }
    setIsSubmitting(false);
  };

  const supabase = createClient();

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="overflow-visible">
        <DialogHeader>
          <DialogTitle>NEW ITEM</DialogTitle>
          <DialogDescription>Add a product or service line item to this quote.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2 text-left">
            <Label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Product / Service *</Label>
            <div className={cn("w-full relative isolate", comboboxOpen && "z-[100]")}>
              <div className="relative group/trigger">
                <Input
                  id="description"
                  value={description}
                  onFocus={() => setComboboxOpen(true)}
                  onBlur={() => {
                    // Delay hiding to let clicks on the list register
                    setTimeout(() => setComboboxOpen(false), 200);
                  }}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (!comboboxOpen) setComboboxOpen(true);
                  }}
                  placeholder="Item name"
                  autoComplete="off"
                  required
                  className="w-full h-12 bg-background border-border/60 rounded-xl shadow-sm hover:bg-accent/5 transition-all focus:ring-2 focus:ring-primary/10 pl-4 pr-10 font-bold"
                />
                {itemPresets.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-0 hover:bg-transparent"
                    onClick={() => setComboboxOpen(!comboboxOpen)}
                  >
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", comboboxOpen && "rotate-180")} />
                  </Button>
                )}
              </div>

              {comboboxOpen && uniquePresets.length > 0 && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-full z-[110] rounded-2xl border border-border/40 bg-popover/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <Command className="bg-transparent">
                    <CommandInput placeholder="Search existing items..." className="h-11 border-none focus:ring-0" />
                    <CommandList className="max-h-[240px] overflow-y-auto custom-scrollbar">
                      <CommandEmpty className="p-4 text-xs text-muted-foreground italic">No previous items found.</CommandEmpty>
                      <CommandGroup heading="Recent Items" className="p-2 text-[10px] font-black tracking-widest text-muted-foreground/50">
                        {uniquePresets.map((preset, idx) => (
                          <CommandItem
                            key={idx}
                            value={preset.description}
                            onSelect={() => handleSelectPreset(preset)}
                            className="flex flex-col items-start gap-1 py-3 px-4 cursor-pointer hover:bg-primary/5 rounded-xl transition-all"
                          >
                            <div className="flex w-full items-center justify-between">
                              <span className="font-bold text-sm text-foreground">{preset.description}</span>
                              <span className="text-xs font-black text-primary">${formatUSDInModal(preset.unit_price)}</span>
                            </div>
                            {preset.details && (
                              <div className="text-[10px] text-muted-foreground line-clamp-1 w-full font-medium leading-relaxed mt-0.5">
                                {preset.details}
                              </div>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 text-left">
            <Label htmlFor="details" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Details (Optional)</Label>
            <textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full min-h-[100px] rounded-xl border border-border/60 bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/10 shadow-sm transition-all"
              placeholder="Additional details, measurements, or context..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="quantity" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                step="1"
                required
                className="rounded-xl h-11 border-border/60 shadow-sm focus:ring-2 focus:ring-primary/10 px-4 font-bold"
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="unit_price" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Unit Price *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-sm">$</span>
                <CurrencyInputInModal
                  id="unit_price"
                  type="text"
                  inputMode="decimal"
                  value={unitPrice}
                  onChange={setUnitPrice}
                  required
                  className="rounded-xl h-11 border-border/60 shadow-sm focus:ring-2 focus:ring-primary/10 pl-7 font-bold"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="cost" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Estimated Cost (Internal)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-sm">$</span>
                <CurrencyInputInModal
                  id="cost"
                  type="text"
                  inputMode="decimal"
                  value={cost}
                  onChange={setCost}
                  className="rounded-xl h-11 border-border/60 shadow-sm focus:ring-2 focus:ring-primary/10 pl-7 font-bold bg-muted/20"
                />
              </div>
            </div>
            <div className="flex flex-col justify-end pb-3 pl-2">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="is_optional_modal"
                  checked={isOptional}
                  onCheckedChange={(checked) => setIsOptional(checked as boolean)}
                  className="rounded-md border-primary"
                />
                <Label htmlFor="is_optional_modal" className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-muted-foreground">
                  Marcar como opcional
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Item to Job'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ManualMaterialFormModal({ proformaId, onClose, onSuccess }: {
  proformaId: string,
  onClose: () => void,
  onSuccess: () => void
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const quantity = parseFloat(formData.get('quantity') as string) || 1;
    const unitPrice = parseFloat(formData.get('unit_price') as string) || 0;
    const totalPrice = quantity * unitPrice;

    const { error } = await supabase
      .from('job_materials')
      .insert([{
        proforma_id: proformaId,
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        quantity: quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        is_purchased: false
      }]);

    if (error) {
      toast.error('Error adding material');
      console.error(error);
    } else {
      toast.success('Material added successfully');
      onSuccess();
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="border-b border-border/40 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-primary">
            <Pencil className="h-5 w-5 text-primary" />
            New Manual Material
          </DialogTitle>
          <DialogDescription>Add a material manually without searching online.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Material Name</Label>
            <Input id="name" name="name" placeholder="e.g. 5 Gallon White Paint" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" name="quantity" type="number" defaultValue="1" step="0.01" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_price">Unit Price ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground font-bold" />
                <Input id="unit_price" name="unit_price" type="number" step="0.01" className="pl-8" placeholder="0.00" required />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Notes / Details (Optional)</Label>
            <textarea
              id="description"
              name="description"
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. Specific brand or color codes..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Material'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
