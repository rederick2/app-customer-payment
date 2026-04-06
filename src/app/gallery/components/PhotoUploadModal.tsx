'use client';

import * as React from 'react';
import { Camera, Upload, X, Eye, Globe, Lock, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Combobox } from '@/components/ui/combobox';
import { cn } from '@/lib/utils';
import { uploadProjectPhoto } from '../actions';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { compressImage } from '@/lib/image-compression';

const AnnotationEditor = dynamic(() => import('./AnnotationEditor'), { ssr: false });

interface Props {
  proformaId?: string;
  proformName?: string;
  proformas?: { id: string; project_name: string; number: number }[];
  trigger?: React.ReactNode;
  onUploaded?: () => void;
}

type Stage = 'select' | 'annotate' | 'details';

export default function PhotoUploadModal({ proformaId, proformName, proformas = [], trigger, onUploaded }: Props) {
  const [open, setOpen] = React.useState(false);
  const [stage, setStage] = React.useState<Stage>('select');
  const [rawFile, setRawFile] = React.useState<File | null>(null);
  const [rawUrl, setRawUrl] = React.useState<string>('');
  const [annotatedBlob, setAnnotatedBlob] = React.useState<Blob | null>(null);
  const [caption, setCaption] = React.useState('');
  const [overlayText, setOverlayText] = React.useState('');
  const [isPublic, setIsPublic] = React.useState(false);
  const [selectedProforma, setSelectedProforma] = React.useState(proformaId || '');
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const cameraRef = React.useRef<HTMLInputElement>(null);

  const reset = () => {
    setStage('select');
    setRawFile(null);
    setRawUrl('');
    setAnnotatedBlob(null);
    setCaption('');
    setOverlayText('');
    setIsPublic(false);
    setSelectedProforma(proformaId || '');
    setUploading(false);
  };

  const handleFile = (file: File) => {
    setRawFile(file);
    setRawUrl(URL.createObjectURL(file));
    setStage('annotate');
  };

  const handleExport = (blob: Blob) => {
    setAnnotatedBlob(blob);
    setStage('details');
  };

  const skipAnnotation = () => {
    if (!rawFile) return;
    setAnnotatedBlob(rawFile);
    setStage('details');
  };

  const handleUpload = async () => {
      let fileToUpload = annotatedBlob || rawFile;
      if (!fileToUpload) return;

      setUploading(true);
      try {
        // Compress if needed (limit to 5MB)
        if (fileToUpload.size > 5 * 1024 * 1024) {
          toast.info('Compressing photo...', { duration: 2000 });
          fileToUpload = await compressImage(fileToUpload, 4.5); // Aim for slightly less than 5MB
        }

        const fd = new FormData();
        fd.append('file', fileToUpload, rawFile?.name || 'photo.jpg');
      fd.append('caption', caption);
      fd.append('overlay_text', overlayText);
      fd.append('is_public', String(isPublic));
      if (selectedProforma) fd.append('proforma_id', selectedProforma);

      const res = await uploadProjectPhoto(fd);
      if (res.error) throw new Error(res.error);

      toast.success('Photo uploaded!');
      setOpen(false);
      reset();
      onUploaded?.();
    } catch (e: any) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const previewUrl = annotatedBlob
    ? URL.createObjectURL(annotatedBlob)
    : rawUrl;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger
        render={
          trigger && React.isValidElement(trigger) ? (
            trigger
          ) : (
            <Button size="sm" className="h-8 gap-1.5 font-bold text-primary-foreground">
              <Camera className="h-4 w-4" /> Add Photo
            </Button>
          )
        }
      />

      <DialogContent className={cn(
        'p-0 flex flex-col rounded-xl border-border/40 shadow-2xl overflow-y-auto max-h-[95vh]',
        stage === 'annotate' ? 'sm:max-w-2xl' : 'sm:max-w-[480px]'
      )}>
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/40">
          <DialogTitle className="font-bold text-lg flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            {stage === 'select' && 'Add Photo'}
            {stage === 'annotate' && 'Annotate Photo'}
            {stage === 'details' && 'Photo Details'}
          </DialogTitle>
        </DialogHeader>

        {/* STAGE 1: SELECT */}
        {stage === 'select' && (
          <div className="p-6 space-y-4">
            {/* Camera */}
            <button
              onClick={() => cameraRef.current?.click()}
              className="w-full flex flex-col items-center gap-3 py-8 border-2 border-dashed border-border/60 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="h-7 w-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground">Take Photo</p>
                <p className="text-xs text-muted-foreground mt-0.5">Use device camera</p>
              </div>
            </button>
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {/* File upload */}
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center gap-4 px-5 py-4 border border-border/40 rounded-xl hover:bg-muted/30 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm text-foreground">Upload from Library</p>
                <p className="text-xs text-muted-foreground">JPG, PNG, HEIC</p>
              </div>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        )}

        {/* STAGE 2: ANNOTATE */}
        {stage === 'annotate' && rawUrl && (
          <div className="flex flex-col">
            <AnnotationEditor
              imageUrl={rawUrl}
              onExport={handleExport}
              className="max-h-[60vh]"
            />
            <div className="flex justify-between items-center px-5 py-3 border-t border-border/40 bg-muted/5">
              <button onClick={() => setStage('select')} className="text-sm text-muted-foreground hover:text-foreground font-medium">
                ← Back
              </button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-xl" onClick={skipAnnotation}>
                  Skip
                </Button>
                <Button
                  size="sm"
                  className="rounded-xl font-bold"
                  onClick={() => document.getElementById('annotation-export-btn')?.click()}
                >
                  Save Annotation →
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 3: DETAILS */}
        {stage === 'details' && (
          <div className="p-5 space-y-4">
            {/* Preview */}
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              {overlayText && (
                <div className="absolute inset-x-0 top-0 bg-black/60 backdrop-blur-sm px-4 py-2 text-center">
                  <p className="text-white font-bold text-sm">{overlayText}</p>
                </div>
              )}
              <button
                onClick={() => setStage('annotate')}
                className="absolute top-2 right-2 h-8 w-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>

            {/* Project selector */}
            {proformas.length > 0 && !proformaId && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Project</label>
                <Combobox
                  options={[
                    { value: '', label: 'No project' },
                    ...proformas.map(p => ({ value: p.id, label: `#${p.number} – ${p.project_name}` }))
                  ]}
                  value={selectedProforma}
                  onValueChange={setSelectedProforma}
                  placeholder="Select a project..."
                  searchPlaceholder="Search projects..."
                  modal={true}
                />
              </div>
            )}

            {/* Overlay text */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Overlay Text</label>
              <input
                value={overlayText}
                onChange={e => setOverlayText(e.target.value)}
                placeholder="e.g. Before demo started"
                className="w-full border border-border/40 rounded-xl px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
              />
              <p className="text-[10px] text-muted-foreground">Shown as banner on top of the photo</p>
            </div>

            {/* Caption */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Caption</label>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Add a description..."
                rows={2}
                className="w-full border border-border/40 rounded-xl px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50 resize-none"
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
                'h-9 w-9 rounded-full flex items-center justify-center shrink-0',
                isPublic ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}>
                {isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-sm">{isPublic ? 'Visible to Client' : 'Private (Internal Only)'}</p>
                <p className="text-xs opacity-70">{isPublic ? 'Client can see this in their portal' : 'Only you can see this'}</p>
              </div>
              <div className={cn(
                'h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all',
                isPublic ? 'border-primary bg-primary' : 'border-muted-foreground'
              )}>
                {isPublic && <Check className="h-3 w-3 text-white" />}
              </div>
            </button>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setStage('annotate')} className="flex-1 rounded-xl">
                ← Edit
              </Button>
              <Button onClick={handleUpload} disabled={uploading} className="flex-1 rounded-xl font-bold">
                {uploading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : 'Save Photo'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
