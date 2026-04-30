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
import { PlusCircle, Trash2, ArrowLeft, Save, Upload, X, Check, ChevronsUpDown, Pencil, ChevronDown, ChevronUp, Sparkles, Wand2, Loader2, MoreHorizontal, Clock, Calendar as CalendarIcon, HelpCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ProformaTour } from './ProformaTour';
import { cn } from '@/lib/utils';
import { generateAndSaveVisits } from './job-actions';
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
  cost?: number;
  markup?: number;
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
  details?: string;
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
  onBack?: () => void;
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

const formatUSD = (val: string | number) => {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

import { FormHelp } from '@/components/FormHelp';

const parseUSD = (val: string) => {
  return val.replace(/[^0-9.]/g, '');
};

const CurrencyInput = ({
  value,
  onChange,
  className,
  ...props
}: any) => {
  const [localValue, setLocalValue] = useState(value?.toString() || '');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) setLocalValue(value?.toString() || '');
  }, [value, isFocused]);

  return (
    <Input
      {...props}
      value={isFocused ? localValue : formatUSD(value)}
      onFocus={() => {
        setIsFocused(true);
        setLocalValue(value?.toString() || '');
      }}
      onBlur={() => setIsFocused(false)}
      onChange={(e) => {
        const raw = parseUSD(e.target.value);
        setLocalValue(e.target.value);
        onChange(raw);
      }}
      className={className}
    />
  );
};

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
  const [comboboxOpen, setComboboxOpen] = useState(false);

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
    zIndex: isDragging || comboboxOpen ? 50 : undefined,
    position: 'relative' as const,
  };

  const handleSelectPreset = (preset: CatalogItem) => {
    updateItemFields(item.id, {
      description: preset.description,
      details: preset.details || '',
      unit_price: preset.unit_price
    });
    setComboboxOpen(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative bg-card border border-border/40 rounded-xl mb-4",
        (isDragging || comboboxOpen) ? "z-[150]" : "hover:border-primary/20",
        (item.is_optional && !comboboxOpen) && "bg-muted/5 opacity-60"
      )}
    >
      <div className="flex flex-col md:flex-row items-start gap-4 p-4 md:p-6">
        {/* Drag Handle & Optional Checkbox Area */}
        <div className="flex flex-row md:flex-col items-center justify-between w-full md:w-auto gap-4 md:pt-4">
          <div
            {...attributes}
            {...listeners}
            className="tour-item-drag p-1.5 rounded-lg hover:bg-muted cursor-grab active:cursor-grabbing text-muted-foreground group-hover:text-muted-foreground/40 transition-colors"
          >
            <GripVertical className="h-6 w-6" />
          </div>
          <div className="md:hidden">
            {showRemoveButton && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(item.id)}
                className="text-destructive/40 hover:text-destructive hover:bg-destructive/10 transition-colors h-10 w-10 rounded-xl"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {/* Main Context Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
            <div className={cn("md:col-span-6 space-y-2", comboboxOpen && "relative z-[100]")}>
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Item Name *</Label>
              <div className="tour-item-name w-full relative">
                <div className="relative group/trigger">
                  <Input
                    placeholder="Product or service name..."
                    value={item.description}
                    required
                    autoComplete="off"
                    onFocus={() => setComboboxOpen(true)}
                    onBlur={() => {
                      // Delay hidding to let clicks on the list register
                      setTimeout(() => setComboboxOpen(false), 200);
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateItem(item.id, 'description', val);
                      if (!comboboxOpen) setComboboxOpen(true);
                    }}
                    className="w-full h-11 bg-background border-border/40 rounded-xl hover:bg-accent/5 transition-all focus:ring-2 focus:ring-primary/10 pl-4 pr-10 font-bold"
                  />
                  {catalog.length > 0 && (
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

                {comboboxOpen && catalog.length > 0 && (
                  <div className="absolute top-[calc(100%+4px)] left-0 w-full z-[9999] rounded-2xl border border-border/40 bg-background shadow-2xl overflow-visible">
                    <Command className="bg-background text-left overflow-visible rounded-2xl">
                      <CommandInput placeholder="Search catalog..." className="h-11 border-none focus:ring-0" />
                      <CommandList className="max-h-[240px] overflow-y-auto custom-scrollbar">
                        <CommandEmpty className="p-4 text-xs text-muted-foreground italic">No matches found.</CommandEmpty>
                        <CommandGroup heading="Recent Items" className="p-2 text-[10px] font-black tracking-widest text-muted-foreground/50">
                          {catalog.map((preset, idx) => (
                            <CommandItem
                              key={idx}
                              value={preset.description}
                              onSelect={() => handleSelectPreset(preset)}
                              className="flex flex-col items-start gap-1 py-3 px-4 cursor-pointer rounded-xl"
                            >
                              <div className="flex w-full items-center justify-between">
                                <span className="font-bold text-sm text-foreground">{preset.description}</span>
                                <span className="text-xs font-black text-primary">${formatUSD(preset.unit_price)}</span>
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

            <div className="grid grid-cols-2 md:col-span-4 gap-4">
              <div className="space-y-2">
                <Label className="px-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quantity *</Label>
                <div className="relative group/price">
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity || ''}
                    required
                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="rounded-xl h-11 text-center font-bold"
                  />
                </div>
              </div>

              <div className="tour-item-price space-y-2 text-right">
                <Label className="px-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Unit Price *</Label>
                <div className="relative group/price">
                  <CurrencyInput
                    id={`price-${item.id}`}
                    type="text"
                    inputMode="decimal"
                    value={item.unit_price}
                    required
                    onChange={(val: string) => {
                      const newPrice = parseFloat(val) || 0;
                      const currentMarkup = item.markup || 0;
                      const newCost = Number((newPrice / (1 + currentMarkup / 100)).toFixed(2));
                      updateItemFields(item.id, { unit_price: newPrice, cost: newCost });
                    }}
                    className="tour-item-price-input rounded-xl h-11 border-border/60 focus:ring-2 focus:ring-primary/10 pl-7 text-right font-bold transition-all peer"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/40 pointer-events-none">$</span>

                  <div className="tour-item-calculator absolute right-0 top-[calc(100%+8px)] w-64 p-4 space-y-4 shadow-xl border border-border/40 rounded-xl bg-popover text-popover-foreground z-[100] transition-all duration-200 opacity-0 invisible peer-focus:opacity-100 peer-focus:visible focus-within:opacity-100 focus-within:visible hover:opacity-100 hover:visible">
                    <div className="space-y-2 text-left">
                      <Label className="text-xs font-bold text-muted-foreground">Unit Cost</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0.00"
                          value={item.cost === undefined ? '' : item.cost}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              updateItemFields(item.id, { cost: undefined });
                              return;
                            }
                            const newCost = parseFloat(val) || 0;
                            const currentMarkup = item.markup || 0;
                            const newPrice = Number((newCost * (1 + currentMarkup / 100)).toFixed(2));
                            updateItemFields(item.id, { cost: newCost, unit_price: newPrice });
                          }}
                          className="pl-7 font-medium text-left"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">$</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-left">
                      <Label className="text-xs font-bold text-muted-foreground">Markup (%)</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="1"
                          placeholder="0"
                          value={item.markup === undefined ? '' : item.markup}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              updateItemFields(item.id, { markup: undefined });
                              return;
                            }
                            const newMarkup = parseFloat(val) || 0;
                            const currentCost = item.cost || 0;
                            const newPrice = Number((currentCost * (1 + newMarkup / 100)).toFixed(2));
                            updateItemFields(item.id, { markup: newMarkup, unit_price: newPrice });
                          }}
                          className="pr-7 font-medium text-left"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">%</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight text-center pt-2 border-t border-border/40">These calculations won't be visible to your clients</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-2 text-right">
              <Label className="px-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total</Label>
              <div className="rounded-xl h-11 flex items-center justify-end font-bold text-primary text-lg tracking-tight pr-2">
                ${(item.quantity * item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="hidden md:flex md:col-span-1 items-center justify-center pt-8">
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
            <div className="lg:col-span-3 space-y-2">
              <Label className="px-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</Label>
              <Textarea
                placeholder="Detailed description of product or materials..."
                value={item.details}
                onChange={(e) => updateItem(item.id, 'details', e.target.value)}
                className="min-h-[100px] bg-muted/5 border-dashed border-border/60 focus:border-primary/20 text-md leading-relaxed rounded-xl p-4 resize-none"
              />
            </div>

            <div className="lg:col-span-1 space-y-2">
              <Label className="px-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Upload Photo</Label>
              <div className="relative h-25 w-full rounded-2xl overflow-hidden border-2 border-border/40 bg-muted/10 group/img flex items-center justify-center hover:border-primary/20 transition-all">
                {item.photoPreviewUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.photoPreviewUrl} alt="Preview" className="object-cover w-full h-full transition-transform duration-500 group-hover/img:scale-110" />
                    <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover/img:opacity-100 transition-all translate-x-2 group-hover/img:translate-x-0">
                      <label className="h-8 w-8 rounded-lg bg-card/90 backdrop-blur-md shadow-xl border border-border/20 flex items-center justify-center cursor-pointer text-primary hover:bg-card transition-all">
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
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Add Photo</span>
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
          {/* Cambiamos el contenedor padre para que empuje todo a la derecha */}
          <div className="pt-4 flex justify-end">

            {/* El botón/etiqueta con su estilo */}
            <div className="tour-item-optional flex items-center gap-3 bg-muted/10 px-4 py-2 rounded-xl border border-border/40 hover:bg-muted/20 transition-all cursor-pointer group/opt">

              {/* El texto primero */}
              <Label
                htmlFor={`opt-${item.id}`}
                className="text-xs font-medium text-muted-foreground cursor-pointer select-none"
              >
                Mark as optional
              </Label>

              {/* El checkbox a la derecha del texto */}
              <Checkbox
                id={`opt-${item.id}`}
                checked={item.is_optional}
                onCheckedChange={(checked) => updateItem(item.id, 'is_optional', !!checked)}
                className="h-5 w-5 rounded-md border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all group-hover/opt:scale-110"
              />

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProformaForm({ initialData, mode, onBack }: ProformaFormProps) {
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
  const [validUntil, setValidUntil] = useState(initialData?.proforma?.valid_until || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(initialData?.proforma?.notes || '');
  const [isTemplate, setIsTemplate] = useState(initialData?.proforma?.is_template || false);

  // Job mode fields
  const isJobMode = initialData?.proforma?.status === 'job';
  const [jobType, setJobType] = useState<'one-off' | 'recurring'>(initialData?.proforma?.job_type || 'one-off');
  const [recurringInterval, setRecurringInterval] = useState<string>(initialData?.proforma?.recurring_interval || 'monthly');
  const [jobStartAt, setJobStartAt] = useState<string>(initialData?.proforma?.job_start_at ? new Date(initialData.proforma.job_start_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [jobEndAt, setJobEndAt] = useState<string>(initialData?.proforma?.job_end_at ? new Date(initialData.proforma.job_end_at).toISOString().split('T')[0] : '');

  // Advanced Scheduling States
  const [scheduleLater, setScheduleLater] = useState(false);
  const [anytime, setAnytime] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]); // 0-6 for weekly
  const [endCondition, setEndCondition] = useState<'after' | 'on'>('after');
  const [endConditionValue, setEndConditionValue] = useState<number | string>(6);
  const [endConditionPeriod, setEndConditionPeriod] = useState<'months' | 'visits'>('months');
  const [assignedTeamMembers, setAssignedTeamMembers] = useState<string[]>([]);
  const [emailTeamAssignment, setEmailTeamAssignment] = useState(false);
  const [visitInstructions, setVisitInstructions] = useState('');
  const [billingType, setBillingType] = useState<'per_visit' | 'fixed'>(initialData?.proforma?.billing_type || 'fixed');

  // Line Items
  const [items, setItems] = useState<LineItem[]>(
    initialData?.items?.map(item => ({
      id: item.id,
      description: item.description,
      details: item.details || '',
      quantity: item.quantity,
      unit_price: item.unit_price,
      cost: item.cost || undefined,
      markup: item.cost && item.unit_price ? Number((((item.unit_price / item.cost) - 1) * 100).toFixed(2)) : undefined,
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
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>(
    initialData?.proforma?.adjustments || []
  );

  // New States for Dialogs
  const [isTaxDialogOpen, setIsTaxDialogOpen] = useState(false);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [newTaxName, setNewTaxName] = useState("");
  const [newTaxPercent, setNewTaxPercent] = useState("");
  const [depositAmount, setDepositAmount] = useState<number>(initialData?.proforma?.deposit_amount || 0);
  const [requiredDeposit, setRequiredDeposit] = useState<number>(initialData?.proforma?.required_deposit || 0);
  const [paymentTerms, setPaymentTerms] = useState<string>(initialData?.proforma?.payment_terms || "");
  const [isSavingTax, setIsSavingTax] = useState(false);

  // AI Generation States
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiProjectDescription, setAIProjectDescription] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Tutorial State
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: taxesData } = await supabase
          .from('taxes')
          .select('*')
          .eq('user_id', user.id);
        if (taxesData) setAvailableTaxes(taxesData);

        const { data: teamData } = await supabase
          .from('team_members')
          .select('*')
          .order('name', { ascending: true });
        if (teamData) setTeamMembers(teamData);

        const { data: clientsData } = await supabase
          .from('clients')
          .select('*, proformas(created_at)')
          .eq('user_id', user.id);

        if (clientsData) {
          const sortedClients = clientsData.sort((a, b) => {
            const aDocs = a.proformas || [];
            const bDocs = b.proformas || [];
            const aMax = aDocs.length > 0 ? Math.max(...aDocs.map((p: any) => new Date(p.created_at).getTime())) : new Date(a.created_at || 0).getTime();
            const bMax = bDocs.length > 0 ? Math.max(...bDocs.map((p: any) => new Date(p.created_at).getTime())) : new Date(b.created_at || 0).getTime();
            if (aMax !== bMax) return bMax - aMax;
            return (a.name || a.company_name || '').localeCompare(b.name || b.company_name || '');
          });
          setClients(sortedClients);
        }
      }

      const { data: catalogData } = await supabase
        .from('proforma_items')
        .select('description, unit_price, details')
        .limit(1000);

      if (catalogData) {
        const unique = new Map<string, CatalogItem>();
        [...catalogData].reverse().forEach(item => {
          const desc = item.description?.trim() || "";
          if (desc && !unique.has(desc.toLowerCase())) {
            unique.set(desc.toLowerCase(), {
              description: desc,
              unit_price: item.unit_price,
              details: item.details || ""
            });
          }
        });
        setCatalog(Array.from(unique.values()));
      }
    };
    fetchData();
  }, [supabase]);

  const calculateVisitsSummary = () => {
    /*if (jobType === 'one-off') {
      return { total: 1, lastDate: jobEndAt || jobStartAt || '---' };
    }*/

    if (!jobStartAt) return { total: '---', lastDate: '---' };

    const start = new Date(jobStartAt + 'T00:00:00');
    const end = jobEndAt ? new Date(jobEndAt + 'T23:59:59') : null;

    if (!end) return { total: '---', lastDate: '---' };

    let count = 0;
    let current = new Date(start);
    let lastVisitDate: Date | null = null;

    // Safety limit to prevent infinite loops
    const MAX_ITER = 10000;
    let iter = 0;

    while (current <= end && iter < MAX_ITER) {
      iter++;
      let qualifies = true;

      if (recurringInterval === 'weekly') {
        // For weekly, if specific days selected, only count those days
        if (daysOfWeek.length > 0) {
          qualifies = daysOfWeek.includes(current.getDay());
        }
      }

      if (qualifies) {
        count++;
        lastVisitDate = new Date(current);
      }

      // Advance date
      if (recurringInterval === 'daily') {
        current.setDate(current.getDate() + 1);
      } else if (recurringInterval === 'weekly') {
        if (daysOfWeek.length > 0) {
          // Day-by-day for multi-day weekly selection
          current.setDate(current.getDate() + 1);
        } else {
          current.setDate(current.getDate() + 7);
        }
      } else if (recurringInterval === 'biweekly') {
        current.setDate(current.getDate() + 14);
      } else if (recurringInterval === 'monthly') {
        current.setMonth(current.getMonth() + 1);
      } else if (recurringInterval === 'quarterly') {
        current.setMonth(current.getMonth() + 3);
      } else {
        break;
      }
    }

    const lastDateStr = lastVisitDate
      ? lastVisitDate.toISOString().split('T')[0]
      : '---';

    return { total: count, lastDate: lastDateStr };
  };

  const visitsSummary = calculateVisitsSummary();

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

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    setComboboxOpen(false);

    if (clientId === 'new') {
      setIsNewClientModalOpen(true);
      setCompanyName('');
      setTitle('');
      setFirstName('');
      setLastName('');
      setClientEmail('');
      setClientPhone('');
      setStreet1('');
      setStreet2('');
      setCity('');
      setProvince('');
      setPostalCode('');
      setCountry('');
    } else {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        setCompanyName(client.company_name || '');
        setTitle(client.title || '');
        setFirstName(client.first_name || '');
        setLastName(client.last_name || '');
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
          // If we remove the photo (file null), we keep existingPhotoUrl unless we want to explicitly delete it.
          // In the UI, clicking 'X' calls with null. 
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

  const handleAIGenerate = async () => {
    if (!projectName) {
      toast.error("Please enter a project name.");
      return;
    }

    setIsGeneratingAI(true);
    try {
      const response = await fetch('/api/proforma/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName,
          projectDescription: aiProjectDescription
        })
      });

      if (!response.ok) throw new Error("Error generating proforma");

      const data = await response.json();

      const newItems = data.items.map((item: any) => ({
        id: crypto.randomUUID(),
        description: item.description,
        details: item.details,
        quantity: item.quantity,
        unit_price: item.unit_price,
        is_optional: false,
        sort_order: 0,
        photo: null
      }));

      // If the first item is empty (the default), replace it
      if (items.length === 1 && !items[0].description && items[0].unit_price === 0) {
        setItems(newItems);
      } else {
        setItems([...items, ...newItems]);
      }

      toast.success("Items generated successfully");
      setIsAIModalOpen(false);
    } catch (error) {
      console.error("AI Generation Error:", error);
      toast.error("Error generating proforma with AI");
    } finally {
      setIsGeneratingAI(false);
    }
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
      label: 'New Tax',
      type: 'tax',
      valueType: 'percentage',
      value: 0
    }]);
  };

  const removeAdjustment = (id: string) => {
    setAdjustments(adjustments.filter(a => a.id !== id));
  };

  const updateAdjustment = (id: string, updates: Partial<Adjustment>) => {
    setAdjustments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
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
    ? (taxAdjustment.valueType === 'percentage'
      ? (taxableAmount * taxAdjustment.value) / 100
      : taxAdjustment.value)
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
    //console.log('handleSubmit');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let nextNumber: number | undefined;
      if (mode !== 'edit') {
        const { data: userData } = await supabase.from('users').select('proforma_sequence_start').eq('id', user.id).single();
        const startSequence = userData?.proforma_sequence_start || 1;

        const { data: maxProforma } = await supabase
          .from('proformas')
          .select('number')
          .eq('user_id', user.id)
          .order('number', { ascending: false })
          .limit(1);

        //console.log('maxProforma', maxProforma);

        const currentMax = maxProforma?.[0]?.number || 0;
        nextNumber = Math.max(currentMax + 1, startSequence);
      }

      let finalClientId = null;
      if (!isTemplate) {
        finalClientId = selectedClientId;
        const clientPayload = {
          user_id: user.id,
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
        } /*else if (selectedClientId) {
          await supabase.from('clients').update(clientPayload).eq('id', selectedClientId);
        }*/
      }

      const proformaPayload: any = {
        user_id: user.id,
        client_id: finalClientId,
        project_name: projectName,
        valid_until: validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        subtotal,
        tax: totalTax,
        total,
        adjustments: calculatedAdjustments,
        payment_terms: paymentTerms,
        deposit_amount: depositAmount,
        required_deposit: requiredDeposit,
        notes: notes,
        is_template: isTemplate,
        ...(nextNumber !== undefined && { number: nextNumber })
      };

      // If creating a job, set job-specific fields
      if (isJobMode) {
        proformaPayload.status = 'job';
        proformaPayload.job_type = jobType;
        proformaPayload.billing_type = billingType;
        proformaPayload.recurring_interval = jobType === 'recurring' ? recurringInterval : null;
        proformaPayload.job_start_at = jobStartAt ? new Date(jobStartAt + 'T00:00:00').toISOString() : null;
        proformaPayload.job_end_at = jobEndAt ? new Date(jobEndAt + 'T23:59:59').toISOString() : null;

        // Advanced scheduling config
        proformaPayload.schedule_config = {
          scheduleLater,
          anytime,
          startTime,
          endTime,
          daysOfWeek,
          assignedTeamMembers,
          emailTeamAssignment,
          visitInstructions
        };
      }

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
          cost: item.cost || 0,
          total_price: item.quantity * item.unit_price,
          is_optional: item.is_optional,
          sort_order: index, // Use current array index as sort_order
          photo_url: photo_url
        };
      }));

      const { error: itemsError } = await supabase.from('proforma_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;

      // Generate visits if in job mode
      if (isJobMode) {
        await generateAndSaveVisits(
          proformaData.id,
          jobStartAt,
          jobEndAt || null,
          recurringInterval,
          {
            scheduleLater,
            anytime,
            startTime,
            endTime,
            daysOfWeek,
            assignedTeamMembers,
            visitInstructions
          },
          teamMembers
        );
      }

      toast.success(isJobMode ? 'Job created successfully!' : (mode === 'edit' ? 'Proforma updated' : 'Proforma created'));
      router.push(`/proforma/${proformaData.id}`);
      router.refresh();

    } catch (error) {
      console.error('Error saving proforma:', error);
      toast.error('Error saving proforma');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onBack ? onBack() : router.back()}
            className="rounded-full hover:bg-muted transition-colors h-10 w-10 shrink-0"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Button>
          <div>
            <h1 id="tour-header" className="text-2xl uppercase md:text-3xl font-bold tracking-tight">
              {isJobMode ? 'New Job' : (mode === 'edit' ? 'Edit Quote' : 'New Quote')}
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm">
              {isJobMode ? 'Create a direct service job.' : (mode === 'create' ? 'Create a professional proposal.' : 'Update your project details.')}
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsTutorialOpen(true)}
            className="w-full md:w-auto gap-2 rounded-2xl h-11 px-6 shadow-sm font-bold"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="text-xs uppercase tracking-tight">How it works</span>
          </Button>

          {mode === 'create' && (
            <Button
              type="button"
              onClick={() => setIsAIModalOpen(true)}
              className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-200 border-none transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 h-11 px-6 rounded-2xl"
            >
              <Sparkles className="h-4 w-4 fill-white/20" />
              <span className="font-bold tracking-tight text-xs uppercase">Generate with AI</span>
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {!isJobMode && mode === 'create' && (
          <div className="flex items-center space-x-3 bg-muted/40 p-4 rounded-xl border border-border/50 shadow-sm max-w-max">
            <Checkbox
              id="saveAsTemplateTop"
              checked={isTemplate}
              onCheckedChange={(checked) => setIsTemplate(!!checked)}
              className="h-5 w-5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
            />
            <div className="space-y-1 leading-none">
              <Label htmlFor="saveAsTemplateTop" className="text-base font-semibold cursor-pointer">
                Save as a Reusable Template
              </Label>
              <p className="text-sm text-muted-foreground">Templates don't require clients and won't affect revenue metrics.</p>
            </div>
          </div>
        )}

        <div id="tour-project-name" className="space-y-2">
          <Label htmlFor="projectName" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">
            {isTemplate ? 'Template Name *' : isJobMode ? 'Job Name *' : 'Project Name *'}
          </Label>
          <Input
            id="projectName"
            required
            placeholder={isTemplate ? 'e.g. Standard Bathroom Remodel' : isJobMode ? 'e.g. Pool Cleaning - Monthly' : 'e.g. Living Room Remodel'}
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            className="h-12 rounded-xl font-bold bg-white border focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
        <div className="space-y-10">
          {!isTemplate && (
            <div className="space-y-4">
              <h2 className="text-lg uppercase font-black tracking-tight font-archivo ml-1 flex items-center">
                Client Details
                <FormHelp
                  title="Assign a Client"
                  text="Select an existing client or create a new one to assign to this quote. The client's contact information will be included in the final document."
                />
              </h2>
              <Card id="tour-client-details" className="shadow-sm border rounded-xl overflow-hidden" style={{ boxShadow: 'none' }}>
                <CardContent className="p-6 space-y-4">
                  {mode === 'create' && (
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Select Client</Label>
                      <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                        <PopoverTrigger
                          role="combobox"
                          aria-expanded={comboboxOpen}
                          className="w-full justify-between h-12 py-3 font-normal bg-background inline-flex items-center px-4 rounded-xl border border-border/40 hover:bg-muted/5 transition-all focus:ring-2 focus:ring-primary/10"
                        >
                          {selectedClientId === 'new' ? (
                            <span className="text-muted-foreground text-left flex-1 font-medium">Select a Client from the list...</span>
                          ) : (() => {
                            const selectedClient = clients.find(c => c.id === selectedClientId);
                            return selectedClient ? (
                              <div className="text-left flex-1 min-w-0">
                                <div className="font-bold text-foreground truncate">
                                  {selectedClient.company_name || [selectedClient.first_name, selectedClient.last_name].filter(Boolean).join(' ') || selectedClient.name}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-left flex-1 font-medium italic">Search or select a client...</span>
                            );
                          })()}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0 rounded-2xl border-border/40 shadow-2xl overflow-hidden" align="start" side="bottom" sideOffset={4}>
                          <Command className="rounded-2xl">
                            <CommandInput placeholder="Search name, company or email..." className="h-12 border-none focus:ring-0 font-manrope" />
                            <CommandList className="max-h-[300px] custom-scrollbar">
                              <CommandEmpty className="p-4 text-sm text-muted-foreground italic">No clients found.</CommandEmpty>
                              <CommandGroup heading="Existing Clients" className="p-2 text-[10px] font-black tracking-widest text-muted-foreground/50">
                                {clients.map((client) => {
                                  const nameDisplay = [client.title, client.first_name, client.last_name].filter(Boolean).join(' ') || client.name;
                                  return (
                                    <CommandItem
                                      key={client.id}
                                      value={`${client.company_name} ${nameDisplay} ${client.email}`}
                                      onSelect={() => handleClientSelect(client.id)}
                                      className="flex flex-col items-start gap-1 py-3 px-4 cursor-pointer rounded-xl"
                                    >
                                      <div className="flex w-full items-center justify-between">
                                        <span className="font-bold text-foreground">{client.company_name || nameDisplay}</span>
                                        {selectedClientId === client.id && <Check className="h-4 w-4 text-primary" />}
                                      </div>
                                      <div className="text-xs text-muted-foreground w-full truncate space-x-1 font-medium">
                                        {client.company_name && <span>Attn: {nameDisplay}</span>}
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
                            <div className="border-t border-border/40 p-2 bg-muted/5">
                              <Button
                                type="button"
                                variant="ghost"
                                className="w-full justify-start text-primary font-bold hover:text-primary hover:bg-primary/10 rounded-xl h-11"
                                onClick={() => handleClientSelect('new')}
                              >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                <span className="uppercase tracking-widest text-[10px]">Create brand new client</span>
                              </Button>
                            </div>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  {/* Client Preview Card */}
                  {((selectedClientId !== 'new' && selectedClientId) || (selectedClientId === 'new' && (firstName || lastName || companyName || street1))) && (
                    <div className="mt-4 p-5 rounded-xl border bg-muted/50 space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                              {selectedClientId === 'new' ? 'New Client (Draft)' : 'Selected Client'}
                            </p>
                          </div>
                          <h3 className="text-2xl font-black tracking-tight font-archivo">
                            {selectedClientId === 'new'
                              ? (companyName || `${firstName} ${lastName}` || 'Unnamed Client')
                              : (clients.find(c => c.id === selectedClientId)?.company_name || [clients.find(c => c.id === selectedClientId)?.first_name, clients.find(c => c.id === selectedClientId)?.last_name].filter(Boolean).join(' ') || 'Loading...')
                            }
                          </h3>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-9 gap-2 text-xs font-bold rounded-xl border border-border/40 shadow-sm hover:translate-y-[-1px] transition-all"
                          onClick={() => setIsNewClientModalOpen(true)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit Info
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 pt-4 border-t border-border/10">
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40 flex items-center gap-1.5">
                            Contact
                          </p>
                          <p className="text-sm font-bold text-foreground flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-primary" />
                            {selectedClientId === 'new' ? (clientEmail || 'No email provided') : (clients.find(c => c.id === selectedClientId)?.email || 'No email')}
                          </p>
                          <p className="text-sm font-bold text-foreground flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-primary" />
                            {selectedClientId === 'new' ? (clientPhone || 'No phone provided') : (clients.find(c => c.id === selectedClientId)?.phone || 'No phone')}
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Service Address</p>
                          <p className="text-sm font-bold text-foreground">
                            {selectedClientId === 'new' ? (street1 || 'No address set') : (clients.find(c => c.id === selectedClientId)?.street_1 || 'No address')}
                          </p>
                          <p className="text-sm font-medium text-muted-foreground">
                            {selectedClientId === 'new'
                              ? [city, province, postalCode].filter(Boolean).join(', ')
                              : [clients.find(c => c.id === selectedClientId)?.city, clients.find(c => c.id === selectedClientId)?.province, clients.find(c => c.id === selectedClientId)?.postal_code].filter(Boolean).join(', ')
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-lg uppercase font-black tracking-tight font-archivo ml-1 flex items-center">
              {isJobMode ? 'Schedule' : 'Project Details'}
              <FormHelp
                title={isJobMode ? 'Schedule' : 'Project Details'}
                text={isJobMode ? 'Configure the schedule for this job, including recurrences and team assignments.' : 'Set the basic properties of the quote, such as its expiration date.'}
              />
            </h2>
            <Card id="tour-project-details" className="border rounded-xl overflow-hidden" style={{ boxShadow: 'none' }}>
              <CardContent className="p-8 space-y-8">
                {!isTemplate && !isJobMode && (
                  <div className="space-y-2">
                    <Label htmlFor="validUntil" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Valid Until *</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      required
                      value={validUntil}
                      onChange={e => setValidUntil(e.target.value)}
                      className="h-12 rounded-xl border-border/40 font-bold"
                    />
                  </div>
                )}

                {isJobMode && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    {/* Job Type Toggle */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">
                        Job Type <span className="h-5 w-5 rounded-full border border-border/60 flex items-center justify-center text-[10px] font-black">?</span>
                      </Label>
                      <div className="flex p-1.5 bg-muted/20 border border-border/40 rounded-xl max-w-sm">
                        <button
                          type="button"
                          onClick={() => { setJobType('one-off'); setBillingType('fixed'); }}
                          className={cn(
                            "flex-1 h-11 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                            jobType === 'one-off'
                              ? "bg-white text-primary border shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          One-off
                        </button>
                        <button
                          type="button"
                          onClick={() => setJobType('recurring')}
                          className={cn(
                            "flex-1 h-11 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                            jobType === 'recurring'
                              ? "bg-white text-primary border shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Recurring
                        </button>
                      </div>
                    </div>

                    {/* Billing Type */}
                    <div className="space-y-3">
                      <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Billing Type</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Fixed Amount — available for both */}
                        <button
                          type="button"
                          onClick={() => setBillingType('fixed')}
                          className={cn(
                            "flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 transition-all text-left",
                            billingType === 'fixed'
                              ? "border-primary bg-primary/5"
                              : "border-border/30 bg-muted/5 hover:border-border/60"
                          )}
                        >
                          <span className={cn("text-xs font-black uppercase tracking-widest", billingType === 'fixed' ? "text-primary" : "text-muted-foreground")}>Fixed Amount</span>
                          <span className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                            {jobType === 'recurring'
                              ? 'Issue a fixed-price invoice for each billing cycle, regardless of number of visits.'
                              : 'Invoice a single fixed amount for the entire job.'}
                          </span>
                        </button>

                        {/* Per Visit — only for recurring */}
                        {jobType === 'recurring' && (
                          <button
                            type="button"
                            onClick={() => setBillingType('per_visit')}
                            className={cn(
                              "flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 transition-all text-left",
                              billingType === 'per_visit'
                                ? "border-primary bg-primary/5"
                                : "border-border/30 bg-muted/5 hover:border-border/60"
                            )}
                          >
                            <span className={cn("text-xs font-black uppercase tracking-widest", billingType === 'per_visit' ? "text-primary" : "text-muted-foreground")}>Per Visit</span>
                            <span className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                              Each visit becomes a billable line item, all consolidated into a single invoice per cycle.
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Schedule Summary (Visual only for now) */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3 border-y border-border/10 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground/40 font-black">Total visits</span>
                        <span className="text-foreground">{visitsSummary.total}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-foreground/40 font-black">First</span>
                        <span className="text-foreground">{jobStartAt || '---'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-foreground/40 font-black">Last</span>
                        <span className="text-foreground">{visitsSummary.lastDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-foreground/40 font-black">Repeats</span>
                        <span className="text-foreground">{recurringInterval}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Left Column: Dates and Timing */}
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="jobStartAt" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Start Date *</Label>
                            <Input
                              id="jobStartAt"
                              type="date"
                              required={isJobMode}
                              value={jobStartAt}
                              onChange={e => setJobStartAt(e.target.value)}
                              disabled={scheduleLater}
                              className={cn("h-12 rounded-xl font-bold transition-all", scheduleLater && "opacity-50 grayscale")}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="jobEndAt" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">End Date</Label>
                            <Input
                              id="jobEndAt"
                              type="date"
                              value={jobEndAt}
                              onChange={e => setJobEndAt(e.target.value)}
                              disabled={scheduleLater}
                              className={cn("h-12 rounded-xl font-bold transition-all", scheduleLater && "opacity-50 grayscale")}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setScheduleLater(!scheduleLater)}>
                          <Checkbox
                            id="scheduleLater"
                            checked={scheduleLater}
                            onCheckedChange={(checked) => setScheduleLater(!!checked)}
                            className="h-5 w-5 rounded-md border-primary/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <Label htmlFor="scheduleLater" className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors cursor-pointer">Schedule later</Label>
                        </div>

                        {!scheduleLater && (
                          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                              <div className={cn("grid grid-cols-2 border border-border/40 rounded-xl overflow-hidden transition-all", anytime && "opacity-50 grayscale")}>
                                <div className="space-y-1 p-3 bg-muted/5 border-r border-border/20">
                                  <Label className="text-[9px] font-black uppercase text-muted-foreground">Start time</Label>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3 text-primary/40" />
                                    <input
                                      type="time"
                                      value={startTime}
                                      onChange={e => setStartTime(e.target.value)}
                                      disabled={anytime}
                                      className="bg-transparent border-none text-xs font-bold focus:ring-0 p-0 w-full"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1 p-3 bg-muted/5">
                                  <Label className="text-[9px] font-black uppercase text-muted-foreground">End time</Label>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3 text-primary/40" />
                                    <input
                                      type="time"
                                      value={endTime}
                                      onChange={e => setEndTime(e.target.value)}
                                      disabled={anytime}
                                      className="bg-transparent border-none text-xs font-bold focus:ring-0 p-0 w-full"
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center pb-4">
                                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setAnytime(!anytime)}>
                                  <Checkbox
                                    id="anytime"
                                    checked={anytime}
                                    onCheckedChange={(checked) => setAnytime(!!checked)}
                                    className="h-5 w-5 rounded-md border-primary/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                  />
                                  <Label htmlFor="anytime" className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors cursor-pointer">Anytime</Label>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Repeats — shown for both one-off and recurring */}
                        <div className="space-y-2 animate-in fade-in duration-300">
                          <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Repeats</Label>
                          <select
                            id="recurringInterval"
                            value={recurringInterval}
                            onChange={e => setRecurringInterval(e.target.value)}
                            className="h-12 w-full px-4 border border-border/40 rounded-xl bg-background text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 appearance-none cursor-pointer transition-all hover:border-primary/20"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Biweekly (every 2 weeks)</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                          </select>
                        </div>

                        {recurringInterval === 'weekly' && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setDaysOfWeek(prev =>
                                    prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]
                                  );
                                }}
                                className={cn(
                                  "h-10 w-10 rounded-lg text-[10px] font-black transition-all",
                                  daysOfWeek.includes(idx)
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
                                )}
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right Column: Assignments and Instructions */}
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Assigned Team Members</Label>
                          <Popover>
                            <PopoverTrigger>
                              <Button
                                type="button"
                                variant="outline"
                                className="min-h-[3rem] w-full p-2 border border-border/40 rounded-xl bg-background cursor-pointer hover:border-primary/20 transition-all flex flex-wrap gap-1.5 justify-start h-auto"
                              >
                                {assignedTeamMembers.length === 0 ? (
                                  <span className="text-muted-foreground text-xs font-medium px-2 py-1">Choose members...</span>
                                ) : (
                                  assignedTeamMembers.map(id => {
                                    const member = teamMembers.find(m => m.id === id);
                                    return (
                                      <div key={id} className="bg-primary text-primary-foreground text-[10px] font-black flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/20 group/tag">
                                        <span className="text-white">{member?.name || 'Unknown'}</span>
                                        <X
                                          className="h-3 w-3 text-white/60 hover:text-white cursor-pointer"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setAssignedTeamMembers(prev => prev.filter(mid => mid !== id));
                                          }}
                                        />
                                      </div>
                                    );
                                  })
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0 rounded-2xl border-border/40" align="start" side="bottom" sideOffset={4}>
                              <Command>
                                <CommandInput placeholder="Search team members..." className="h-11 font-manrope" />
                                <CommandList>
                                  <CommandEmpty>No results found.</CommandEmpty>
                                  <CommandGroup className="p-2">
                                    {teamMembers.map((member) => (
                                      <CommandItem
                                        key={member.id}
                                        onSelect={() => {
                                          setAssignedTeamMembers(prev =>
                                            prev.includes(member.id)
                                              ? prev.filter(id => id !== member.id)
                                              : [...prev, member.id]
                                          );
                                        }}
                                        className="rounded-lg py-2.5 px-3 cursor-pointer mb-1 last:mb-0"
                                      >
                                        <div className="flex items-center gap-3 w-full">
                                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
                                            {member.name?.substring(0, 2).toUpperCase()}
                                          </div>
                                          <div className="flex-1 flex flex-col">
                                            <span className="font-bold text-sm">{member.name}</span>
                                            <span className="text-[10px] text-muted-foreground font-medium">{member.role || 'Member'}</span>
                                          </div>
                                          {assignedTeamMembers.includes(member.id) && <Check className="h-4 w-4 text-primary" />}
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setEmailTeamAssignment(!emailTeamAssignment)}>
                          <Checkbox
                            id="emailTeam"
                            checked={emailTeamAssignment}
                            onCheckedChange={(checked) => setEmailTeamAssignment(!!checked)}
                            className="h-5 w-5 rounded-md border-primary/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <Label htmlFor="emailTeam" className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors cursor-pointer">Email team about assignment</Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-border/10">
                      <Label htmlFor="visitInstructions" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Visit instructions</Label>
                      <Textarea
                        id="visitInstructions"
                        placeholder="Directions, gate codes, pet info, etc..."
                        value={visitInstructions}
                        onChange={e => setVisitInstructions(e.target.value)}
                        className="min-h-[120px] rounded-2xl bg-muted/5 border-border/40 font-manrope font-bold text-sm p-4 tracking-tight focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                  </div>
                )}

                {/* General Notes for Non-Job Mode or Shared */}
                {!isJobMode && (
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Notes (Visible to Customer)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Additional information, special conditions, or thank you note..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="min-h-[80px] rounded-xl font-bold"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg uppercase font-black tracking-tight font-archivo ml-1 flex items-center">
            {isJobMode ? 'Job Items' : 'Quote Items'}
            <FormHelp
              title="Line Items"
              text="Add products or services. You can set quantities and unit prices. Click inside the unit price to calculate cost and markup. Check 'Mark as optional' to let clients decide on an item."
            />
          </h2>
          <Card id="tour-line-items" className="shadow-sm border-none bg-muted/20 overflow-visible rounded-3xl" >
            <CardContent className="px-4 md:px-10 py-10">
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
                  id="tour-item-add"
                  type="button"
                  onClick={addItem}
                  className="bg-primary text-white font-bold px-10 h-14 rounded-2xl shadow-xl transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3 uppercase text-[10px] tracking-[0.2em]"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div id="tour-adjustments" className="mt-8 border-t border-border/50 pt-6 flex flex-col items-end space-y-4 px-2">
          {/* Subtotal */}
          <div className="flex justify-between w-full md:w-96 text-sm font-bold pt-2 border-b border-border/10 pb-4 relative">
            <div className="absolute -left-6 top-2">
              <FormHelp
                title="Adjustments & Taxes"
                text="Apply discounts as percentages or fixed amounts. Select or create tax rates. Request a deposit before starting work."
              />
            </div>
            <span className="text-muted-foreground uppercase text-[10px] tracking-widest self-center">Subtotal:</span>
            <span className="font-bold text-lg tabular-nums">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="w-full md:w-96 space-y-4">
            {/* Discount Row */}
            {discountAdjustment ? (
              <div className="flex justify-between items-center group/adj py-1">
                <span className="text-sm font-medium text-foreground min-w-[100px]">Discount</span>
                <div className="flex items-center gap-2 flex-1 justify-center max-w-[150px]">
                  <div className="flex items-center border border-border/60 rounded-xl overflow-hidden bg-card shadow-sm h-11 transition-all focus-within:ring-2 focus-within:ring-primary/20">
                    <Input
                      type="number"
                      value={discountAdjustment.value || ''}
                      className="w-16 h-full text-center border-none focus-visible:ring-0 text-sm font-bold placeholder:text-muted-foreground/30"
                      onChange={(e) => updateAdjustment(discountAdjustment.id, { value: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                    <div className="h-5 w-px bg-border/20" />
                    <select
                      value={discountAdjustment.valueType}
                      onChange={(e) => updateAdjustment(discountAdjustment.id, { valueType: e.target.value as any })}
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
                <div className="flex items-center gap-2 flex-1 justify-center max-w-[280px]">
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
                          updateAdjustment(taxAdjustment.id, {
                            value: tax.percentage,
                            label: tax.name
                          });
                        }
                      }}
                      className="h-11 w-full pl-4 pr-10 border border-border/60 rounded-xl bg-card shadow-sm text-sm font-bold text-[#0D3B47] focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none transition-all cursor-pointer hover:border-primary/40"
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

          <div className="flex justify-between items-center w-full md:w-96 pt-6 border-t-2 border-primary/10 mt-6 pb-2">
            <span className="uppercase text-[12px] tracking-[0.3em] font-black text-primary/40">Total</span>
            <span className="text-2xl md:text-3xl  font-black text-primary tabular-nums tracking-tight whitespace-nowrap ml-4">${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex flex-col items-end gap-2 w-full md:w-96">
            {!adjustments.find(a => a.type === 'discount') && (
              <button
                type="button"
                onClick={() => setAdjustments([...adjustments, { id: crypto.randomUUID(), label: 'Discount', type: 'discount', value: 0, valueType: 'percentage' }])}
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
            <button
              type="button"
              onClick={() => setIsDepositDialogOpen(true)}
              className="text-emerald-700 font-bold text-[10px] uppercase tracking-widest hover:underline pt-2"
            >
              {(depositAmount > 0 || requiredDeposit > 0) ? `Required: $${requiredDeposit.toLocaleString()} | Deposit: $${depositAmount.toLocaleString()} - Edit` : "Add Deposit or Payment Schedule"}
            </button>
          </div>
        </div>

        {/* Dialogs */}
        <Dialog open={isTaxDialogOpen} onOpenChange={setIsTaxDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className=" text-xl">Create New Tax Rate</DialogTitle>
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
                          updateAdjustment(taxAdj.id, {
                            label: data.name,
                            value: data.percentage
                          });
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
              <DialogTitle className=" text-xl">Deposit & Payment Schedule</DialogTitle>
              <DialogDescription>Define the upfront payment required and terms.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Required Deposit ($)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={requiredDeposit || ""}
                      onChange={(e) => setRequiredDeposit(parseFloat(e.target.value) || 0)}
                      className="rounded-xl pl-8"
                    />
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Required Deposit (%)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0"
                      value={requiredDeposit ? (isNaN(total) || total <= 0 ? 0 : Number(((requiredDeposit / total) * 100).toFixed(2))) : ""}
                      onChange={(e) => {
                        const pct = parseFloat(e.target.value) || 0;
                        setRequiredDeposit(Number((total * pct / 100).toFixed(2)));
                      }}
                      className="rounded-xl pr-8"
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Collected Amount ($)</Label>
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

        {/* AI Generation Modal */}
        <Dialog open={isAIModalOpen} onOpenChange={setIsAIModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Design Assistant
              </DialogTitle>
              <DialogDescription>
                Tell me a little more about the project and I'll generate a complete quote proposal for you.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              <div className="space-y-2">
                <Label htmlFor="aiProjectName" className="text-sm font-semibold flex items-center gap-1">
                  Project Name
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="aiProjectName"
                  placeholder="e.g. Colonial Kitchen Remodel"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground italic">Use the current project name or change it here.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aiDesc" className="text-sm font-semibold">What is the project about?</Label>
                <Textarea
                  id="aiDesc"
                  placeholder="Describe the scope... e.g. Floor replacement, painting, LED lighting, built-in cabinets."
                  value={aiProjectDescription}
                  onChange={(e) => setAIProjectDescription(e.target.value)}
                  className="min-h-[130px] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsAIModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleAIGenerate}
                  disabled={isGeneratingAI || !projectName}
                  className="flex-1 bg-[#0D3B47] hover:bg-[#072a33] text-white"
                >
                  {isGeneratingAI ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Wand2 className="h-4 w-4" />
                      Generate Quote
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-6 pt-4 pb-64">
          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:-translate-y-1">
            <Save className="mr-2 h-5 w-5" />
            {isSubmitting
              ? (isJobMode ? 'Creating Job...' : (mode === 'edit' ? 'Updating...' : 'Saving...'))
              : isJobMode ? 'Create Job'
                : isTemplate ? 'Save Template'
                  : mode === 'edit' ? 'Update Quote'
                    : 'Generate and Save Quote'}
          </Button>
        </div>
      </form>
      {/* New Client Modal */}
      <Dialog open={isNewClientModalOpen} onOpenChange={setIsNewClientModalOpen}>
        <DialogContent className="max-w-2xl rounded-3xl border-none p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-8 bg-muted/5 border-b border-border/10">
            <DialogTitle className="text-2xl uppercase font-black tracking-tight font-archivo">
              {selectedClientId === 'new' ? 'New Client Information' : 'Edit Client Information'}
            </DialogTitle>
            <DialogDescription className="font-manrope font-bold text-muted-foreground">
              Enter the client's contact and address details.
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar font-manrope">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="companyNameModal" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Company Name (Optional)</Label>
                <Input id="companyNameModal" placeholder="e.g. Acme Corp" value={companyName} onChange={e => setCompanyName(e.target.value)} className="h-12 rounded-xl font-bold bg-background border-border/40" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="titleModal" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Title</Label>
                  <Input id="titleModal" placeholder="Mr., Mrs., Dr." value={title} onChange={e => setTitle(e.target.value)} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstNameModal" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">First Name *</Label>
                  <Input id="firstNameModal" required placeholder="e.g. John" value={firstName} onChange={e => setFirstName(e.target.value)} className="h-12 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastNameModal" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Last Name *</Label>
                  <Input id="lastNameModal" required placeholder="e.g. Doe" value={lastName} onChange={e => setLastName(e.target.value)} className="h-12 rounded-xl font-bold" />
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-border/10">
                <Label htmlFor="street1Modal" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Address Line 1 (Search with Google) *</Label>
                <Autocomplete
                  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                  onPlaceSelected={handlePlaceSelected}
                  options={{ types: ["address"] }}
                  className="flex h-12 w-full rounded-xl border border-border/40 bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-bold transition-all focus:border-primary/50"
                  placeholder="Start typing an address..."
                  defaultValue={street1}
                  onChange={(e: any) => setStreet1(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="street2Modal" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Address Line 2 (Optional)</Label>
                <Input id="street2Modal" placeholder="Apt, Suite, Floor..." value={street2} onChange={e => setStreet2(e.target.value)} className="h-12 rounded-xl" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cityModal" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">City</Label>
                  <Input id="cityModal" placeholder="e.g. New York" value={city} onChange={e => setCity(e.target.value)} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provinceModal" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">State / Province</Label>
                  <Input id="provinceModal" placeholder="e.g. NY" value={province} onChange={e => setProvince(e.target.value)} className="h-12 rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postalCodeModal" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Postal Code</Label>
                  <Input id="postalCodeModal" placeholder="10001" value={postalCode} onChange={e => setPostalCode(e.target.value)} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="countryModal" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Country</Label>
                  <Input id="countryModal" placeholder="USA" value={country} onChange={e => setCountry(e.target.value)} className="h-12 rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/10">
                <div className="space-y-2">
                  <Label htmlFor="clientEmailModal" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email (Optional)</Label>
                  <Input id="clientEmailModal" type="email" placeholder="email@example.com" value={clientEmail} onChange={e => setClientEmail(e.target.value)} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhoneModal" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Phone (Optional)</Label>
                  <Input id="clientPhoneModal" placeholder="+123456789" value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="h-12 rounded-xl" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 bg-muted/5 border-t border-border/10 flex sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNewClientModalOpen(false)}
              className="rounded-xl h-12 px-6 font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => setIsNewClientModalOpen(false)}
              className="rounded-xl h-12 px-8 font-black uppercase tracking-widest text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_10px_20px_-10px_rgba(var(--primary),0.5)] border-none"
            >
              Save Information
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ProformaTour
        run={isTutorialOpen}
        onFinish={() => setIsTutorialOpen(false)}
      />
    </div>
  );
}
