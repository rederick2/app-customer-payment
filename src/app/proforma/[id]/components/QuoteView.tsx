'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { ArrowLeft, MessageSquare, ZoomIn, Pencil, GripVertical, Check, X, Trash2, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import ProformaDropdownActions from './ProformaDropdownActions';
import EmailQuoteModal from './EmailQuoteModal';
import { cn } from '@/lib/utils';
import { LineItemImage } from '@/components/LineItemImage';
import { Checkbox } from '@/components/ui/checkbox';
import { toggleItemOptional, updateItemsOrder, updateProformaItem } from './actions';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

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

interface QuoteViewProps {
  proforma: any;
  items: any[];
  id: string;
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'approved':
      return <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-500/20 text-sm py-1 px-3">Approved</Badge>;
    case 'rejected':
      return <Badge variant="destructive" className="bg-red-500/10 text-red-700 hover:bg-red-500/20 border-red-500/20 text-sm py-1 px-3">Rejected</Badge>;
    case 'sent':
      return <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-blue-500/20 text-sm py-1 px-3">Sent</Badge>;
    case 'job':
      return <Badge className="bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 border-purple-500/20 text-sm py-1 px-3">Job</Badge>;
    default:
      return <Badge variant="outline" className="text-sm py-1 px-3">Draft</Badge>;
  }
}

interface ItemEditorProps {
  item: any;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  isReadOnly: boolean;
}

function ItemEditor({ item, onSave, onCancel, isReadOnly }: ItemEditorProps) {
  const [formData, setFormData] = React.useState({
    description: item.description,
    details: item.details || '',
    quantity: item.quantity,
    unit_price: item.unit_price,
    is_optional: item.is_optional || false,
    photo: null as File | null,
    photoPreviewUrl: item.photo_url as string | undefined,
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const total = formData.quantity * formData.unit_price;

  if (isReadOnly) return null;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({
        ...prev,
        photo: file,
        photoPreviewUrl: URL.createObjectURL(file)
      }));
    }
  };

  const removePhoto = () => {
    setFormData(prev => ({
      ...prev,
      photo: null,
      photoPreviewUrl: undefined
    }));
  };

  return (
    <div className="p-8 bg-muted/30 border-y-2 border-primary/20 space-y-8 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-4">
        <div className="w-8 pt-8 text-muted-foreground/20"><GripVertical className="h-6 w-6" /></div>

        <div className="flex-1 space-y-8">
          {/* Main Grid: Name, Quantity, Unit Price, Total */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
            <div className="md:col-span-4 space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Nombre</Label>
              <Input
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="h-14 border-border/60 focus:border-primary/40 bg-background font-bold text-lg px-4"
                placeholder="e.g. Demoler Baño"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 text-center block">Cantidad</Label>
              <div className="h-14 border-2 border-primary/20 rounded-xl flex items-center justify-center bg-background focus-within:border-primary transition-all overflow-hidden shadow-sm">
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className="w-full h-full text-center bg-transparent border-none focus:ring-0 font-black text-xl"
                />
              </div>
            </div>

            <div className="md:col-span-3 space-y-2 text-right">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 pr-2">Precio Unitario</Label>
              <div className="h-14 flex items-center justify-end px-4 bg-background border border-border/60 rounded-xl focus-within:border-primary/40 transition-all shadow-sm">
                <input
                  type="number"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={e => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                  className="w-full bg-transparent border-none focus:ring-0 text-right font-black text-xl pr-1"
                />
                <span className="text-[10px] font-black text-muted-foreground/30 ml-1">USD</span>
              </div>
            </div>

            <div className="md:col-span-3 space-y-2 text-right pr-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Total</Label>
              <div className="h-14 flex items-center justify-end font-black text-primary text-2xl tracking-tighter">
                ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Middle Grid: Description and Image */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pb-4">
            <div className="lg:col-span-3 space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Descripción</Label>
              <Textarea
                value={formData.details}
                onChange={e => setFormData({ ...formData, details: e.target.value })}
                className="min-h-[140px] bg-background border-dashed border-border/80 focus:border-primary/30 text-md leading-relaxed p-5 rounded-xl resize-none"
                placeholder="Añade más detalles..."
              />
            </div>

            <div className="lg:col-span-1 space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Foto del Item</Label>
              <div className="relative h-40 w-full rounded-2xl overflow-hidden border-2 border-border/40 bg-background group shadow-sm hover:shadow-md transition-all flex items-center justify-center">
                {formData.photoPreviewUrl ? (
                  <>
                    <img src={formData.photoPreviewUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-9 w-9 rounded-xl shadow-2xl bg-white/90 backdrop-blur-md border border-border/20 text-primary hover:bg-white"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-9 w-9 rounded-xl shadow-2xl bg-destructive/90 backdrop-blur-md border border-white/10 hover:bg-destructive"
                        onClick={removePhoto}
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div
                    className="h-full w-full flex flex-col items-center justify-center gap-3 text-muted-foreground/20 cursor-pointer hover:bg-muted/5 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-10 w-10 stroke-[1.5px]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Subir Foto</span>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
              </div>
            </div>
          </div>

          {/* Footer Row: Optional and Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-border/10 gap-6">
            <div className="flex items-center gap-4 bg-background px-6 py-3 rounded-2xl border border-border/30 transition-colors cursor-pointer group/opt">
              <Checkbox
                id="is_optional_edit"
                checked={formData.is_optional}
                onCheckedChange={(checked) => setFormData({ ...formData, is_optional: !!checked })}
                className="h-6 w-6 rounded-lg border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all group-hover/opt:scale-110"
              />
              <Label htmlFor="is_optional_edit" className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground/80 cursor-pointer select-none">Marcar como opcional</Label>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onCancel} className="font-black text-[10px] uppercase tracking-[0.3em] h-12 px-10 text-muted-foreground hover:text-foreground">
                Cancelar
              </Button>
              <Button
                onClick={() => onSave(formData)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl h-14 px-12 font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 active:scale-95 transition-all"
              >
                <Check className="mr-3 h-5 w-5" /> Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SortableRowProps {
  item: any;
  index: number;
  isReadOnly: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (data: any) => Promise<void>;
  onToggleExcluded: (itemId: string, currentExcluded: boolean) => Promise<void>;
}

function SortableRow({
  item,
  isReadOnly,
  isEditing,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onToggleExcluded
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: isReadOnly || isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  };

  if (isEditing) {
    return (
      <tr ref={setNodeRef} style={style} className="print:hidden">
        <td colSpan={7} className="p-0 border-none">
          <ItemEditor
            item={item}
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
            isReadOnly={isReadOnly}
          />
        </td>
      </tr>
    );
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "group transition-all hover:bg-muted/30 cursor-pointer align-top",
        isDragging && "bg-accent shadow-lg ring-1 ring-primary/20",
        item.is_excluded && "opacity-60 grayscale-[0.3]"
      )}
      onClick={onEdit}
    >
      <td className="px-4 py-5 text-center">
        {!isReadOnly && !isEditing && (
          <div
            {...attributes}
            {...listeners}
            className="p-1.5 rounded hover:bg-muted cursor-grab active:cursor-grabbing text-muted-foreground/50 group-hover:text-muted-foreground transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
      </td>
      <td className="px-4 py-5 text-center">
        {item.is_optional && (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={!item.is_excluded}
              disabled={isReadOnly}
              onCheckedChange={(checked) => {
                onToggleExcluded(item.id, !checked);
              }}
              className={cn(
                "opacity-100",
                !isReadOnly ? "cursor-pointer" : "cursor-default"
              )}
            />
          </div>
        )}
      </td>
      <td className="px-4 py-4">
        <div className="font-bold text-foreground text-md flex items-center gap-2">
          {item.description}
          {item.is_optional && <Badge variant="secondary" className="font-normal text-[10px] px-1.5 py-0">Opcional</Badge>}
        </div>
        {item.details && (
          <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed italic">{item.details}</div>
        )}
      </td>
      <td className="px-4 py-4 text-center">
        <div onClick={(e) => e.stopPropagation()}>
          {item.photo_url ? (
            <LineItemImage
              src={item.photo_url}
              alt={item.description}
              className="h-14 w-14 mx-auto rounded-lg shadow-sm group-hover:shadow transition-shadow"
            />
          ) : (
            <div className="h-14 w-14 mx-auto bg-muted/10 rounded-lg border border-dashed border-border/50 flex items-center justify-center text-muted-foreground/20 group-hover:text-muted-foreground/40 transition-colors">
              <ZoomIn className="h-4 w-4" />
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-4 text-right tabular-nums">{item.quantity}</td>
      <td className="px-4 py-4 text-right tabular-nums">${item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      <td className={cn("px-4 py-4 text-right font-bold tabular-nums", item.is_excluded ? "text-muted-foreground line-through decoration-primary/40" : "text-foreground")}>
        ${item.total_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </td>
    </tr>
  );
}

export function QuoteView({ proforma, items: initialItems, id }: QuoteViewProps) {
  const [items, setItems] = React.useState(initialItems);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const isReadOnly = proforma.status === 'approved' || proforma.status === 'job';
  console.log(proforma)
  console.log(1)
  // Sort items initially by sort_order
  React.useEffect(() => {
    setItems([...initialItems].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
  }, [initialItems]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || isReadOnly) return;

    const oldIndex = items.findIndex(item => item.id === active.id);
    const newIndex = items.findIndex(item => item.id === over.id);

    const newItemsOrder = arrayMove(items, oldIndex, newIndex);
    setItems(newItemsOrder);

    // Save to DB
    const updates = newItemsOrder.map((item, idx) => ({
      id: item.id,
      sort_order: idx,
    }));

    const res = await updateItemsOrder(proforma.id, updates);
    if (res.error) toast.error(res.error);
    else toast.success('Order updated');
  };

  const handleToggleExcludedAction = async (itemId: string, isExcluded: boolean) => {
    if (isReadOnly) return;
    const res = await toggleItemOptional(itemId, proforma.id, isExcluded);
    if (res.error) toast.error(res.error);
  };

  const handleSaveItem = async (data: any) => {
    if (!editingId) return;

    let photo_url = data.photoPreviewUrl;

    if (data.photo) {
      const toastId = toast.loading('Subiendo foto...');
      try {
        const uploadFormData = new FormData();
        uploadFormData.append('file', data.photo);
        uploadFormData.append('folder', `proforma-items/${proforma.id}`);

        const response = await fetch('/api/upload', { method: 'POST', body: uploadFormData });
        if (response.ok) {
          const { url } = await response.json();
          photo_url = url;
          toast.success('Foto subida', { id: toastId });
        } else {
          toast.error('Error al subir la foto', { id: toastId });
        }
      } catch (err) {
        console.error('Error uploading photo:', err);
        toast.error('Error al subir la foto', { id: toastId });
      }
    }

    const payload = {
      ...data,
      photo_url
    };

    const res = await updateProformaItem(editingId, proforma.id, payload);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Item actualizado');
      setEditingId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-in fade-in duration-500">

      {/* Action Bar */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel
          </Link>
          <span className="text-muted-foreground/40">·</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Estado:</span>
            <StatusBadge status={proforma.status || 'draft'} />
          </div>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {!isReadOnly && (
            <Link
              href={`/proforma/${id}/edit`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-primary/20 bg-primary/5 text-sm font-medium text-primary hover:bg-primary/10 transition-all"
            >
              <Pencil className="h-4 w-4" />
              Editor Completo
            </Link>
          )}
          <ProformaDropdownActions proformaId={id} currentStatus={proforma.status || 'draft'} projectName={proforma.project_name} />
          <EmailQuoteModal
            proformaId={id}
            clientName={(() => {
              const c = proforma.clients as any;
              return c?.company_name || [c?.first_name, c?.last_name].filter(Boolean).join(' ') || c?.name || 'Client';
            })()}
            clientEmail={(proforma.clients as any)?.email || ''}
            projectName={proforma.project_name}
            total={proforma.total}
          />
        </div>
      </div>


      {/* Printable Document Area */}
      <div className="bg-card print:bg-transparent shadow-2xl print:shadow-none border border-border/50 print:border-none p-10 md:p-16 mb-8 rounded-2xl relative overflow-hidden">

        {/* Design Accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-tr-full -ml-16 -mb-16 pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-border/50 pb-10 mb-10 relative z-10">
          <div>
            <h1 className="font-serif text-5xl font-bold tracking-tight text-primary">EstudioPro</h1>
            <p className="text-md text-muted-foreground mt-2 font-medium tracking-wide">Diseño de Interiores & Remodelaciones</p>
          </div>
          <div className="mt-8 sm:mt-0 text-right space-y-2">
            <h2 className="text-3xl font-bold text-foreground font-serif uppercase tracking-[0.2em] text-muted-foreground/30 print:text-muted-foreground/80">Cotización</h2>
            <div className="space-y-1">
              <p className="text-sm font-semibold">REF Nº: <span className="font-mono text-primary">{proforma.id.split('-')[0].toUpperCase()}</span></p>
              <p className="text-sm text-muted-foreground">Emitida: {new Date(proforma.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="text-sm text-muted-foreground">Válida por 30 días</p>
            </div>
          </div>
        </div>

        {/* Client & Project Info */}
        <div className="grid sm:grid-cols-2 gap-12 mb-16 relative z-10">
          <div className="p-6 rounded-xl bg-muted/5 border border-border/30">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/60 mb-4">Información del Cliente</h3>
            <p className="font-bold text-xl text-foreground mb-1">
              {(() => {
                const c = proforma.clients as any;
                const nameDisplay = [c.title, c.first_name, c.last_name].filter(Boolean).join(' ') || c.name;
                return c.company_name || nameDisplay;
              })()}
            </p>
            {(() => {
              const c = proforma.clients as any;
              const nameDisplay = [c.title, c.first_name, c.last_name].filter(Boolean).join(' ') || c.name;
              if (c.company_name && nameDisplay) {
                return <p className="text-sm font-medium text-muted-foreground mb-3">Atte: {nameDisplay}</p>;
              }
              return null;
            })()}

            <div className="text-sm space-y-1 text-muted-foreground/80">
              {(() => {
                const c = proforma.clients as any;
                const items = [c.street_1, c.street_2, c.city, c.province, c.country].filter(Boolean);
                return items.length > 0 ? labelsFromAddress(c) : (c.address && <p>{c.address}</p>);
              })()}
            </div>

            <div className="mt-4 pt-4 border-t border-border/20 space-y-1">
              {(proforma.clients as any).email && <p className="text-sm font-medium text-primary/70">{(proforma.clients as any).email}</p>}
              {(proforma.clients as any).phone && <p className="text-sm text-muted-foreground">{(proforma.clients as any).phone}</p>}
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/60 mb-2">Presupuesto del Proyecto</h3>
            <p className="font-serif text-3xl font-bold text-foreground italic leading-tight">"{proforma.project_name}"</p>
          </div>
        </div>

        {/* Items Context */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <div className="mb-12 relative z-10">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-[#F4F2EC]/80 backdrop-blur-sm print:bg-transparent text-[#0D3B47] border-y border-primary/10">
                <tr>
                  <th className="px-4 py-4 font-bold uppercase tracking-wider w-10"></th>
                  <th className="px-4 py-4 font-bold uppercase tracking-wider w-10 text-center text-[10px]">Suma</th>
                  <th className="px-4 py-4 font-bold uppercase tracking-wider">Producto / Servicio</th>
                  <th className="px-4 py-4 font-bold uppercase tracking-wider text-center w-24">Media</th>
                  <th className="px-4 py-4 font-bold uppercase tracking-wider text-right w-24">Cantidad</th>
                  <th className="px-4 py-4 font-bold uppercase tracking-wider text-right w-32">Precio Unitario</th>
                  <th className="px-4 py-4 font-bold uppercase tracking-wider text-right w-32">Total</th>
                </tr>
              </thead>
              <tbody className="relative">
                <SortableContext
                  items={items.map(i => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {items.map((item, index) => (
                    <SortableRow
                      key={item.id}
                      item={item}
                      index={index}
                      isReadOnly={isReadOnly}
                      isEditing={editingId === item.id}
                      onEdit={() => !isReadOnly && setEditingId(item.id)}
                      onCancelEdit={() => setEditingId(null)}
                      onSaveEdit={handleSaveItem}
                      onToggleExcluded={handleToggleExcludedAction}
                    />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </div>
        </DndContext>

        {/* Totals Box */}
        <div className="flex justify-end mb-20 print:break-inside-avoid relative z-10">
          <div className="w-full sm:w-1/2 p-8 bg-[#F4F2EC] print:bg-transparent print:border print:border-border/50 rounded-2xl border border-primary/5 space-y-4 text-[#0D3B47] shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium tracking-wide uppercase opacity-70">Subtotal</span>
              <span className="font-mono font-bold">${proforma.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="space-y-3 py-2">
              {(() => {
                const adjustments = (proforma.adjustments || []) as any[];
                if (adjustments.length > 0) {
                  const subtotal = proforma.subtotal;
                  const discountAdjustments = adjustments.filter(a => a.type === 'discount');
                  const taxAdjustments = adjustments.filter(a => a.type === 'tax');

                  const totalDiscount = discountAdjustments.reduce((acc, adj) => {
                    return acc + (adj.valueType === 'percentage' ? (subtotal * adj.value) / 100 : adj.value);
                  }, 0);

                  const taxableAmount = subtotal - totalDiscount;

                  return adjustments.map((adj, idx) => {
                    const amount = adj.type === 'discount'
                      ? (adj.valueType === 'percentage' ? (subtotal * adj.value) / 100 : adj.value)
                      : (adj.valueType === 'percentage' ? (taxableAmount * adj.value) / 100 : adj.value);

                    return (
                      <div key={idx} className="flex justify-between items-center text-sm opacity-80 group/adj">
                        <span className="font-medium">
                          {adj.label}
                          {adj.valueType === 'percentage' && (
                            <span className="text-[10px] ml-1 bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">{adj.value}%</span>
                          )}
                        </span>
                        <span className={cn("font-mono font-bold", adj.type === 'discount' ? "text-red-600" : "")}>
                          {adj.type === 'discount' ? '-' : '+'}${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    );
                  });
                } else if (Array.isArray(proforma.applied_taxes?.taxes) && proforma.applied_taxes.taxes.length > 0) {
                  return proforma.applied_taxes.taxes.map((tax: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm opacity-80">
                      <span className="font-medium">{tax.name} <span className="text-[10px] ml-1 bg-primary/10 text-primary px-1.5 rounded">{tax.percentage}%</span></span>
                      <span className="font-mono">${((tax.percentage * proforma.subtotal) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ));
                } else {
                  return (
                    <div className="flex justify-between items-center text-sm opacity-80">
                      <span className="font-medium">Impuesto Estándar (16%)</span>
                      <span className="font-mono">${proforma.tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  );
                }
              })()}
            </div>

            {(proforma as any).deposit_amount > 0 && (
              <div className="pt-4 border-t border-dashed border-[#0D3B47]/20 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#306C3E]">Condición de Pago / Anticipo</span>
                  <span className="font-mono font-bold text-[#306C3E] text-lg">
                    ${(proforma as any).deposit_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {(proforma as any).payment_terms && (
                  <p className="text-[10px] text-muted-foreground/80 mt-1 text-right italic leading-snug">
                    {(proforma as any).payment_terms}
                  </p>
                )}
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium tracking-wide uppercase opacity-70">Total</span>
              <span className="font-mono font-bold">${proforma.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="border-t border-border/30 pt-10 relative z-10 text-center">
          <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-primary/40 mb-4">Terms & Service</h4>
          <p className="text-[11px] text-muted-foreground/60 max-w-2xl mx-auto leading-loose italic">
            This professional estimate is non-binding until project commencement.
            Final dimensions and on-site specifications may adjust final billing.
            A 60% commencement deposit is standard policy.
            Thank you for choosing EstudioPro for your design vision.
          </p>
        </div>

      </div>

      {/* Communication */}
      <div className="grid grid-cols-1 gap-8 print:hidden">
        <Link
          href={`/proforma/${id}/messages`}
          className="flex items-center justify-between p-4 rounded-xl border border-primary/10 bg-card hover:border-primary/30 transition-all group shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">Discusión del Proyecto</p>
              <p className="text-xs text-muted-foreground">Colabora con el equipo del estudio en tiempo real</p>
            </div>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-600 border-none animate-pulse">Live Link</Badge>
        </Link>
      </div>

    </div>
  );
}

function labelsFromAddress(c: any) {
  return (
    <>
      {(c.street_1 || c.street_2) && (
        <p>{[c.street_1, c.street_2].filter(Boolean).join(', ')}</p>
      )}
      {(c.city || c.province || c.postal_code) && (
        <p>{[c.city, c.province, c.postal_code].filter(Boolean).join(', ')}</p>
      )}
      {c.country && <p>{c.country}</p>}
    </>
  );
}
