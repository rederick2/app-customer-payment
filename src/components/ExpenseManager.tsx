'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Receipt, 
  Trash2, 
  Loader2, 
  Camera, 
  Upload,
  Calendar as CalendarIcon,
  Tag,
  MapPin,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import ReceiptScanner from '@/components/ReceiptScanner';

type Expense = {
  id: string;
  description: string;
  place: string;
  category: string;
  amount: number;
  date: string;
  image_url: string | null;
  created_at: string;
};

type ExpenseManagerProps = {
  proformaId: string;
};

export default function ExpenseManager({ proformaId }: ExpenseManagerProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const supabase = createClient();

  const fetchExpenses = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('job_expenses')
      .select('*')
      .eq('proforma_id', proformaId)
      .order('date', { ascending: false });

    if (error) {
      toast.error('Error al cargar gastos');
    } else {
      setExpenses(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, [proformaId]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('job_expenses')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Error al eliminar gasto');
    } else {
      setExpenses(prev => prev.filter(e => e.id !== id));
      toast.success('Gasto eliminado');
    }
  };

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0D3B47]">Gastos del Proyecto</h2>
          <p className="text-sm text-muted-foreground">Gestiona las compras y boletas de este job.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2 border-primary/20 hover:bg-primary/5"
            onClick={() => setIsScanning(true)}
          >
            <Camera className="h-4 w-4" />
            Scanner AI
          </Button>
          <Button 
            className="gap-2 bg-[#306C3E] hover:bg-[#265832]"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4" />
            Nuevo Gasto
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#F4F2EC] border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Gastado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#306C3E]">
              ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border/50">
              <tr>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Fecha</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Lugar</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Descripción</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Categoría</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-right">Monto</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-center">Recibo</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No hay gastos registrados para este proyecto.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">{format(new Date(expense.date), 'dd/MM/yyyy')}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{expense.place}</td>
                    <td className="px-4 py-3">{expense.description}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-tight">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#0D3B47]">
                      ${Number(expense.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {expense.image_url ? (
                        <a href={expense.image_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          <Receipt className="h-4 w-4 mx-auto" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground/30">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-600 hove:bg-red-50"
                        onClick={() => handleDelete(expense.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {isAdding && (
         <ExpenseFormModal 
          proformaId={proformaId} 
          onClose={() => setIsAdding(false)} 
          onSuccess={() => {
            setIsAdding(false);
            fetchExpenses();
          }} 
        />
      )}

      {isScanning && (
        <ReceiptScanner 
          proformaId={proformaId} 
          onClose={() => setIsScanning(false)} 
          onSuccess={() => {
            setIsScanning(false);
            fetchExpenses();
          }} 
        />
      )}
    </div>
  );
}

function ExpenseFormModal({ proformaId, onClose, onSuccess }: { proformaId: string, onClose: () => void, onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
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
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="date" name="date" type="date" className="pl-9" defaultValue={new Date().toISOString().split('T')[0]} required />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-[#306C3E] hover:bg-[#265832]" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar Gasto'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
