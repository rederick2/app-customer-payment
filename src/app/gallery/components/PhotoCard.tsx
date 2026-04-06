'use client';

import { Globe, Lock, Pencil, Trash2, Maximize2, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { deleteProjectPhoto, updateProjectPhoto } from '../actions';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import React from 'react';

export interface Photo {
  id: string;
  url: string;
  caption: string | null;
  overlay_text: string | null;
  is_public: boolean;
  taken_at: string;
  proformas?: { project_name: string; number: number } | null;
}

interface PhotoCardProps {
  photo: Photo;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Photo>) => void;
  onExpand?: (photo: Photo) => void;
  compact?: boolean;
}

export default function PhotoCard({ photo, onDelete, onUpdate, onExpand, compact }: PhotoCardProps) {
  const [editing, setEditing] = React.useState(false);
  const [caption, setCaption] = React.useState(photo.caption || '');
  const [overlay, setOverlay] = React.useState(photo.overlay_text || '');
  const [isPublic, setIsPublic] = React.useState(photo.is_public);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const saveEdits = async () => {
    setSaving(true);
    const updates = { caption, overlay_text: overlay, is_public: isPublic };
    const res = await updateProjectPhoto(photo.id, updates);
    setSaving(false);
    if (res.error) { toast.error(res.error); return; }
    onUpdate?.(photo.id, updates);
    setEditing(false);
    toast.success('Photo updated');
  };

  const handleDelete = async () => {
    if (!confirm('Delete this photo?')) return;
    setDeleting(true);
    const res = await deleteProjectPhoto(photo.id);
    setDeleting(false);
    if (res.error) { toast.error(res.error); return; }
    onDelete?.(photo.id);
    toast.success('Photo deleted');
  };

  return (
    <div className={cn('group relative bg-muted/10 border border-border/40 rounded-xl overflow-hidden transition-shadow hover:shadow-lg', compact && 'rounded-md')}>
      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-black">
        <img
          src={photo.url}
          alt={photo.caption || 'Project photo'}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Overlay text banner */}
        {photo.overlay_text && (
          <div className="absolute inset-x-0 top-0 bg-black/70 backdrop-blur-sm px-3 py-1.5 text-center">
            <p className="text-white font-bold text-xs truncate">{photo.overlay_text}</p>
          </div>
        )}

        {/* Visibility badge */}
        <div className={cn(
          'absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
          photo.is_public ? 'bg-emerald-600/90 text-white' : 'bg-black/60 text-white/70'
        )}>
          {photo.is_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
          {photo.is_public ? 'Public' : 'Private'}
        </div>

        {/* Action buttons (always visible on mobile) */}
        {!compact && (
          <div className="absolute inset-0 sm:bg-black/40 sm:opacity-0 sm:group-hover:opacity-100 transition-all flex items-start justify-end p-2 gap-1.5 z-10">
            {onExpand && (
              <button
                onClick={() => onExpand(photo)}
                className="h-8 w-8 flex items-center justify-center rounded-lg bg-black/50 backdrop-blur-md text-white hover:bg-black/80 transition-colors shadow-lg"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            )}
            <Dialog open={editing} onOpenChange={setEditing}>
              <DialogTrigger render={
                <button
                  className="h-8 w-8 flex items-center justify-center rounded-lg bg-black/50 backdrop-blur-md text-white hover:bg-primary/80 transition-colors shadow-lg"
                  title="Edit details"
                />
              }>
                <Pencil className="h-4 w-4" />
              </DialogTrigger>

              <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-xl">
                <DialogHeader className="p-5 pb-0">
                  <DialogTitle>Edit Photo Details</DialogTitle>
                </DialogHeader>

                <div className="p-5 space-y-4">
                  {/* Photo mini preview */}
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <img src={photo.url} alt="Preview" className="w-full h-full object-cover" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Overlay Text</label>
                    <input
                      value={overlay}
                      onChange={e => setOverlay(e.target.value)}
                      placeholder="e.g. Before demo started"
                      className="w-full border border-border/40 rounded-xl px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Caption</label>
                    <textarea
                      value={caption}
                      onChange={e => setCaption(e.target.value)}
                      placeholder="Add a description..."
                      rows={3}
                      className="w-full border border-border/40 rounded-xl px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                  </div>

                  {/* Visibility toggle */}
                  <button
                    onClick={() => setIsPublic(v => !v)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all',
                      isPublic
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border/40 bg-muted/10 text-muted-foreground'
                    )}
                  >
                    <div className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                      isPublic ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}>
                      {isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-bold text-sm leading-none">{isPublic ? 'Visible to Client' : 'Private'}</p>
                      <p className="text-[10px] opacity-70 mt-1">
                        {isPublic ? 'Client can see this in their portal' : 'Only you can see this'}
                      </p>
                    </div>
                    <div className={cn(
                      'h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all',
                      isPublic ? 'border-primary bg-primary' : 'border-muted-foreground'
                    )}>
                      {isPublic && <Check className="h-3 w-3 text-white" />}
                    </div>
                  </button>
                </div>

                <DialogFooter className="p-5 pt-0 gap-3">
                  <Button variant="outline" onClick={() => setEditing(false)} className="flex-1 rounded-xl">
                    Cancel
                  </Button>
                  <Button onClick={saveEdits} disabled={saving} className="flex-1 rounded-xl font-bold">
                    {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : 'Save Changes'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-black/50 backdrop-blur-md text-white hover:bg-red-500/80 transition-colors shadow-lg"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Caption */}
      {!compact && (
        <div className="px-3 py-2.5">
          {photo.proformas && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-0.5">
              #{photo.proformas.number} – {photo.proformas.project_name}
            </p>
          )}
          {photo.caption ? (
            <p className="text-sm text-foreground/80 leading-snug">{photo.caption}</p>
          ) : (
            <p className="text-xs text-muted-foreground/50 italic">No caption</p>
          )}
          <p className="text-[10px] text-muted-foreground/50 mt-1">
            {new Date(photo.taken_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      )}

    </div>
  );
}
