'use client';

import * as React from 'react';
import { Camera, Globe, Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface Photo {
  id: string;
  url: string;
  caption: string | null;
  overlay_text: string | null;
  taken_at: string;
}

export default function PublicWorkProgress({ proformaId }: { proformaId: string }) {
  const [photos, setPhotos] = React.useState<Photo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [lightbox, setLightbox] = React.useState<Photo | null>(null);
  const [lightboxIdx, setLightboxIdx] = React.useState(0);

  const load = React.useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('project_photos')
      .select('id, url, caption, overlay_text, taken_at')
      .eq('proforma_id', proformaId)
      .eq('is_public', true)
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

  if (!loading && photos.length === 0) return null;

  return (
    <div className="mt-12 relative z-20 print:hidden">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Work Progress</h3>
      </div>

      <Card className="border-border/40 overflow-hidden rounded-2xl shadow-sm bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <span className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-muted/20 cursor-pointer border border-border/10"
                  onClick={() => openLightbox(photo)}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || 'Progress photo'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  {/* Overlay text banner */}
                  {photo.overlay_text && (
                    <div className="absolute inset-x-0 top-0 bg-black/60 backdrop-blur-sm px-2 py-1 text-center">
                      <p className="text-white text-[10px] font-bold truncate">{photo.overlay_text}</p>
                    </div>
                  )}
                  {/* Hover indicator */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <Maximize2 className="h-4 w-4 text-white" />
                    </div>
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
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button onClick={() => setLightbox(null)} className="absolute top-6 right-6 h-12 w-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 z-10 transition-colors">
            <X className="h-6 w-6" />
          </button>
          
          {photos.length > 1 && (
            <>
              <button 
                onClick={e => { e.stopPropagation(); navLightbox(-1); }} 
                className="absolute left-6 h-12 w-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 z-10 transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button 
                onClick={e => { e.stopPropagation(); navLightbox(1); }} 
                className="absolute right-6 h-12 w-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 z-10 transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <div className="relative max-w-5xl max-h-[80vh] flex flex-col gap-4 px-4" onClick={e => e.stopPropagation()}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              {lightbox.overlay_text && (
                <div className="absolute inset-x-0 top-0 bg-black/70 backdrop-blur-sm px-6 py-3 text-center z-10">
                  <p className="text-white font-bold text-base">{lightbox.overlay_text}</p>
                </div>
              )}
              <img 
                src={lightbox.url} 
                alt={lightbox.caption || 'Photo'} 
                className="max-h-[70vh] w-auto mx-auto object-contain bg-black" 
              />
            </div>
            {lightbox.caption && (
              <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10 text-center max-w-2xl mx-auto">
                <p className="text-white/90 text-sm leading-relaxed">{lightbox.caption}</p>
              </div>
            )}
          </div>
          <p className="absolute bottom-8 text-white/40 text-xs font-medium tracking-widest">
            {lightboxIdx + 1} / {photos.length}
          </p>
        </div>
      )}
    </div>
  );
}
