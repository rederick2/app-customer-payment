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
  User as UserIcon
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format, parseISO, formatISO } from 'date-fns';
import { es } from 'date-fns/locale';
import ProformaDropdownActions from './ProformaDropdownActions';
import EmailMaterialsModal from './EmailMaterialsModal';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import ReceiptScanner from '@/components/ReceiptScanner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tag, Trash2, Camera, Loader2, Eye, Pencil, ChevronLeft, ChevronRight, FileDown, ZoomIn } from 'lucide-react';
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

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

export function JobView({
  proforma,
  items: itemsProp,
  id,
  expenses: initialExpenses,
  visits: initialVisits,
  timeEntries: initialTimeEntries,
  invoices,
  payments: initialPayments,
  tasks: initialTasks,
  teamMembers: initialTeamMembers,
  materials: initialMaterials
}: JobViewProps) {
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

  const itemsPerPage = 10;

  const supabase = createClient();

  const syncTotalsToDatabase = async (currentItems: any[]) => {
    const newSubtotal = currentItems.reduce((acc, item) => {
      if (item.is_excluded) return acc;
      return acc + (item.total_price || 0);
    }, 0);

    const adjustments = (proforma.adjustments || []) as any[];
    const discountAdjustments = adjustments.filter(a => a.type === 'discount');
    const taxAdjustments = adjustments.filter(a => a.type === 'tax');

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
        tax: totalTax // Updating tax field recursively if needed
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
      if (data) syncTotalsToDatabase(data);
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
  }, []);

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
      toast.error('Error al actualizar el costo');
    } else {
      setItems(prev => prev.map(item => item.id === itemId ? { ...item, cost: newCost } : item));
      toast.success('Costo actualizado');
      handleCancelEditing();
    }
    setIsSavingCost(false);
  };

  const handleDeleteItem = async (itemId: string) => {
    const { error } = await supabase
      .from('proforma_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast.error('Error al eliminar item');
    } else {
      const updatedItems = items.filter(item => item.id !== itemId);
      setItems(updatedItems);
      toast.success('Item eliminado');
      setItemToDelete(null);
      // Sync totals to DB after deletion
      syncTotalsToDatabase(updatedItems);
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
      toast.error('Error al eliminar pago');
    } else {
      setPayments(prev => prev.filter(p => p.id !== paymentId));
      toast.success('Pago eliminado');
      setPaymentToDelete(null);
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
      setExpenseToDelete(null);
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
      toast.error('Error al eliminar tarea');
    } else {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success('Tarea eliminada');
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
      toast.error('Error al eliminar material');
    } else {
      setMaterials(prev => prev.filter(m => m.id !== materialId));
      toast.success('Material eliminado');
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
    return acc + item.total_price;
  }, 0);

  const adjustments = (proforma.adjustments || []) as any[];
  const totalDiscount = adjustments
    .filter(adj => adj.type === 'discount')
    .reduce((acc, adj) => {
      const amount = adj.valueType === 'percentage' ? (subtotal * adj.value) / 100 : adj.value;
      return acc + amount;
    }, 0);

  const totalInvoiced = subtotal;
  const totalCost = items.reduce((acc, item) => acc + (item.cost || 0) * item.quantity, 0);
  const totalLaborCost = timeEntries.reduce((acc, entry) => acc + (Number(entry.total_cost) || 0), 0);
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
          <ProformaDropdownActions
            proformaId={id}
            currentStatus={proforma.status || 'draft'}
            projectName={proforma.project_name}
            proforma={proforma}
            items={items}
          />
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
                  <UserIcon className="h-3.5 w-3.5" />
                  <Link href={`/clients/${proforma.clients?.id}`}>
                    <span>{proforma.clients?.company_name || proforma.clients?.name || 'No name provided'}</span>
                  </Link>
                </div>
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

          {/* Line Items Section */}
          <Card className="border-border/40 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/5">
              <CardTitle className="text-xl font-serif">Line Items</CardTitle>
              <Button size="sm" className="h-8 gap-1 font-bold" onClick={() => setIsAddingLineItem(true)}>
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Line Item</span>
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              {/* VISTA DESKTOP: Se mantiene la tabla pero se oculta en mobile */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/10 text-muted-foreground border-b border-border/40 text-[10px] font-black uppercase tracking-widest">
                    <tr>
                      <th className="px-4 py-3 text-left w-10"></th>
                      <th className="px-6 py-3 text-left">Product / Service</th>
                      <th className="px-4 py-3 text-center w-24">Image</th>
                      <th className="px-6 py-3 text-center w-24">Qty</th>
                      <th className="px-6 py-3 text-right">Cost</th>
                      <th className="px-6 py-3 text-right">Price</th>
                      <th className="px-6 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-center w-10">Acciones</th>
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
                          <p className="font-bold text-[#0D3B47] text-base leading-tight">{item.description}</p>
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
                                  className="text-[10px] font-black uppercase tracking-widest text-[#306C3E] hover:text-[#265832] mt-1 flex items-center gap-1 group"
                                >
                                  {expandedItems.has(item.id) ? (
                                    <>Ver menos <ChevronUp className="h-3 w-3 transition-transform group-hover:-translate-y-0.5" /></>
                                  ) : (
                                    <>Leer más <ChevronDown className="h-3 w-3 transition-transform group-hover:translate-y-0.5" /></>
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
                    <tr className="bg-muted/5 font-bold border-t border-border/40">
                      <td colSpan={3} className="px-6 py-4 text-left">
                        <Button variant="outline" size="sm" className="h-8 gap-1 font-bold" onClick={() => setIsAddingLineItem(true)}>
                          <Plus className="h-3 w-3" /> New Line Item
                        </Button>
                      </td>
                      <td className="px-6 py-4" />
                      <td className="px-6 py-4 text-right tabular-nums">${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4" />
                      <td className="px-6 py-4 text-right tabular-nums text-lg">${totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4" />
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* VISTA MOBILE: Se convierte en lista de cards */}
              <div className="md:hidden divide-y divide-border/30">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 space-y-3 active:bg-muted/10 transition-colors"
                    onClick={() => handleStartEditing(item)}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex gap-3">
                        <Checkbox checked={!item.is_optional} className="mt-1" />
                        <div>
                          <p className="font-bold text-[#0D3B47] leading-tight">{item.description}</p>
                          {item.details && (
                            <div className="mt-1">
                              <p className={cn(
                                "text-[11px] text-muted-foreground leading-relaxed transition-all duration-300",
                                !expandedItems.has(item.id) && "line-clamp-2"
                              )}>
                                {item.details}
                              </p>
                              {item.details.length > 60 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleItemExpansion(item.id);
                                  }}
                                  className="text-[9px] font-black uppercase tracking-widest text-[#306C3E] mt-1"
                                >
                                  {expandedItems.has(item.id) ? 'Ver menos' : 'Leer más'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">${item.total_price.toLocaleString('en-US')}</p>
                        <p className="text-[10px] text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-muted/5 p-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        {item.photo_url && (
                          <img src={item.photo_url} className="h-8 w-8 rounded object-cover border" />
                        )}
                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Cost:</span>
                        <span className="text-xs font-medium">${item.cost || 0}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold text-red-600 hover:text-red-700 hover:bg-red-50" onClick={(e) => {
                          e.stopPropagation();
                          setItemToDelete(item);
                        }}>Delete</Button>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold">Edit Cost</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer de Totales resumido para mobile */}
              <div className="p-4 bg-muted/5 border-t border-border/40 flex justify-between items-center md:hidden">
                <span className="text-[10px] font-black uppercase text-muted-foreground">Total Invoiced</span>
                <span className="text-lg font-bold text-emerald-600">${totalInvoiced.toLocaleString('en-US')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Materials Section */}
          <Card className="border-border/40 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between py-4 bg-muted/5 gap-4">
              <div className="flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-emerald-700" />
                <CardTitle className="text-xl font-serif">Materials</CardTitle>
              </div>
              <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button size="sm" className="h-8 gap-1 font-bold bg-[#306C3E] hover:bg-[#265832]" />}>
                    <Plus className="h-4 w-4" /> Add Materials
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem className="text-xs gap-2 py-2" onClick={() => setIsEmailingMaterials(true)}>
                      <Mail className="h-4 w-4 text-blue-600" /> Send Email List
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-xs gap-2 py-2" onClick={() => setIsSearchingSodimac(true)}>
                      <Search className="h-4 w-4 text-[#306C3E]" /> Search Products
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-xs gap-2 py-2" onClick={() => setIsAddingMaterial(true)}>
                      <TrendingUp className="h-4 w-4 text-[#306C3E]" /> AI Auto-Gen
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-xs gap-2 py-2" onClick={() => setIsAddingMaterialManually(true)}>
                      <Pencil className="h-4 w-4 text-[#306C3E]" /> Manual Add
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
              {/* Materials Search Bar */}
              <div className="p-4 border-b border-border/40 bg-white">
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
                  <div className="overflow-x-auto">
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

                  {/* Materials Pagination Controls */}
                  {totalMaterialPages > 1 && (
                    <div className="p-4 border-t border-border/40 flex items-center justify-between bg-white mt-auto">
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

          {/* Tasks Section */}
          <Card className="border-border/40 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/5">
              <div className="flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-[#0D3B47]" />
                <CardTitle className="text-xl font-serif">Tasks</CardTitle>
              </div>
              <Button size="sm" className="h-8 gap-1 font-bold bg-[#0D3B47] hover:bg-[#072a33]" onClick={() => setIsAddingTask(true)}>
                <Plus className="h-4 w-4" /> New Task
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {tasks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/10 text-muted-foreground border-b border-border/40">
                      <tr>
                        <th className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-left w-10">Done</th>
                        <th className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-left">Task Description</th>
                        <th className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-left">Associate</th>
                        <th className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-left">Due Date</th>
                        <th className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-left">Assigned To</th>
                        <th className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-right">Actions</th>
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
              ) : (
                <div className="py-12 text-center flex flex-col items-center gap-2 opacity-60">
                  <ListTodo className="h-10 w-10 text-muted-foreground" />
                  <p className="text-xs font-medium px-8 text-center">No tasks for this job yet. Add tasks to keep your team organized.</p>
                  <Button size="sm" variant="ghost" className="text-primary font-bold mt-2" onClick={() => setIsAddingTask(true)}>Create First Task</Button>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Payments, Expenses, Labor & Visits Row */}
          {/* Payments Row */}
          <div className="grid grid-cols-1 gap-6">
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
                          <th className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-left">Date</th>
                          <th className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-left">Method</th>
                          <th className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-right">Amount</th>
                          <th className="px-6 py-3 w-10 text-center font-black text-[10px] uppercase tracking-widest">Actions</th>
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
                    <Plus className="h-4 w-4" /> New Expense
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col">
                {/* Search Bar */}
                <div className="p-4 border-b border-border/40 bg-white">
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
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/10 text-muted-foreground border-b border-border/40">
                          <tr>
                            <th className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-left">Date</th>
                            <th className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-left">Place</th>
                            <th className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-left">Description</th>
                            <th className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-left">Category</th>
                            <th className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-right">Amount</th>
                            <th className="px-6 py-3 w-10 text-center">Actions</th>
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

                    {/* Pagination Controls */}
                    {totalExpensePages > 1 && (
                      <div className="p-4 border-t border-border/40 flex items-center justify-between bg-white mt-auto">
                        <p className="text-[10px] text-muted-foreground">
                          Showing {(expenseCurrentPage - 1) * itemsPerPage + 1} - {Math.min(expenseCurrentPage * itemsPerPage, filteredExpenses.length)} of {filteredExpenses.length}
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
                      {expenseSearchTerm ? 'No expenses found matching your search' : 'Log your expenses to track detailed job costs'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Labor */}
            <Card className="border-border/40 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/5">
                <CardTitle className="text-xl font-serif">Labor</CardTitle>
                <Button variant="outline" size="sm" className="h-8 gap-1 font-bold" onClick={() => setIsAddingLabor(true)}>
                  <Plus className="h-4 w-4" /> New Time Entry
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {timeEntries.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/10 text-muted-foreground border-b border-border/40">
                        <tr>
                          <th className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-left">Date</th>
                          <th className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-left">Employee</th>
                          <th className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-center">Duration</th>
                          <th className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-right">Rate</th>
                          <th className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-right">Total</th>
                          <th className="px-6 py-3 w-10 text-center">Action</th>
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
                ) : (
                  <div className="py-12 text-center flex flex-col items-center gap-2 opacity-60 bg-white">
                    <Clock className="h-10 w-10 text-muted-foreground" />
                    <p className="text-xs font-medium px-8 text-center">Time tracked to this job by you or your team will show here</p>
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
            <Button onClick={handleGenerateMaterials} disabled={isGeneratingMaterials} className="bg-[#306C3E] hover:bg-[#265832]">
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
              <Button type="submit" disabled={isSodimacLoading} className="bg-[#306C3E] hover:bg-[#265832]">
                {isSodimacLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                Search
              </Button>
            </form>

            <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: '50vh' }}>
              {isSodimacLoading ? (
                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground opacity-60">
                  <Loader2 className="h-8 w-8 animate-spin mb-4 text-[#306C3E]" />
                  <p>Searching {searchStore === 'ace' ? 'Ace Hardware' : 'Home Depot'}...</p>
                </div>
              ) : sodimacResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sodimacResults.map((result, idx) => (
                    <div key={idx} className="border border-border/50 rounded-lg p-3 flex gap-4 bg-muted/10 hover:bg-muted/30 transition-colors">
                      <div className="h-16 w-16 bg-white rounded flex-shrink-0 flex items-center justify-center border border-border/50">
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
                  <p>Escribe un término y presiona Buscar</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

      {isEmailingMaterials && (
        <EmailMaterialsModal
          proformaId={id}
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
          <DialogHeader className="p-4 bg-white/10 backdrop-blur-md absolute top-0 left-0 right-0 z-10 flex flex-row items-center justify-between">
            <DialogTitle className="text-white text-sm font-bold flex items-center gap-2">
              <Eye className="h-4 w-4" /> Receipt View
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 h-8 gap-2 font-bold"
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

      {/* Deletion Confirmation Dialogs */}
      <Dialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Item</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar "{itemToDelete?.description}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setItemToDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => handleDeleteItem(itemToDelete.id)}>Eliminar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!paymentToDelete} onOpenChange={(open) => !open && setPaymentToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Pago</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este pago de ${Number(paymentToDelete?.amount).toLocaleString()}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setPaymentToDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => handleDeletePayment(paymentToDelete.id)}>Eliminar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!expenseToDelete} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Gasto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el gasto "{expenseToDelete?.description || expenseToDelete?.place}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setExpenseToDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => handleDeleteExpense(expenseToDelete.id)}>Eliminar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!laborToDelete} onOpenChange={(open) => !open && setLaborToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Labor</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta entrada de labor para {laborToDelete?.user_name}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setLaborToDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => handeDeleteLabor(laborToDelete.id)}>Eliminar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Tarea</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la tarea "{taskToDelete?.title}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setTaskToDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => handleDeleteTask(taskToDelete.id)}>Eliminar</Button>
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
    </div>
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
      <DialogContent className="sm:max-w-md">
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
            <Button type="submit" className="flex-1 bg-[#306C3E] hover:bg-[#265832]" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : payment ? 'Update Payment' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
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
      toast.error('Error saving expense');
    } else {
      toast.success('Expense saved successfully');
      onSuccess();
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>Log a purchase or cost for this job.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
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
            <Button type="submit" className="flex-1 bg-[#0D3B47] hover:bg-[#072a33]" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Expense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
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
      toast.error('Error updating expense');
    } else {
      toast.success('Expense updated successfully');
      onSuccess();
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Pencil className="h-4 w-4" /> Edit Expense</DialogTitle>
          <DialogDescription>Update the details of this expense.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
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
            <Button type="submit" className="flex-1 bg-[#306C3E] hover:bg-[#265832]" disabled={isSubmitting}>
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
      <DialogContent className="sm:max-w-md">
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

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-[#0D3B47] hover:bg-[#072a33]" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : entry ? 'Update Labor' : 'Log Time Entry'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
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
      toast.error('Error scheduling visit');
    } else {
      toast.success('Visit scheduled successfully');
      onSuccess();
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule New Visit</DialogTitle>
          <DialogDescription>Plan an on-site visit for this job.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="assigned_name">Assign To</Label>
            <Input id="assigned_name" name="assigned_name" placeholder="Full name" required />
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

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-[#306C3E] hover:bg-[#265832]" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Schedule Visit'}
            </Button>
          </div>
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
      <DialogContent className="sm:max-w-md">
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

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-[#0D3B47] hover:bg-[#072a33]" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : task ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


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

  const supabase = createClient();

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

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Proforma Item</DialogTitle>
          <DialogDescription>Add a product or service line item to this proforma.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="description">Product / Service</Label>
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger render={<div className="relative" />}>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Item name"
                  autoComplete="off"
                  required
                />
                {itemPresets.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-0 hover:bg-transparent"
                    onClick={() => setComboboxOpen(!comboboxOpen)}
                  >
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", comboboxOpen && "rotate-180")} />
                  </Button>
                )}
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search existing items..." />
                  <CommandList className="max-h-[300px] overflow-y-auto">
                    <CommandEmpty>No previous items found.</CommandEmpty>
                    <CommandGroup heading="Recent Items">
                      {itemPresets.map((preset, idx) => (
                        <CommandItem
                          key={idx}
                          value={preset.description}
                          onSelect={() => handleSelectPreset(preset)}
                          className="flex flex-col items-start gap-1 py-3 px-4 cursor-pointer"
                        >
                          <div className="flex w-full items-center justify-between">
                            <span className="font-bold">{preset.description}</span>
                            <span className="text-xs font-bold text-emerald-600">$ {preset.unit_price.toFixed(2)}</span>
                          </div>
                          {preset.details && (
                            <div className="text-xs text-muted-foreground truncate w-full">
                              {preset.details}
                            </div>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Details</Label>
            <textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Detailed description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                step="0.01"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_price">Unit Price</Label>
              <Input
                id="unit_price"
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Estimated Cost</Label>
              <Input
                id="cost"
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="is_optional_modal"
                checked={isOptional}
                onCheckedChange={(checked) => setIsOptional(checked as boolean)}
              />
              <Label htmlFor="is_optional_modal">Is optional?</Label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-[#0D3B47] hover:bg-[#072a33]" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Item'}
            </Button>
          </div>
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
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-[#306C3E]" />
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

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-[#306C3E] hover:bg-[#265832]" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Material'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
