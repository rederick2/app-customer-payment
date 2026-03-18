'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { PlusCircle, Trash2, ArrowLeft, Save, Upload, X, Check, ChevronsUpDown, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Autocomplete from 'react-google-autocomplete';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Percent, DollarSign } from 'lucide-react';

// DND Kit Imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { GripVertical } from 'lucide-react';

interface LineItem {
  id: string; // temp client-side id or database uuid
  description: string;
  details: string;
  quantity: number;
  unit_price: number;
  is_optional: boolean;
  is_excluded?: boolean;
  sort_order: number;
  photo?: File | null;
  photoPreviewUrl?: string;
  existingPhotoUrl?: string;
}

interface Tax {
  id: string;
  name: string;
  percentage: number;
}

interface Adjustment {
  id: string;
  label: string;
  type: 'tax' | 'discount';
  valueType: 'percentage' | 'amount';
  value: number;
}

interface CatalogItem {
  description: string;
  unit_price: number;
}

interface Client {
  id: string;
  name?: string | null;
  title: string | null;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  street_1: string | null;
  street_2: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
}

interface ProformaFormProps {
  initialData?: {
    proforma: any;
    items: any[];
    client: any;
  };
  mode: 'create' | 'edit';
}

interface SortableItemProps {
  item: LineItem;
  index: number;
  catalog: CatalogItem[];
  updateItem: (id: string, field: keyof LineItem, value: any) => void;
  updateItemFields: (id: string, updates: Partial<LineItem>) => void;
  handlePhotoUpload: (id: string, file: File | null) => void;
  removePhoto: (id: string) => void;
  removeItem: (id: string) => void;
  showRemoveButton: boolean;
}

function SortableItem({
  item,
  catalog,
  updateItem,
  updateItemFields,
  handlePhotoUpload,
  removePhoto,
  removeItem,
  showRemoveButton
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative bg-white border border-border/40 rounded-xl mb-4 overflow-hidden transition-all duration-300",
        isDragging ? "shadow-2xl ring-2 ring-primary/20 z-50 scale-[1.02]" : "hover:border-primary/20 hover:shadow-md",
        item.is_optional && "bg-muted/5 opacity-80"
      )}
    >
      <div className="flex items-start gap-4 p-6">
        {/* Drag Handle & Optional Checkbox Area */}
        <div className="flex flex-col items-center gap-4 pt-4">
          <div
            {...attributes}
            {...listeners}
            className="p-1.5 rounded-lg hover:bg-muted cursor-grab active:cursor-grabbing text-muted-foreground group-hover:text-muted-foreground/40 transition-colors"
          >
            <GripVertical className="h-6 w-6" />
          </div>
        </div>

        <div className="flex-1 space-y-6">
          {/* Main Context Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
            <div className="md:col-span-5 space-y-2">
              <Label>Nombre del Item *</Label>
              <Input
                placeholder="Nombre del producto o servicio..."
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
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label className="text-center block">Cantidad *</Label>
              <Input
                type="number"
                min="1"
                value={item.quantity || ''}
                required
                onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                className="text-center font-bold"
              />
            </div>

            <div className="md:col-span-2 space-y-2 text-right">
              <Label className="px-2">Precio Unitario *</Label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price || ''}
                  required
                  onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                  className="text-right font-bold pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/40 pointer-events-none">USD</span>
              </div>
            </div>

            <div className="md:col-span-2 space-y-2 text-right">
              <Label className="px-2 text-muted-foreground/60">Total</Label>
              <div className="h-10 flex items-center justify-end font-bold text-primary text-lg tracking-tight pr-2">
                ${(item.quantity * item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="md:col-span-1 flex items-center justify-center pt-8">
              {showRemoveButton && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  className="text-muted-foreground/20 hover:text-destructive hover:bg-destructive/10 transition-colors h-10 w-10 rounded-xl"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Description & Photo Row */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-2">
              <Label>Descripción</Label>
              <Textarea
                placeholder="Descripción detallada del producto o materiales..."
                value={item.details}
                onChange={(e) => updateItem(item.id, 'details', e.target.value)}
                className="min-h-[100px] bg-muted/5 border-dashed border-border/60 focus:border-primary/20 text-md leading-relaxed rounded-xl p-4 resize-none"
              />
            </div>

            <div className="lg:col-span-1 space-y-2">
              <Label>Foto del Item</Label>
              <div className="relative h-32 w-full rounded-2xl overflow-hidden border-2 border-border/40 bg-muted/10 group/img flex items-center justify-center hover:border-primary/20 transition-all shadow-sm">
                {item.photoPreviewUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.photoPreviewUrl} alt="Preview" className="object-cover w-full h-full transition-transform duration-500 group-hover/img:scale-110" />
                    <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover/img:opacity-100 transition-all translate-x-2 group-hover/img:translate-x-0">
                      <label className="h-8 w-8 rounded-lg bg-white/90 backdrop-blur-md shadow-xl border border-border/20 flex items-center justify-center cursor-pointer text-primary hover:bg-white transition-all">
                        <Pencil className="h-4 w-4" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handlePhotoUpload(item.id, e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removePhoto(item.id)}
                        className="h-8 w-8 rounded-lg shadow-xl bg-destructive/90 backdrop-blur-md border border-white/10 hover:bg-destructive transition-all"
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground/20 cursor-pointer hover:bg-muted/20 transition-colors">
                    <Upload className="h-8 w-8 stroke-[1.5px]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Agregar Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handlePhotoUpload(item.id, e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Optional Toggle Row */}
          <div className="pt-4 flex items-center">
            <div className="flex items-center gap-3 bg-muted/10 px-4 py-2 rounded-xl border border-border/40 hover:bg-muted/20 transition-all cursor-pointer group/opt">
              <Checkbox
                id={`opt-${item.id}`}
                checked={item.is_optional}
                onCheckedChange={(checked) => updateItem(item.id, 'is_optional', !!checked)}
                className="h-5 w-5 rounded-md border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all group-hover/opt:scale-110"
              />
              <Label htmlFor={`opt-${item.id}`} className="text-xs font-medium text-muted-foreground cursor-pointer select-none">Marcar como opcional</Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProformaForm({ initialData, mode }: ProformaFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clients Database
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>(initialData?.client?.id || 'new');
  const [comboboxOpen, setComboboxOpen] = useState(false);

  // Client Details
  const [companyName, setCompanyName] = useState(initialData?.client?.company_name || '');
  const [title, setTitle] = useState(initialData?.client?.title || '');
  const [firstName, setFirstName] = useState(initialData?.client?.first_name || '');
  const [lastName, setLastName] = useState(initialData?.client?.last_name || '');
  const [clientEmail, setClientEmail] = useState(initialData?.client?.email || '');
  const [clientPhone, setClientPhone] = useState(initialData?.client?.phone || '');

  // Address Details
  const [street1, setStreet1] = useState(initialData?.client?.street_1 || '');
  const [street2, setStreet2] = useState(initialData?.client?.street_2 || '');
  const [city, setCity] = useState(initialData?.client?.city || '');
  const [province, setProvince] = useState(initialData?.client?.province || '');
  const [postalCode, setPostalCode] = useState(initialData?.client?.postal_code || '');
  const [country, setCountry] = useState(initialData?.client?.country || '');

  // Project Details
  const [projectName, setProjectName] = useState(initialData?.proforma?.project_name || '');
  const [validUntil, setValidUntil] = useState(initialData?.proforma?.valid_until || '');

  // Line Items
  const [items, setItems] = useState<LineItem[]>(
    initialData?.items?.map(item => ({
      id: item.id,
      description: item.description,
      details: item.details || '',
      quantity: item.quantity,
      unit_price: item.unit_price,
      is_optional: item.is_optional || false,
      sort_order: item.sort_order || 0,
      existingPhotoUrl: item.photo_url,
      photoPreviewUrl: item.photo_url
    })).sort((a, b) => a.sort_order - b.sort_order) || [
      { id: crypto.randomUUID(), description: '', details: '', quantity: 1, unit_price: 0, is_optional: false, photo: null, sort_order: 0 }
    ]
  );

  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [availableTaxes, setAvailableTaxes] = useState<Tax[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>(
    initialData?.proforma?.adjustments || []
  );

  // New States for Dialogs
  const [isTaxDialogOpen, setIsTaxDialogOpen] = useState(false);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [newTaxName, setNewTaxName] = useState("");
  const [newTaxPercent, setNewTaxPercent] = useState("");
  const [depositAmount, setDepositAmount] = useState<number>(initialData?.proforma?.deposit_amount || 0);
  const [paymentTerms, setPaymentTerms] = useState<string>(initialData?.proforma?.payment_terms || "");
  const [isSavingTax, setIsSavingTax] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: taxesData } = await supabase
          .from('taxes')
          .select('*')
          .eq('user_id', user.id);
        if (taxesData) setAvailableTaxes(taxesData);
      }

      const { data: clientsData } = await supabase.from('clients').select('*').order('name');
      if (clientsData) setClients(clientsData);

      const { data: catalogData } = await supabase
        .from('proforma_items')
        .select('description, unit_price')
        .limit(1000);

      if (catalogData) {
        const unique = new Map<string, number>();
        [...catalogData].reverse().forEach(item => {
          if (!unique.has(item.description)) {
            unique.set(item.description, item.unit_price);
          }
        });
        setCatalog(Array.from(unique.entries()).map(([desc, price]) => ({ description: desc, unit_price: price })));
      }
    };
    fetchData();
  }, [supabase]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prevItems) => {
        const oldIndex = prevItems.findIndex((item) => item.id === active.id);
        const newIndex = prevItems.findIndex((item) => item.id === over.id);
        return arrayMove(prevItems, oldIndex, newIndex);
      });
    }
  };

  const handlePlaceSelected = (place: any) => {
    let streetNumber = '';
    let route = '';
    let locality = '';
    let administrativeArea = '';
    let countryName = '';
    let code = '';

    place.address_components?.forEach((component: any) => {
      const types = component.types;
      if (types.includes('street_number')) streetNumber = component.long_name;
      if (types.includes('route')) route = component.long_name;
      if (types.includes('locality')) locality = component.long_name;
      if (types.includes('administrative_area_level_1')) administrativeArea = component.long_name;
      if (types.includes('country')) countryName = component.long_name;
      if (types.includes('postal_code')) code = component.long_name;
    });

    setStreet1(`${route} ${streetNumber}`.trim());
    setCity(locality);
    setProvince(administrativeArea);
    setCountry(countryName);
    setPostalCode(code);
  };

  const handleClientSelect = (value: string | null) => {
    if (!value) return;
    setSelectedClientId(value);
    setComboboxOpen(false);

    if (value === 'new') {
      setTitle('');
      setFirstName('');
      setLastName('');
      setCompanyName('');
      setClientEmail('');
      setClientPhone('');
      setStreet1('');
      setStreet2('');
      setCity('');
      setProvince('');
      setPostalCode('');
      setCountry('');
    } else {
      const client = clients.find(c => c.id === value);
      if (client) {
        setTitle(client.title || '');
        setFirstName(client.first_name || '');
        setLastName(client.last_name || '');
        setCompanyName(client.company_name || '');
        setClientEmail(client.email || '');
        setClientPhone(client.phone || '');
        setStreet1(client.street_1 || '');
        setStreet2(client.street_2 || '');
        setCity(client.city || '');
        setProvince(client.province || '');
        setPostalCode(client.postal_code || '');
        setCountry(client.country || '');
      }
    }
  };

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), description: '', details: '', quantity: 1, unit_price: 0, is_optional: false, photo: null, sort_order: items.length }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => {
        if (item.photoPreviewUrl && !item.existingPhotoUrl) URL.revokeObjectURL(item.photoPreviewUrl);
        return item.id !== id;
      }));
    }
  };

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const updateItemFields = (id: string, updates: Partial<LineItem>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handlePhotoUpload = (id: string, file: File | null) => {
    setItems(items.map(item => {
      if (item.id === id) {
        if (item.photoPreviewUrl && !item.existingPhotoUrl) URL.revokeObjectURL(item.photoPreviewUrl);
        return {
          ...item,
          photo: file,
          photoPreviewUrl: file ? URL.createObjectURL(file) : item.existingPhotoUrl,
          // Si quitamos la foto (file null), mantenemos el existingPhotoUrl a menos que queramos borrarlo explícitamente.
          // Pero en el UI, si le da a la 'X', llamamos con null. 
        };
      }
      return item;
    }));
  };

  const removePhoto = (id: string) => {
    setItems(items.map(item => {
      if (item.id === id) {
        if (item.photoPreviewUrl && !item.existingPhotoUrl) URL.revokeObjectURL(item.photoPreviewUrl);
        return { ...item, photo: null, photoPreviewUrl: undefined, existingPhotoUrl: undefined };
      }
      return item;
    }));
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, item) => {
      if (item.is_optional || item.is_excluded) return acc;
      return acc + (item.quantity * item.unit_price);
    }, 0);
  };

  const addItemAdjustment = () => {
    setAdjustments([...adjustments, {
      id: crypto.randomUUID(),
      label: 'Nuevo Impuesto',
      type: 'tax',
      valueType: 'percentage',
      value: 0
    }]);
  };

  const removeAdjustment = (id: string) => {
    setAdjustments(adjustments.filter(a => a.id !== id));
  };

  const updateAdjustment = (id: string, field: keyof Adjustment, value: any) => {
    setAdjustments(adjustments.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const subtotal = calculateSubtotal();

  const discountAdjustment = adjustments.find(a => a.type === 'discount');
  const totalDiscount = discountAdjustment 
    ? (discountAdjustment.valueType === 'percentage' 
        ? (subtotal * discountAdjustment.value) / 100 
        : discountAdjustment.value)
    : 0;

  const taxableAmount = subtotal - totalDiscount;
  const taxAdjustment = adjustments.find(a => a.type === 'tax');
  const totalTax = taxAdjustment 
    ? (taxableAmount * taxAdjustment.value) / 100 
    : 0;

  const total = taxableAmount + totalTax;

  const calculatedAdjustments = adjustments.map(adj => {
    if (adj.type === 'discount') return { ...adj, amount: totalDiscount };
    if (adj.type === 'tax') return { ...adj, amount: totalTax };
    return { ...adj, amount: 0 };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalClientId = selectedClientId;
      const clientPayload = {
        title,
        first_name: firstName,
        last_name: lastName,
        company_name: companyName || null,
        email: clientEmail || null,
        phone: clientPhone || null,
        street_1: street1 || null,
        street_2: street2 || null,
        city: city || null,
        province: province || null,
        postal_code: postalCode || null,
        country: country || null
      };

      if (selectedClientId === 'new') {
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .insert([clientPayload])
          .select()
          .single();
        if (clientError) throw clientError;
        finalClientId = clientData.id;
      } else {
        await supabase.from('clients').update(clientPayload).eq('id', selectedClientId);
      }

      const proformaPayload = {
        client_id: finalClientId,
        project_name: projectName,
        valid_until: validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        subtotal,
        tax: totalTax,
        total,
        adjustments: adjustments,
        payment_terms: paymentTerms,
        deposit_amount: depositAmount
      };

      let proformaData;
      if (mode === 'edit' && initialData?.proforma?.id) {
        const { data, error } = await supabase
          .from('proformas')
          .update(proformaPayload)
          .eq('id', initialData.proforma.id)
          .select()
          .single();
        if (error) throw error;
        proformaData = data;
      } else {
        const { data, error } = await supabase
          .from('proformas')
          .insert([proformaPayload])
          .select()
          .single();
        if (error) throw error;
        proformaData = data;
      }

      // Handle Line Items
      if (mode === 'edit') {
        await supabase.from('proforma_items').delete().eq('proforma_id', proformaData.id);
      }

      const itemsToInsert = await Promise.all(items.map(async (item, index) => {
        let photo_url = item.existingPhotoUrl || null;

        if (item.photo) {
          try {
            const uploadFormData = new FormData();
            uploadFormData.append('file', item.photo);
            uploadFormData.append('folder', `proforma-items/${proformaData.id}`);

            const response = await fetch('/api/upload', { method: 'POST', body: uploadFormData });
            if (response.ok) {
              const { url } = await response.json();
              photo_url = url;
            }
          } catch (uploadErr) {
            console.error('Error uploading photo:', uploadErr);
          }
        }

        return {
          proforma_id: proformaData.id,
          description: item.description,
          details: item.details,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price,
          is_optional: item.is_optional,
          sort_order: index, // Use current array index as sort_order
          photo_url: photo_url
        };
      }));

      const { error: itemsError } = await supabase.from('proforma_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;

      toast.success(mode === 'edit' ? 'Proforma actualizada' : 'Proforma creada');
      router.push(`/proforma/${proformaData.id}`);
      router.refresh();

    } catch (error) {
      console.error('Error saving proforma:', error);
      toast.error('Error al guardar la proforma');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-in fade-in duration-500">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href={mode === 'edit' ? `/proforma/${initialData?.proforma?.id}` : "/"} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-2 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {mode === 'edit' ? 'Volver a la Proforma' : 'Volver al Dashboard'}
          </Link>
          <h1 className="font-serif text-3xl font-bold tracking-tight">
            {mode === 'edit' ? 'Editar Proforma' : 'Nueva Proforma'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-serif">Datos del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mode === 'create' && (
                <div className="space-y-2">
                  <Label>Seleccionar Cliente</Label>
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                    <PopoverTrigger
                      role="combobox"
                      aria-expanded={comboboxOpen}
                      className="w-full justify-between h-auto py-3 font-normal bg-background inline-flex items-center px-4 rounded-md border border-input ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {selectedClientId === 'new' ? (
                        <span className="text-muted-foreground text-left flex-1">Seleccionar un cliente...</span>
                      ) : (() => {
                        const selectedClient = clients.find(c => c.id === selectedClientId);
                        return selectedClient ? (
                          <div className="text-left flex-1 min-w-0">
                            <div className="font-bold text-foreground truncate">
                              {selectedClient.company_name || selectedClient.first_name || selectedClient.name}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {selectedClient.first_name && selectedClient.company_name && <span>Atte: {selectedClient.first_name} {selectedClient.last_name} &bull; </span>}
                              {selectedClient.street_1 || selectedClient.email || 'Sin detalles adicionales'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-left flex-1">Seleccionar un cliente...</span>
                        );
                      })()}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar clientes..." />
                        <CommandList>
                          <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                          <CommandGroup>
                            {clients.map((client) => {
                              const nameDisplay = [client.title, client.first_name, client.last_name].filter(Boolean).join(' ') || client.name;
                              return (
                                <CommandItem
                                  key={client.id}
                                  value={`${client.company_name} ${nameDisplay} ${client.email}`}
                                  onSelect={() => handleClientSelect(client.id)}
                                  className="flex flex-col items-start gap-1 py-3 px-4 cursor-pointer"
                                >
                                  <div className="flex w-full items-center justify-between">
                                    <span className="font-bold">{client.company_name || nameDisplay}</span>
                                    {selectedClientId === client.id && <Check className="h-4 w-4 text-primary" />}
                                  </div>
                                  <div className="text-sm text-muted-foreground w-full truncate space-x-1">
                                    {client.company_name && <span>Atte: {nameDisplay}</span>}
                                    {client.company_name && client.street_1 && <span>&bull;</span>}
                                    {client.street_1 && <span>{client.street_1}</span>}
                                    {client.street_1 && client.email && <span>&bull;</span>}
                                    {client.email && <span>{client.email}</span>}
                                  </div>
                                </CommandItem>
                              )
                            })}
                          </CommandGroup>
                        </CommandList>
                        <div className="border-t p-2">
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full justify-start text-primary font-medium hover:text-primary hover:bg-primary/10"
                            onClick={() => handleClientSelect('new')}
                          >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Crear nuevo cliente
                          </Button>
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {(selectedClientId === 'new' || mode === 'edit') && (
                <div className={cn("space-y-4 pt-4 border-t mt-4 border-border/50", mode === 'edit' && "border-t-0 pt-0 mt-0")}>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Razón Social o Compañía (Opcional)</Label>
                    <Input id="companyName" placeholder="Ej. Empresa SA" value={companyName} onChange={e => setCompanyName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título</Label>
                      <Input id="title" placeholder="Sr., Sra., Ing." value={title} onChange={e => setTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nombre *</Label>
                      <Input id="firstName" required placeholder="Ej. Juan" value={firstName} onChange={e => setFirstName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Apellido *</Label>
                      <Input id="lastName" required placeholder="Ej. Pérez" value={lastName} onChange={e => setLastName(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border/10">
                    <Label htmlFor="street1">Línea de Calle 1 (Busca con Google) *</Label>
                    <Autocomplete
                      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                      onPlaceSelected={handlePlaceSelected}
                      options={{ types: ["address"] }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Empieza a escribir una dirección..."
                      defaultValue={street1}
                      onChange={(e: any) => setStreet1(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="street2">Línea de Calle 2 (Opcional)</Label>
                    <Input id="street2" placeholder="Departamento, Suite, Piso..." value={street2} onChange={e => setStreet2(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Ciudad</Label>
                      <Input id="city" placeholder="Ej. Madrid" value={city} onChange={e => setCity(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="province">Provincia / Estado</Label>
                      <Input id="province" placeholder="Ej. Madrid" value={province} onChange={e => setProvince(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Código Postal</Label>
                      <Input id="postalCode" placeholder="28001" value={postalCode} onChange={e => setPostalCode(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">País</Label>
                      <Input id="country" placeholder="España" value={country} onChange={e => setCountry(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/10">
                    <div className="space-y-2">
                      <Label htmlFor="clientEmail">Email (Opcional)</Label>
                      <Input id="clientEmail" type="email" placeholder="correo@ejemplo.com" value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientPhone">Teléfono (Opcional)</Label>
                      <Input id="clientPhone" placeholder="+123456789" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}
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

        <Card className="shadow-sm border-none bg-muted/20 overflow-visible rounded-3xl" >
          <CardHeader className="pb-8 px-10 pt-10 flex flex-row items-center justify-between">
            <CardTitle className="text-2xl font-serif font-bold tracking-tight">Conceptos de Cotización</CardTitle>
          </CardHeader>
          <CardContent className="px-10 pb-10">
            <datalist id="catalog-descriptions">
              {catalog.map(c => <option key={c.description} value={c.description} />)}
            </datalist>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <div className="space-y-4">
                <SortableContext
                  items={items.map(i => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {items.map((item, index) => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      index={index}
                      catalog={catalog}
                      updateItem={updateItem}
                      updateItemFields={updateItemFields}
                      handlePhotoUpload={handlePhotoUpload}
                      removePhoto={removePhoto}
                      removeItem={removeItem}
                      showRemoveButton={items.length > 1}
                    />
                  ))}
                </SortableContext>
              </div>
            </DndContext>

            {/* List Footer Actions (Matching reference image) */}
            <div className="mt-8 flex gap-4">
              <Button
                type="button"
                onClick={addItem}
                className="bg-primary text-white font-bold px-10 h-14 rounded-2xl shadow-xl transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3 uppercase text-[10px] tracking-[0.2em]"
              >
                <PlusCircle className="h-4 w-4" />
                Agregar Ítem
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 border-t border-border/50 pt-6 flex flex-col items-end space-y-4 px-2">
          {/* Subtotal */}
          <div className="flex justify-between w-full sm:w-80 text-sm font-bold pt-2 border-b border-border/10 pb-4">
            <span className="text-muted-foreground uppercase text-[10px] tracking-widest self-center">Subtotal:</span>
            <span className="font-bold text-lg">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="w-full sm:w-80 space-y-4">
            {/* Discount Row */}
            {discountAdjustment ? (
              <div className="flex justify-between items-center group/adj py-1">
                <span className="text-sm font-medium text-foreground min-w-[100px]">Discount</span>
                <div className="flex items-center gap-2 flex-1 justify-center max-w-[150px]">
                  <div className="flex items-center border border-border/60 rounded-xl overflow-hidden bg-white shadow-sm h-11 transition-all focus-within:ring-2 focus-within:ring-primary/20">
                    <Input
                      type="number"
                      value={discountAdjustment.value || ''}
                      className="w-16 h-full text-center border-none focus-visible:ring-0 text-sm font-bold placeholder:text-muted-foreground/30"
                      onChange={(e) => updateAdjustment(discountAdjustment.id, 'value', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                    <div className="h-5 w-px bg-border/20" />
                    <select
                      value={discountAdjustment.valueType}
                      onChange={(e) => updateAdjustment(discountAdjustment.id, 'valueType', e.target.value)}
                      className="pl-2 pr-3 h-full bg-transparent border-none text-[11px] font-bold uppercase text-muted-foreground focus:outline-none cursor-pointer hover:text-primary transition-colors appearance-none"
                    >
                      <option value="percentage">%</option>
                      <option value="amount">$</option>
                    </select>
                    <ChevronDown className="h-3 w-3 mr-2 text-muted-foreground/50 pointer-events-none -ml-1" />
                  </div>
                </div>
                <div className="flex items-center gap-3 w-32 justify-end">
                  <span className="font-bold text-sm text-foreground/80">
                    {totalDiscount > 0 ? '-' : ''}${totalDiscount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAdjustment(discountAdjustment.id)}
                    className="h-8 w-8 text-destructive/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </Button>
                </div>
              </div>
            ) : null}

            {/* Tax Row */}
            {taxAdjustment ? (
              <div className="flex justify-between items-center group/adj py-1">
                <span className="text-sm font-medium text-foreground min-w-[100px]">Tax</span>
                <div className="flex items-center gap-2 flex-1 justify-center max-w-[200px]">
                  <div className="relative w-full">
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "new") {
                          setIsTaxDialogOpen(true);
                          return;
                        }
                        const tax = availableTaxes.find(t => t.id === val);
                        if (tax) {
                          updateAdjustment(taxAdjustment.id, 'value', tax.percentage);
                          updateAdjustment(taxAdjustment.id, 'label', tax.name);
                        }
                      }}
                      className="h-11 w-full pl-4 pr-10 border border-border/60 rounded-xl bg-white shadow-sm text-sm font-bold text-[#0D3B47] focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none transition-all cursor-pointer hover:border-primary/40"
                      value={availableTaxes.find(t => t.name === taxAdjustment.label)?.id || ""}
                    >
                      <option value="" disabled>Select tax...</option>
                      {availableTaxes.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.percentage}%)</option>
                      ))}
                      <option value="new">+ Create new tax rate</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
                  </div>
                </div>
                <div className="flex items-center gap-3 w-32 justify-end">
                  <span className="font-bold text-sm text-foreground/80">
                    ${totalTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAdjustment(taxAdjustment.id)}
                    className="h-8 w-8 text-destructive/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col items-end gap-2 w-full sm:w-80">
            {!adjustments.find(a => a.type === 'discount') && (
              <button
                type="button"
                onClick={() => setAdjustments([...adjustments, { id: crypto.randomUUID(), label: 'Descuento', type: 'discount', value: 0, valueType: 'percentage' }])}
                className="text-emerald-700 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:underline"
              >
                <PlusCircle className="h-3 w-3" /> Add Discount
              </button>
            )}
            {!adjustments.find(a => a.type === 'tax') && (
              <button
                type="button"
                onClick={() => {
                  const defaultTax = availableTaxes[0] || { id: 'tax-default', name: 'Tax', percentage: 16 };
                  setAdjustments([...adjustments, { id: defaultTax.id, label: defaultTax.name, type: 'tax', value: defaultTax.percentage, valueType: 'percentage' }]);
                }}
                className="text-emerald-700 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:underline"
              >
                <PlusCircle className="h-3 w-3" /> Add Tax
              </button>
            )}
          </div>

          <div className="flex justify-between w-full sm:w-80 text-3xl font-serif font-black text-primary pt-6 border-t-2 border-primary/10 mt-6 pb-2">
            <span className="uppercase text-[12px] tracking-[0.3em] self-center">Total:</span>
            <span className="tabular-nums tracking-tighter">${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setIsDepositDialogOpen(true)}
            className="text-emerald-700 font-bold text-[10px] uppercase tracking-widest hover:underline pt-2"
          >
            {depositAmount > 0 ? `Deposit: $${depositAmount.toLocaleString()} - Edit` : "Add Deposit or Payment Schedule"}
          </button>
        </div>

        {/* Dialogs */}
        <Dialog open={isTaxDialogOpen} onOpenChange={setIsTaxDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Create New Tax Rate</DialogTitle>
              <DialogDescription>Add a new tax name and percentage to your catalog.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tax Name</Label>
                <Input 
                  placeholder="e.g. Sales Tax, IGV" 
                  value={newTaxName}
                  onChange={(e) => setNewTaxName(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Percentage (%)</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={newTaxPercent}
                    onChange={(e) => setNewTaxPercent(e.target.value)}
                    className="rounded-xl"
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
            <DialogFooter className="bg-transparent border-none p-0">
              <Button variant="ghost" onClick={() => setIsTaxDialogOpen(false)}>Cancel</Button>
              <Button 
                className="bg-[#0D3B47] hover:bg-[#0D3B47]/90 text-white rounded-xl px-6"
                onClick={async () => {
                  if (!newTaxName || !newTaxPercent) return;
                  setIsSavingTax(true);
                  try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                      const { data, error } = await supabase
                        .from('taxes')
                        .insert({ name: newTaxName, percentage: parseFloat(newTaxPercent), user_id: user.id })
                        .select()
                        .single();
                      if (!error && data) {
                        setAvailableTaxes([...availableTaxes, data]);
                        // Auto-apply if there's an active tax row
                        const taxAdj = adjustments.find(a => a.type === 'tax');
                        if (taxAdj) {
                          updateAdjustment(taxAdj.id, 'label', data.name);
                          updateAdjustment(taxAdj.id, 'value', data.percentage);
                        }
                        setNewTaxName("");
                        setNewTaxPercent("");
                        setIsTaxDialogOpen(false);
                        toast.success("Tax rate created");
                      } else {
                        throw error;
                      }
                    }
                  } catch (err) {
                    toast.error("Error creating tax");
                  } finally {
                    setIsSavingTax(false);
                  }
                }}
                disabled={isSavingTax || !newTaxName || !newTaxPercent}
              >
                {isSavingTax ? "Saving..." : "Create Tax"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Deposit & Payment Schedule</DialogTitle>
              <DialogDescription>Define the upfront payment required and terms.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Deposit Amount ($)</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={depositAmount || ""}
                    onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                    className="rounded-xl pl-8"
                  />
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Payment Terms / Details</Label>
                <Textarea 
                  placeholder="e.g. 50% upfront, balance upon completion..." 
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="min-h-[100px] rounded-xl"
                />
              </div>
            </div>
            <DialogFooter className="bg-transparent border-none p-0">
              <Button variant="ghost" onClick={() => setIsDepositDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => setIsDepositDialogOpen(false)} className="bg-[#0D3B47] hover:bg-[#0D3B47]/90 text-white rounded-xl px-6">
                Save Terms
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex justify-end pt-4 pb-12">
          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:-translate-y-1">
            <Save className="mr-2 h-5 w-5" />
            {isSubmitting ? 'Guardando Proforma...' : mode === 'edit' ? 'Actualizar Proforma' : 'Generar y Guardar Proforma'}
          </Button>
        </div>
      </form>
    </div>
  );
}
