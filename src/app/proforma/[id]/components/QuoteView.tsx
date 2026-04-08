'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { ArrowLeft, MessageSquare, ZoomIn, Pencil, GripVertical, Check, X, Trash2, Image as ImageIcon, Loader2, Download, AlertTriangle, ExternalLink, FilePen, Building, PenLine } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import ProformaDropdownActions from './ProformaDropdownActions';
import EmailQuoteModal from './EmailQuoteModal';
import { cn } from '@/lib/utils';
import { LineItemImage } from '@/components/LineItemImage';
import { ExpandableText } from '@/components/ExpandableText';
import { Checkbox } from '@/components/ui/checkbox';
import { toggleItemOptional, updateItemsOrder, updateProformaItem, unlockApprovedProforma } from './actions';
import { approveProforma } from '@/app/p/[id]/actions';
import SignatureModal from '@/app/p/[id]/components/SignatureModal';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { StatusHistory } from './StatusHistory';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { History } from 'lucide-react';

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
import { useRouter } from 'next/navigation';

interface QuoteViewProps {
  proforma: any;
  items: any[];
  id: string;
  hideActionBar?: boolean;
}

function RemoveSignatureModal({
  isOpen,
  onClose,
  onConfirm,
  isPending
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const [understood, setUnderstood] = React.useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Signature will be removed</h2>
          </div>

          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>Editing an approved quote will remove the client's signature.</p>
            <p>To request a new signature, mark the quote as Awaiting Response, and re-send.</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Checkbox
              id="understand"
              checked={understood}
              onCheckedChange={(checked) => setUnderstood(!!checked)}
              className="h-5 w-5 rounded border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <Label htmlFor="understand" className="text-sm font-medium cursor-pointer select-none">
              I understand
            </Label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={onClose}
              className="px-6 h-11 rounded-xl font-bold text-sm text-muted-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              disabled={!understood || isPending}
              onClick={onConfirm}
              className="px-8 h-11 rounded-xl font-bold text-sm bg-muted/10 text-muted-foreground hover:bg-destructive hover:text-white transition-all disabled:opacity-50"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove Signature
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
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
    case 'job_terminated':
      return <Badge className="bg-slate-500/10 text-slate-700 hover:bg-slate-500/20 border-slate-500/20 text-sm py-1 px-3">Terminated</Badge>;
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
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Name</Label>
              <Input
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="h-14 border-border/60 focus:border-primary/40 bg-background font-bold text-lg px-4"
                placeholder="e.g. Bathroom Demolition"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 text-center block">Quantity</Label>
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
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 pr-2">Unit Price</Label>
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
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Description</Label>
              <Textarea
                value={formData.details}
                onChange={e => setFormData({ ...formData, details: e.target.value })}
                className="min-h-[140px] bg-background border-dashed border-border/80 focus:border-primary/30 text-md leading-relaxed p-5 rounded-xl resize-none"
                placeholder="Add more details..."
              />
            </div>

            <div className="lg:col-span-1 space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Item Photo</Label>
              <div className="relative h-40 w-full rounded-2xl overflow-hidden border-2 border-border/40 bg-background group shadow-sm hover:shadow-md transition-all flex items-center justify-center">
                {formData.photoPreviewUrl ? (
                  <>
                    <img src={formData.photoPreviewUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-9 w-9 rounded-xl shadow-2xl bg-card/90 backdrop-blur-md border border-border/20 text-primary hover:bg-card"
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
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Upload Photo</span>
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
              <Label htmlFor="is_optional_edit" className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground/80 cursor-pointer select-none">Mark as optional</Label>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onCancel} className="font-black text-[10px] uppercase tracking-[0.3em] h-12 px-10 text-muted-foreground hover:text-foreground">
                Cancel
              </Button>
              <Button
                onClick={() => onSave(formData)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl h-14 px-12 font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 active:scale-95 transition-all"
              >
                <Check className="mr-3 h-5 w-5" /> Save Changes
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
      <div ref={setNodeRef} style={style} className="print:hidden">
        <ItemEditor
          item={item}
          onSave={onSaveEdit}
          onCancel={onCancelEdit}
          isReadOnly={isReadOnly}
        />
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="group">
      {/* Desktop Table Row */}
      <table className="w-full hidden md:table border-collapse">
        <tbody className="divide-y divide-border/20">
          <tr
            onClick={onEdit}
            className={cn(
              "transition-all hover:bg-muted/30 cursor-pointer align-top",
              isDragging && "bg-accent shadow-lg ring-1 ring-primary/20",
              item.is_excluded && "opacity-60 grayscale-[0.3]"
            )}
          >
            <td className="px-4 py-5 text-center w-12">
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
            <td className="px-4 py-5 text-center w-16">
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
            <td className="px-4 py-5">
              <div className="font-bold text-base flex items-center gap-2">
                {item.description}
                {item.is_optional && <Badge variant="secondary" className="font-normal text-[10px] px-1.5 py-0">Optional</Badge>}
              </div>
            </td>
            <td className="px-4 py-4 text-center w-24">
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
            <td className="px-4 py-5 text-right tabular-nums w-24">{item.quantity}</td>
            <td className="px-4 py-5 text-right tabular-nums w-36">${item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td className={cn("px-4 py-5 text-right font-bold tabular-nums w-36", item.is_excluded ? "text-muted-foreground line-through decoration-primary/40" : "")}>
              ${item.total_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </td>
          </tr>
          {item.details && (
            <tr
              className={cn(
                "transition-all hover:bg-muted/30 cursor-pointer border-b border-primary/5",
                isDragging && "opacity-0",
                item.is_excluded && "opacity-60 grayscale-[0.3]"
              )}
              onClick={onEdit}
            >
              <td />
              <td />
              <td colSpan={5} className="px-4 pb-6 pt-0">
                <div className="border-l-2 border-primary/10 pl-4 py-1 italic">
                  <ExpandableText
                    text={item.details}
                    initialLines={3}
                    className="text-muted-foreground"
                  />
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Mobile Card View */}
      <div
        className={cn(
          "md:hidden p-4 rounded-2xl border transition-all bg-card mb-4",
          item.is_optional ? "border-primary/20 shadow-sm" : "border-border/40",
          item.is_excluded && "opacity-60 grayscale-[0.5]",
          isDragging && "scale-[1.02] shadow-xl z-50 border-primary"
        )}
        onClick={onEdit}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            {!isReadOnly && !isEditing && (
              <div
                {...attributes}
                {...listeners}
                className="p-2 -ml-2 rounded-lg hover:bg-muted cursor-grab active:cursor-grabbing text-muted-foreground/30"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-5 w-5" />
              </div>
            )}
            {item.is_optional ? (
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={!item.is_excluded}
                  disabled={isReadOnly}
                  onCheckedChange={(checked) => onToggleExcluded(item.id, !checked)}
                  className="h-5 w-5"
                />
                <span className="text-[10px] font-black uppercase tracking-tighter text-primary">Optional</span>
              </div>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 bg-muted/10 px-2 py-1 rounded-md">Fixed</span>
            )}
          </div>
          <div className={cn(
            "font-mono font-bold text-lg",
            item.is_excluded ? "text-muted-foreground line-through italic" : "text-[#0D3B47]"
          )}>
            ${item.total_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="flex gap-4 items-start mb-4">
          {item.photo_url ? (
            <LineItemImage
              src={item.photo_url}
              alt={item.description}
              className="h-16 w-16 flex-shrink-0 rounded-xl"
            />
          ) : (
            <div className="h-16 w-16 flex-shrink-0 bg-muted/10 rounded-xl border border-dashed border-border/50 flex items-center justify-center text-muted-foreground/20">
              <ZoomIn className="h-4 w-4" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-[#0D3B47] text-base leading-tight tracking-tight break-words">{item.description}</h4>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-3 border-y border-border/10 mb-4 bg-muted/5 rounded-lg px-3">
          <div>
            <p className="text-[8px] font-black text-muted-foreground uppercase mb-0.5">Quantity</p>
            <p className="font-mono text-sm font-bold">{item.quantity}</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black text-muted-foreground uppercase mb-0.5">Rate</p>
            <p className="font-mono text-sm font-bold">${item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {item.details && (
          <div className="mt-2">
            <ExpandableText
              text={item.details}
              initialLines={2}
              className="text-sm text-muted-foreground"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function QuoteView({ proforma, items: initialItems, id, hideActionBar = false }: QuoteViewProps) {
  const [items, setItems] = React.useState(initialItems);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [proformaStatus, setProformaStatus] = React.useState(proforma.status);
  const isReadOnly = proformaStatus === 'job';
  const isApproved = proformaStatus === 'approved';

  const [isSignatureModalOpen, setIsSignatureModalOpen] = React.useState(false);
  const [isSigningJob, setIsSigningJob] = React.useState(false);
  const [jobSignatureData, setJobSignatureData] = React.useState<string | null>(proforma.client_signature_data || null);

  const handleCollectSignature = async (signatureData: string | null, signatureName: string | null) => {
    setIsSigningJob(true);
    try {
      const result = await approveProforma(id, signatureData || undefined, signatureName || undefined);
      if (result.success) {
        setJobSignatureData(signatureData);
        setProformaStatus('approved');
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

  const [isUnlocking, setIsUnlocking] = React.useState(false);
  const [showUnlockModal, setShowUnlockModal] = React.useState(false);
  const [postUnlockAction, setPostUnlockAction] = React.useState<{
    type: 'full-editor' | 'edit-item' | 'reorder',
    itemId?: string,
    reorderEvent?: any
  } | null>(null);

  const router = useRouter();

  const [isMounted, setIsMounted] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const clientData = (Array.isArray(proforma.clients) ? proforma.clients[0] : proforma.clients) as any;

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      // Dynamic import inside function to ensure client-side only
      const { pdf } = await import('@react-pdf/renderer');
      const ProformaPDFModule = await import('@/lib/pdf/ProformaPDF');
      const ProformaPDFComponent = ProformaPDFModule.default;

      const blob = await pdf(
        <ProformaPDFComponent proforma={proforma} items={items} client={proforma.clients} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Error generating PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const proformaName = proforma.project_name || 'Quotations';
  const fileName = `quote_${String(proforma.number || proforma.id.split('-')[0]).toUpperCase()}.pdf`;

  //console.log(proforma)
  //console.log(1)
  // Sort items initially by sort_order
  React.useEffect(() => {
    setItems([...initialItems].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    setIsMounted(true);
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

    if (isApproved) {
      setPostUnlockAction({ type: 'reorder', reorderEvent: event });
      setShowUnlockModal(true);
      return;
    }

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
      const toastId = toast.loading('Uploading photo...');
      try {
        const uploadFormData = new FormData();
        uploadFormData.append('file', data.photo);
        uploadFormData.append('folder', `proforma-items/${proforma.id}`);

        const response = await fetch('/api/upload', { method: 'POST', body: uploadFormData });
        if (response.ok) {
          const { url } = await response.json();
          photo_url = url;
          toast.success('Photo uploaded', { id: toastId });
        } else {
          toast.error('Error uploading photo', { id: toastId });
        }
      } catch (err) {
        console.error('Error uploading photo:', err);
        toast.error('Error uploading photo', { id: toastId });
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
      toast.success('Item updated');
      setEditingId(null);
    }
  };

  const handleUnlockAndProceed = async () => {
    setIsUnlocking(true);
    try {
      const res = await unlockApprovedProforma(id);
      if (res.error) {
        toast.error(res.error);
        setIsUnlocking(false);
        return;
      }

      toast.success('Signature removed. Quote is now editable.');
      setProformaStatus('sent');
      setShowUnlockModal(false);

      if (postUnlockAction) {
        if (postUnlockAction.type === 'full-editor') {
          router.push(`/proforma/${id}/edit`);
        } else if (postUnlockAction.type === 'edit-item' && postUnlockAction.itemId) {
          setEditingId(postUnlockAction.itemId);
        } else if (postUnlockAction.type === 'reorder' && postUnlockAction.reorderEvent) {
          // Manually call the drag end logic if they were reordering
          const { active, over } = postUnlockAction.reorderEvent;
          const oldIndex = items.findIndex((i) => i.id === active.id);
          const newIndex = items.findIndex((i) => i.id === over.id);
          const updatedItems = arrayMove(items, oldIndex, newIndex).map((item, idx) => ({
            ...item,
            sort_order: idx + 1
          }));
          setItems(updatedItems);
          await updateItemsOrder(id, updatedItems);
        }
      }
    } catch (err) {
      console.error('Error unlocking proforma:', err);
      toast.error('Failed to remove signature');
    } finally {
      setIsUnlocking(false);
      setPostUnlockAction(null);
    }
  };

  const attemptEditItem = (itemId: string) => {
    if (isReadOnly) return;
    if (isApproved) {
      setPostUnlockAction({ type: 'edit-item', itemId });
      setShowUnlockModal(true);
      return;
    }
    setEditingId(itemId);
  };

  const attemptFullEditor = (e: React.MouseEvent) => {
    if (isReadOnly) return;
    if (isApproved) {
      e.preventDefault();
      setPostUnlockAction({ type: 'full-editor' });
      setShowUnlockModal(true);
      return;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-500">
      {/* Action Bar */}
      {!hideActionBar && (
        <div className="mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {!proforma.is_template && (
                <>
                  <StatusBadge status={proformaStatus || 'draft'} />
                  <Dialog>
                    <DialogTrigger render={
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-muted ml-1">
                        <History className="h-4 w-4 text-muted-foreground" />
                        <span className="sr-only">Ver historial</span>
                      </Button>
                    } />
                    <DialogContent className="sm:max-w-[540px]">
                      <DialogHeader className="mb-4">
                        <DialogTitle>History of the Quote</DialogTitle>
                        <DialogDescription>
                          Tracking of all status changes made.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="max-h-[60vh] overflow-y-auto pr-2 pb-4">
                        <StatusHistory proformaId={id} />
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            {/* Collect Signature button for jobs */}
            {/*proformaStatus === 'job' && (
              jobSignatureData || proforma.client_signature_data ? (
                <div className="flex items-center gap-2 px-4 h-10 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">Signed</span>
                </div>
              ) : (
                <Button
                  onClick={() => setIsSignatureModalOpen(true)}
                  className="h-10 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 rounded-xl transition-all"
                >
                  <PenLine className="h-4 w-4" />
                  Collect Signature
                </Button>
              )
            )*/}
            {!isReadOnly && (
              <Link href={`/proforma/${id}/edit`}>
                <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground transition-all">
                  <FilePen className="mr-2 h-4 w-4" />
                  Full Editor
                </Button>
              </Link>
            )}
            {!proforma.is_template && (
              <>
                <ProformaDropdownActions
                  proformaId={id}
                  currentStatus={proformaStatus || 'draft'}
                  projectName={proforma.project_name}
                  proforma={proforma}
                  items={items}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!isMounted || isGenerating}
                  onClick={handleDownloadPDF}
                  className="h-10 gap-2 border-border/60 hover:bg-muted/50 font-bold px-4"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isGenerating ? 'Preparing...' : 'Download PDF'}
                </Button>
                <EmailQuoteModal
                  proformaId={id}
                  proformaNumber={proforma.number}
                  clientName={(() => {
                    const c = proforma.clients;
                    return c?.company_name || [c?.first_name, c?.last_name].filter(Boolean).join(' ') || 'Client';
                  })()}
                  clientEmail={proforma.clients?.email || ''}
                  projectName={proforma.project_name}
                  total={proforma.total}
                  displayName={proforma.users?.display_name}
                />
              </>
            )}
          </div>
        </div>
      )}

      <RemoveSignatureModal
        isOpen={showUnlockModal}
        onClose={() => {
          setShowUnlockModal(false);
          setPostUnlockAction(null);
        }}
        onConfirm={handleUnlockAndProceed}
        isPending={isUnlocking}
      />

      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onConfirm={handleCollectSignature}
        isLoading={isSigningJob}
      />


      {/* Printable Document Area */}
      <div className="bg-card print:shadow-none border border-border/40 print:border-none p-6 md:p-10 mb-8 relative overflow-hidden">

        {/* Jobber Green Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#ac8e68]" />

        {/* Company Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10 relative z-10">
          <div className="flex-1 space-y-2">
            <div className="mb-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Building className="h-8 w-8" />
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  {proforma.users?.display_name}
                </h1>
              </div>
            </div>

            <div className="space-y-1 text-sm text-muted-foreground/80 font-medium">
              {proforma.users?.business_license && (
                <p className="font-bold text-[#ac8e68] mt-1 tracking-widest uppercase">
                  {proforma.users.business_license}
                </p>
              )}
              <p className="flex items-center gap-2">{proforma.users?.address}</p>
              {proforma.users?.phone && <p>{proforma.users.phone}</p>}
              {proforma.users?.email && <p className="text-primary/70">{proforma.users.email}</p>}
            </div>
          </div>

          <div className="flex flex-col items-end gap-6 w-full md:w-auto">
            {proforma.users?.logo_url ? (
              <img
                src={proforma.users.logo_url}
                alt="Company Logo"
                className="h-24 w-auto object-contain max-w-[240px]"
              />
            ) : (
              <div className="h-24 w-48 rounded-2xl bg-muted/20 border-2 border-dashed border-border/40 flex items-center justify-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">Logo Placeholder</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Info Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 relative z-10">
          {/* Recipient */}
          <div className="lg:col-span-7">
            {proforma.is_template ? (
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/40 mb-6 flex items-center gap-3">
                  <span className="h-px flex-1 bg-border/40" />
                  Template
                </h3>
                <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
                  This is a reusable template. It does not have an assigned client.
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 mb-4 flex items-center gap-3">
                  <span className="h-px flex-1 bg-border/40" />
                  Prepared For
                </h3>
                <div className="space-y-2">
                  <Link href={`/clients/${proforma.client_id}`} className='hover:underline'>
                    <p className="text-2xl font-bold text-foreground">
                      {(() => {
                        const c = proforma.clients as any;
                        if (!c) return 'No Client';
                        const nameDisplay = [c.title, c.first_name, c.last_name].filter(Boolean).join(' ') || c.name;
                        return c.company_name || nameDisplay;
                      })()}
                    </p>
                  </Link>

                  <div className="text-sm text-muted-foreground/80 font-medium">
                    {(() => {
                      const c = proforma.clients as any;
                      if (!c) return null;
                      const items = [c.street_1, c.street_2, c.city, c.province, c.postal_code].filter(Boolean);
                      return items.length > 0 ? (
                        <div className="space-y-0.5">
                          <p>{c.street_1}</p>
                          {c.street_2 && <p>{c.street_2}</p>}
                          <p>{[c.city, c.province, c.postal_code].filter(Boolean).join(', ')}</p>
                        </div>
                      ) : (c.address && <p>{c.address}</p>);
                    })()}
                  </div>

                  {proforma.clients && (
                    <div className="pt-4 flex flex-wrap gap-6 text-sm">
                      {(proforma.clients as any).email && (
                        <div className="flex flex-col">
                          <span className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-1">Email</span>
                          <span className="font-semibold text-primary/80">{(proforma.clients as any).email}</span>
                        </div>
                      )}
                      {(proforma.clients as any).phone && (
                        <div className="flex flex-col">
                          <span className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-1">Phone</span>
                          <span className="font-semibold text-foreground">{(proforma.clients as any).phone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Project & Summary Box */}
          <div className="lg:col-span-5 space-y-6">
            {!proforma.is_template && (
              <div className="border border-border/40 bg-background">
                <div className="bg-[#ac8e68] p-5 text-white">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-90">Estimate Number</span>
                    <Badge variant="outline" className="text-white border-white/30 bg-transparent rounded-none">
                      {String(proforma.number || proforma.id.split('-')[0]).toUpperCase()}
                    </Badge>
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight">
                    Estimate
                  </h2>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-bold">Sent on</span>
                    <span className="font-bold">{new Date(proforma.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-border/10 pt-4">
                    <span className="text-muted-foreground font-bold">Email Sent</span>
                    <span className="font-bold">{(proforma.clients as any).email ? 'Yes' : 'No'}</span>
                  </div>

                  <div className="mt-4 pt-4 border-t font-bold flex justify-between items-end">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground/80">Total Amount</span>
                    <span className="text-3xl text-[#ac8e68] tracking-tight">
                      ${proforma.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="px-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-2 flex items-center gap-3">
                Project
              </h3>
              <p className="text-xl font-bold text-foreground uppercase leading-tight">
                {proforma.project_name}
              </p>
            </div>
          </div>
        </div>

        {/* Items View */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <div className="mb-20 relative z-10">
            {/* Desktop Table Header */}
            <div className="hidden md:block border-x border-t border-border/40">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-[#ac8e68] text-white">
                  <tr>
                    <th className="px-4 py-6 font-black uppercase tracking-[0.2em] text-[10px] w-12 text-center"></th>
                    <th className="px-4 py-6 font-black uppercase tracking-[0.2em] text-[10px] w-16 text-center">Include</th>
                    <th className="px-4 py-6 font-black uppercase tracking-[0.2em] text-[10px]">Product / Service</th>
                    <th className="px-4 py-6 font-black uppercase tracking-[0.2em] text-[10px] text-center w-24">Media</th>
                    <th className="px-4 py-6 font-black uppercase tracking-[0.2em] text-[10px] text-center w-24">Qty</th>
                    <th className="px-4 py-6 font-black uppercase tracking-[0.2em] text-[10px] text-right w-36">Unit Price</th>
                    <th className="px-4 py-6 font-black uppercase tracking-[0.2em] text-[10px] text-right w-36">Total</th>
                  </tr>
                </thead>
              </table>
            </div>

            {/* Sortable Items Container */}
            <div className={cn(
              "space-y-0",
              "md:border-x md:border-b md:border-border/40 md:bg-card"
            )}>
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
                    onEdit={() => attemptEditItem(item.id)}
                    onCancelEdit={() => setEditingId(null)}
                    onSaveEdit={handleSaveItem}
                    onToggleExcluded={handleToggleExcludedAction}
                  />
                ))}
              </SortableContext>
            </div>
          </div>
        </DndContext>

        {/* Deposit & Totals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 relative z-10 mt-6 md:mt-0">
          <div className="lg:col-span-7">
            {proforma.required_deposit > 0 && (
              <div className="p-6 bg-[#ac8e68]/5 border border-dashed border-[#ac8e68]/30 flex items-center gap-6">
                <div className="h-12 w-12 bg-[#ac8e68] flex items-center justify-center text-white">
                  <Check className="h-6 w-6 stroke-[2px]" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ac8e68] mb-1">Required Deposit</h4>
                  <p className="text-xl font-black text-foreground">
                    A deposit of <span className="text-[#ac8e68]">${proforma.required_deposit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> will be required to begin.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <div className="space-y-4 px-6">
              <div className="flex justify-between items-center text-sm font-bold text-muted-foreground">
                <span className="uppercase tracking-widest text-[10px]">Subtotal</span>
                <span className="text-foreground">${proforma.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="space-y-4 py-4 border-y border-border/10">
                {(() => {
                  const adjustments = (proforma.adjustments || []) as any[];
                  if (adjustments.length > 0) {
                    const subtotal = proforma.subtotal;
                    const discountAdjustments = adjustments.filter(a => a.type === 'discount');
                    const totalDiscount = discountAdjustments.reduce((acc, adj) => {
                      return acc + (adj.valueType === 'percentage' ? (subtotal * adj.value) / 100 : adj.value);
                    }, 0);
                    const taxableAmount = subtotal - totalDiscount;

                    return adjustments.map((adj, idx) => {
                      const amount = adj.type === 'discount'
                        ? (adj.valueType === 'percentage' ? (subtotal * adj.value) / 100 : adj.value)
                        : (adj.valueType === 'percentage' ? (taxableAmount * adj.value) / 100 : adj.value);

                      return (
                        <div key={idx} className="flex justify-between items-center text-sm font-bold">
                          <span className="text-muted-foreground uppercase tracking-widest text-[10px]">
                            {adj.label}
                            {adj.valueType === 'percentage' && (
                              <span className="ml-2 py-0.5 px-2 bg-muted rounded-full text-[9px]">{adj.value}%</span>
                            )}
                          </span>
                          <span className={cn(adj.type === 'discount' ? "text-red-500" : "text-foreground")}>
                            {adj.type === 'discount' ? '-' : '+'}${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      );
                    });
                  }
                  return (
                    <div className="flex justify-between items-center text-sm font-bold text-muted-foreground">
                      <span className="uppercase tracking-widest text-[10px]">Tax (0.0%)</span>
                      <span>$0.00</span>
                    </div>
                  );
                })()}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border/10 mt-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/70">Total</span>
                <span className="text-4xl font-bold text-foreground tracking-tight">
                  ${proforma.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="border-t border-border/10 pt-10 relative z-10 text-center space-y-6">
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#ac8e68]">Thank You</h4>
            <p className="text-muted-foreground text-sm font-medium">Please contact us with any questions regarding this estimate.</p>
          </div>

          <div className="bg-muted/30 p-8 max-w-3xl mx-auto border border-border/30">
            <h5 className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">Terms & Service</h5>
            <p className="text-xs text-muted-foreground/80 leading-relaxed italic font-medium">
              {proforma.users.terms_conditions || "This quote represents an initial estimate and is subject to change following final on-site measurements."}
            </p>
          </div>

          {proforma.status === 'approved' && proforma.approved_at && (
            <div className="mt-12 pt-8 border-t border-border/50 relative z-20 print:break-inside-avoid">
              <div className="flex flex-col items-center sm:items-start">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                  Accepted & Signed By
                </h3>
                <div className="flex flex-col items-center sm:items-start gap-4">
                  {proforma.client_signature_data ? (
                    <div className="bg-card p-4 rounded-xl border border-border/40 shadow-sm transition-all hover:shadow-md max-w-[320px]">
                      <img
                        src={proforma.client_signature_data}
                        alt="Customer Signature"
                        className="h-24 w-auto object-contain mix-blend-multiply"
                      />
                    </div>
                  ) : proforma.client_signed_name ? (
                    <div className="px-6 py-4 bg-primary/5 rounded-xl border-b-2 border-primary/20">
                      <p className=" text-3xl italic text-foreground tracking-tight">
                        {proforma.client_signed_name}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic bg-muted/20 px-4 py-2 rounded-lg">
                      Approved (Digitally Verified)
                    </p>
                  )}

                  <div className="mt-2 text-center sm:text-left space-y-1">
                    <p className="text-sm font-bold text-foreground">
                      {(() => {
                        const c = clientData;
                        const nameDisplay = [c.title, c.first_name, c.last_name].filter(Boolean).join(' ') || c.name;
                        return c.company_name || nameDisplay;
                      })()}
                    </p>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest bg-muted/30 px-2 py-1 rounded inline-block">
                      Signed on: {new Date(proforma.approved_at).toLocaleDateString('en-US', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Communication */}
        {!proforma.is_template && (
          <div className="grid grid-cols-1 gap-8 mt-12 print:hidden">
            <Link
              href={`/proforma/${id}/messages`}
              className="flex items-center justify-between p-4 rounded-xl border border-primary/10 bg-card hover:border-primary/30 transition-all group shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">Project Discussion</p>
                  <p className="text-xs text-muted-foreground">Collaborate with the studio team in real time</p>
                </div>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-none animate-pulse">Live Link</Badge>
            </Link>
          </div>
        )}

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
