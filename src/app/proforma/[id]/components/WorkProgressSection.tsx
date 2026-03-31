'use client';

import * as React from 'react';
import { Camera, ExternalLink, Globe, Lock, Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import PhotoUploadModal from '@/app/gallery/components/PhotoUploadModal';
import { cn } from '@/lib/utils';

interface Photo {
  id: string;
  url: string;
  caption: string | null;
  overlay_text: string | null;
  is_public: boolean;
  taken_at: string;
}

export default function WorkProgressSection({ proformaId, proformaName }: { proformaId: string; proformaName: string }) {
  const [photos, setPhotos] = React.useState<Photo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [lightbox, setLightbox] = React.useState<Photo | null>(null);
  const [lightboxIdx, setLightboxIdx] = React.useState(0);

  const load = React.useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('project_photos')
      .select('id, url, caption, overlay_text, is_public, taken_at')
      .eq('proforma_id', proformaId)
      .order('created_at', { ascending: false });
    setPhotos(data || []);
    setLoading(false);
  }, [proformaId]);

  React.useEffect(() => { load(); }, [load]);

  const openLightbox = (photo: Photo) => {
    setLightboxIdx(photos.findIndex(p => p.id === photo.id));
    setLightbox(photo);
  };

  const navLightbox = (dir: 1 | -1) => {
    const next = (lightboxIdx + dir + photos.length) % photos.length;
    setLightboxIdx(next);
    setLightbox(photos[next]);
  };

  return (
    <>
      <Card className="border-border/40 overflow-hidden rounded-xl shadow-none mt-6">
        <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/5 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-bold">Work Progress</CardTitle>
            {photos.length > 0 && (
              <span className="text-xs text-muted-foreground font-normal ml-1">({photos.length} photos)</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {photos.length > 0 && (
              <Link
                href={`/gallery?project=${proformaId}`}
                className="flex items-center gap-1 text-xs text-primary font-bold hover:underline"
              >
                View All <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
            <PhotoUploadModal
              proformaId={proformaId}
              proformName={proformaName}
              onUploaded={load}
            />
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center">
                <Camera className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">No photos yet</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">Document your progress with photos</p>
              </div>
              <PhotoUploadModal
                proformaId={proformaId}
                proformName={proformaName}
                onUploaded={load}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-muted/20 cursor-pointer"
                  onClick={() => openLightbox(photo)}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || 'Progress photo'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                  {/* Overlay text */}
                  {photo.overlay_text && (
                    <div className="absolute inset-x-0 top-0 bg-black/65 backdrop-blur-sm px-2 py-1">
                      <p className="text-white text-[10px] font-bold truncate">{photo.overlay_text}</p>
                    </div>
                  )}
                  {/* Visibility + expand on hover */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between px-2 py-2">
                    <span className={cn(
                      'flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                      photo.is_public ? 'bg-emerald-600/90 text-white' : 'bg-black/60 text-white/70'
                    )}>
                      {photo.is_public ? <Globe className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
                    </span>
                    <Maximize2 className="h-4 w-4 text-white" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 z-10">
            <X className="h-5 w-5" />
          </button>
          {photos.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); navLightbox(-1); }} className="absolute left-4 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 z-10">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={e => { e.stopPropagation(); navLightbox(1); }} className="absolute right-4 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 z-10">
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          <div className="relative max-w-4xl max-h-[85vh] flex flex-col gap-3" onClick={e => e.stopPropagation()}>
            <div className="relative">
              {lightbox.overlay_text && (
                <div className="absolute inset-x-0 top-0 bg-black/70 backdrop-blur-sm px-4 py-2 text-center z-10">
                  <p className="text-white font-bold text-sm">{lightbox.overlay_text}</p>
                </div>
              )}
              <img src={lightbox.url} alt={lightbox.caption || 'Photo'} className="max-h-[75vh] max-w-full object-contain rounded-xl" />
            </div>
            {lightbox.caption && <p className="text-white/90 text-sm text-center">{lightbox.caption}</p>}
          </div>
          <p className="absolute bottom-4 text-white/30 text-xs">{lightboxIdx + 1} / {photos.length}</p>
        </div>
      )}
    </>
  );
}
