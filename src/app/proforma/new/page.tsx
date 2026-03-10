'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, ArrowLeft, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface LineItem {
  id: string; // temp client-side id
  description: string;
  quantity: number;
  unit_price: number;
}

interface CatalogItem {
  description: string;
  unit_price: number;
}

export default function NewProforma() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Client Details
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Project Details
  const [projectName, setProjectName] = useState('');
  const [validUntil, setValidUntil] = useState('');

  // Line Items
  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0 }
  ]);

  const [catalog, setCatalog] = useState<CatalogItem[]>([]);

  useEffect(() => {
    const fetchCatalog = async () => {
      const { data } = await supabase
        .from('proforma_items')
        .select('description, unit_price')
        .limit(1000); // Fetch recent items for autocomplete

      if (data) {
        const unique = new Map<string, number>();
        // Reverse so we process the most recently inserted items first, prioritizing their prices
        [...data].reverse().forEach(item => {
          if (!unique.has(item.description)) {
            unique.set(item.description, item.unit_price);
          }
        });
        setCatalog(Array.from(unique.entries()).map(([desc, price]) => ({ description: desc, unit_price: price })));
      }
    };
    fetchCatalog();
  }, []);

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const updateItemFields = (id: string, updates: Partial<LineItem>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  // Calculations
  const calculateSubtotal = () => {
    return items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
  };

  const subtotal = calculateSubtotal();
  const tax = subtotal * 0.16; // Assuming 16% IVA for example, can be made dynamic
  const total = subtotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Create or get Client
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert([{ name: clientName, email: clientEmail, phone: clientPhone }])
        .select()
        .single();

      if (clientError) throw clientError;

      // 2. Create Proforma
      const { data: proformaData, error: proformaError } = await supabase
        .from('proformas')
        .insert([{
          client_id: clientData.id,
          project_name: projectName,
          valid_until: validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 30 days
          subtotal,
          tax,
          total
        }])
        .select()
        .single();

      if (proformaError) throw proformaError;

      // 3. Create Line Items
      const itemsToInsert = items.map(item => ({
        proforma_id: proformaData.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price
      }));

      const { error: itemsError } = await supabase
        .from('proforma_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Success, redirect to view page
      router.push(`/proforma/${proformaData.id}`);
      router.refresh();

    } catch (error) {
      console.error('Error saving proforma:', error);
      alert('Error al guardar la proforma. Por favor intenta de nuevo.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-in fade-in duration-500">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-2 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Link>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Nueva Proforma</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Client & Project Details Segment */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-serif">Datos del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nombre o Empresa *</Label>
                <Input id="clientName" required placeholder="Ej. Juan Pérez" value={clientName} onChange={e => setClientName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Email</Label>
                  <Input id="clientEmail" type="email" placeholder="correo@ejemplo.com" value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Teléfono</Label>
                  <Input id="clientPhone" placeholder="+123456789" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-serif">Detalles del Proyecto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Nombre del Proyecto *</Label>
                <Input id="projectName" required placeholder="Ej. Remodelación Sala Principal" value={projectName} onChange={e => setProjectName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validUntil">Válida Hasta *</Label>
                <Input id="validUntil" type="date" required value={validUntil} onChange={e => setValidUntil(e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Line Items Segment */}
        <Card className="shadow-sm border-border/50 overflow-visible">
          <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-serif">Conceptos de Cotización</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem} className="text-primary border-primary/20 hover:bg-primary/5">
              <PlusCircle className="mr-2 h-4 w-4" />
              Agregar Ítem
            </Button>
          </CardHeader>
          <CardContent>
            <datalist id="catalog-descriptions">
              {catalog.map(c => <option key={c.description} value={c.description} />)}
            </datalist>
            <div className="space-y-4">
              <div className="hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b border-border/50 mb-4 px-2 tracking-wide uppercase text-xs">
                <div className="col-span-6">Descripción</div>
                <div className="col-span-2 text-right">Cant.</div>
                <div className="col-span-2 text-right">P. Unitario ($)</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end sm:items-center relative bg-muted/20 p-4 md:p-2 rounded-lg md:bg-transparent">
                  <div className="col-span-1 md:col-span-6 space-y-2 md:space-y-0">
                    <Label className="md:hidden text-xs text-muted-foreground uppercase tracking-wider">Descripción</Label>
                    <Input
                      placeholder="Mueble TV en Roble a medida..."
                      list="catalog-descriptions"
                      value={item.description}
                      required
                      onChange={(e) => {
                        const val = e.target.value;
                        const matched = catalog.find(c => c.description === val);
                        if (matched) {
                          updateItemFields(item.id, { description: val, unit_price: matched.unit_price });
                        } else {
                          updateItem(item.id, 'description', val);
                        }
                      }}
                      className="bg-background"
                      autoComplete="off"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-2 md:space-y-0">
                    <Label className="md:hidden text-xs text-muted-foreground uppercase tracking-wider">Cantidad</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity || ''}
                      required
                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      className="text-right bg-background"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-2 md:space-y-0">
                    <Label className="md:hidden text-xs text-muted-foreground uppercase tracking-wider">P. Unitario ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price || ''}
                      required
                      onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="text-right bg-background"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 flex items-center justify-between md:justify-end gap-4 mt-2 md:mt-0">
                    <div className="md:hidden text-sm font-medium">Subtotal:</div>
                    <div className="text-right font-medium text-foreground min-w-[80px]">
                      ${(item.quantity * item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals Section */}
            <div className="mt-8 border-t border-border/50 pt-6 flex flex-col items-end space-y-3 px-2">
              <div className="flex justify-between w-full sm:w-64 text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between w-full sm:w-64 text-sm border-b border-border/50 pb-3 relative">
                <span className="text-muted-foreground">IVA (16%):</span>
                <span className="font-medium">${tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between w-full sm:w-64 text-lg font-serif font-bold text-primary pt-1">
                <span>Total:</span>
                <span>${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4 pb-12">
          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:-translate-y-1">
            <Save className="mr-2 h-5 w-5" />
            {isSubmitting ? 'Guardando Proforma...' : 'Generar y Guardar Proforma'}
          </Button>
        </div>
      </form>
    </div>
  );
}
