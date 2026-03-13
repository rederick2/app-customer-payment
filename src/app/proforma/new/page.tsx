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
import { PlusCircle, Trash2, ArrowLeft, Save, Upload, X, Check, ChevronsUpDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Autocomplete from 'react-google-autocomplete';

interface LineItem {
  id: string; // temp client-side id
  description: string;
  details: string;
  quantity: number;
  unit_price: number;
  photo?: File | null;
  photoPreviewUrl?: string;
}

interface CatalogItem {
  description: string;
  unit_price: number;
}

interface Client {
  id: string;
  name?: string | null; // legacy name
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

export default function NewProforma() {
  const router = useRouter();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clients Database
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('new');
  const [comboboxOpen, setComboboxOpen] = useState(false);

  // Client Details
  const [companyName, setCompanyName] = useState('');
  const [title, setTitle] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Address Details
  const [street1, setStreet1] = useState('');
  const [street2, setStreet2] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');

  // Project Details
  const [projectName, setProjectName] = useState('');
  const [validUntil, setValidUntil] = useState('');

  // Line Items
  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: '', details: '', quantity: 1, unit_price: 0, photo: null }
  ]);

  const [catalog, setCatalog] = useState<CatalogItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Clients
      const { data: clientsData } = await supabase.from('clients').select('*').order('name');
      if (clientsData) {
        setClients(clientsData);
      }

      // Fetch Catalog
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
    setItems([...items, { id: crypto.randomUUID(), description: '', details: '', quantity: 1, unit_price: 0, photo: null }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => {
         if(item.photoPreviewUrl) URL.revokeObjectURL(item.photoPreviewUrl);
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
        if (item.photoPreviewUrl) URL.revokeObjectURL(item.photoPreviewUrl); // cleanup
        return {
           ...item, 
           photo: file, 
           photoPreviewUrl: file ? URL.createObjectURL(file) : undefined 
        };
      }
      return item;
    }));
  };

  // Calculations
  const calculateSubtotal = () => {
    return items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
  };

  const subtotal = calculateSubtotal();
  const tax = subtotal * 0.16; // 16% IVA
  const total = subtotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Create or get Client
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
         // Optionally update existing client details if they changed them
         await supabase
           .from('clients')
           .update(clientPayload)
           .eq('id', selectedClientId);
      }

      // 2. Create Proforma
      const { data: proformaData, error: proformaError } = await supabase
        .from('proformas')
        .insert([{
          client_id: finalClientId,
          project_name: projectName,
          valid_until: validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          subtotal,
          tax,
          total
        }])
        .select()
        .single();

      if (proformaError) throw proformaError;

      // 3. Upload Photos and Create Line Items
      const itemsToInsert = await Promise.all(items.map(async (item) => {
        let photo_url = null;

        if (item.photo) {
          try {
            const uploadFormData = new FormData();
            uploadFormData.append('file', item.photo);
            uploadFormData.append('folder', `proforma-items/${proformaData.id}`);

            const response = await fetch('/api/upload', {
              method: 'POST',
              body: uploadFormData,
            });

            if (response.ok) {
              const { url } = await response.json();
              photo_url = url;
            } else {
              const { error } = await response.json();
              console.error('Error uploading photo via FTP:', error);
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
          photo_url: photo_url
        };
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
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-in fade-in duration-500">
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
                 <Label>Seleccionar Cliente</Label>
                 <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                   <PopoverTrigger>
                     <Button
                       type="button"
                       variant="outline"
                       role="combobox"
                       aria-expanded={comboboxOpen}
                       className="w-full justify-between h-auto py-3 font-normal bg-background"
                     >
                       {selectedClientId === 'new' ? (
                         <span className="text-muted-foreground">Seleccionar un cliente...</span>
                       ) : (() => {
                         const selectedClient = clients.find(c => c.id === selectedClientId);
                         return selectedClient ? (
                           <div className="text-left">
                             <div className="font-bold text-foreground">
                               {selectedClient.company_name || selectedClient.first_name || selectedClient.name}
                             </div>
                             <div className="text-sm text-muted-foreground truncate">
                               {selectedClient.first_name && selectedClient.company_name && <span>Atte: {selectedClient.first_name} {selectedClient.last_name} &bull; </span>}
                               {selectedClient.street_1 || selectedClient.email || 'Sin detalles adicionales'}
                             </div>
                           </div>
                         ) : (
                           <span className="text-muted-foreground">Seleccionar un cliente...</span>
                         );
                       })()}
                       <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                     </Button>
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
                           )})}
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

              {selectedClientId === 'new' && (
                <div className="space-y-4 pt-4 border-t mt-4 border-border/50">
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
                      options={{
                        types: ["address"],
                      }}
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
            <div className="space-y-6">
              <div className="hidden lg:grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b border-border/50 mb-4 px-2 tracking-wide uppercase text-xs">
                <div className="col-span-6">Descripción y Detalles</div>
                <div className="col-span-2 text-right">Cant.</div>
                <div className="col-span-2 text-right">P. Unitario ($)</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-1 lg:grid-cols-12 gap-4 relative bg-muted/20 p-4 lg:p-2 rounded-lg lg:bg-transparent">
                  {/* Left Column: Description, Details, Photo */}
                  <div className="col-span-1 lg:col-span-6 space-y-3">
                    <div>
                      <Label className="lg:hidden text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Descripción</Label>
                      <Input
                        placeholder="Título del servicio/producto..."
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
                        className="bg-background font-semibold"
                        autoComplete="off"
                      />
                    </div>
                    <div>
                       <Label className="lg:hidden text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Detalles Adicionales</Label>
                       <Textarea 
                          placeholder="Especificaciones, medidas, materiales, notas adicionales..."
                          value={item.details}
                          onChange={(e) => updateItem(item.id, 'details', e.target.value)}
                          className="bg-background min-h-[80px] text-sm resize-y"
                       />
                    </div>
                    
                    {/* Photo Upload Area */}
                    <div className="flex items-center gap-3">
                       <label className="cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                          <Upload className="h-4 w-4" />
                          <span>{item.photo ? 'Cambiar Foto' : 'Subir Foto'}</span>
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
                       {item.photoPreviewUrl && (
                          <div className="relative h-12 w-12 rounded overflow-hidden border bg-background flex-shrink-0">
                             {/* eslint-disable-next-line @next/next/no-img-element */}
                             <img src={item.photoPreviewUrl} alt="Preview" className="object-cover w-full h-full" />
                             <button 
                                type="button" 
                                onClick={() => handlePhotoUpload(item.id, null)}
                                className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 shadow-sm hover:scale-105 transition-transform"
                             >
                                <X className="h-3 w-3" />
                             </button>
                          </div>
                       )}
                    </div>

                  </div>

                  {/* Right Columns: Quantity, Price, Total */}
                  <div className="col-span-1 lg:col-span-2 space-y-2 lg:space-y-0">
                    <Label className="lg:hidden text-xs text-muted-foreground uppercase tracking-wider block">Cantidad</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity || ''}
                      required
                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      className="text-right bg-background"
                    />
                  </div>
                  <div className="col-span-1 lg:col-span-2 space-y-2 lg:space-y-0">
                    <Label className="lg:hidden text-xs text-muted-foreground uppercase tracking-wider block">P. Unitario ($)</Label>
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
                  <div className="col-span-1 lg:col-span-2 flex items-start justify-between lg:justify-end gap-4 mt-2 lg:mt-0 pt-2 lg:pt-0">
                    <div className="lg:hidden text-sm font-medium">Subtotal:</div>
                    <div className="text-right font-medium text-foreground min-w-[80px] pt-1">
                      ${(item.quantity * item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-destructive shrink-0 mt-[-4px]"
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
