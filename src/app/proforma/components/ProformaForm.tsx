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
import { PlusCircle, Trash2, ArrowLeft, Save, Upload, X, Check, ChevronsUpDown, Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Autocomplete from 'react-google-autocomplete';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

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
      if (item.is_optional) return acc;
      return acc + (item.quantity * item.unit_price);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const appliedTaxes = availableTaxes.map(tax => ({
    name: tax.name,
    percentage: tax.percentage,
    amount: (subtotal * tax.percentage) / 100
  }));
  const totalTax = appliedTaxes.reduce((acc, t) => acc + t.amount, 0);
  const total = subtotal + totalTax;

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
        total
        //applied_taxes: appliedTaxes
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

        <div className="mt-8 border-t border-border/50 pt-6 flex flex-col items-end space-y-3 px-2">
          <div className="flex justify-between w-full sm:w-64 text-sm">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="font-medium">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>

          {appliedTaxes.map((tax, idx) => (
            <div key={idx} className="flex justify-between w-full sm:w-64 text-sm">
              <span className="text-muted-foreground">{tax.name} ({tax.percentage}%):</span>
              <span className="font-medium">${tax.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          ))}

          <div className="flex justify-between w-full sm:w-64 text-lg font-serif font-bold text-primary pt-1 border-t border-border/50 mt-2">
            <span>Total:</span>
            <span>${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

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
