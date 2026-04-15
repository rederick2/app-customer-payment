'use client';

import * as React from 'react';
import { Camera, Search, Globe, Lock, ChevronLeft, ChevronRight, X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import PhotoCard, { Photo } from './components/PhotoCard';
import PhotoUploadModal from './components/PhotoUploadModal';
import { Combobox } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';

interface ClientInfo {
  name?: string;
  company_name?: string;
  first_name?: string;
  last_name?: string;
}

interface Proforma { 
  id: string; 
  project_name: string; 
  number: number;
  client_id?: string;
  clients?: ClientInfo | ClientInfo[];
}

interface GalleryClientProps {
  initialPhotos: Photo[];
  proformas: Proforma[];
}

export default function GalleryClient({ initialPhotos, proformas }: GalleryClientProps) {
  const [photos, setPhotos] = React.useState<Photo[]>(initialPhotos);
  const [search, setSearch] = React.useState('');
  const [filterProject, setFilterProject] = React.useState('');
  const [filterClient, setFilterClient] = React.useState('');
  const [filterVisibility, setFilterVisibility] = React.useState<'all' | 'public' | 'private'>('all');
  const [lightbox, setLightbox] = React.useState<Photo | null>(null);
  const [lightboxIdx, setLightboxIdx] = React.useState(0);

  const uniqueClients = React.useMemo(() => {
    const map = new Map<string, { value: string; label: string }>();
    proformas.forEach(p => {
      if (p.client_id && p.clients) {
        if (!map.has(p.client_id)) {
          const clientData = Array.isArray(p.clients) ? p.clients[0] : p.clients;
          const label = clientData.company_name || 
            [clientData.first_name, clientData.last_name].filter(Boolean).join(' ') || 
            clientData.name || 'Unknown Client';
          map.set(p.client_id, { value: p.client_id, label });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [proformas]);

  const filtered = React.useMemo(() => {
    return photos.filter(p => {
      const matchSearch = !search || [p.caption, p.overlay_text, p.proformas?.project_name]
        .some(s => s?.toLowerCase().includes(search.toLowerCase()));
      const matchProject = !filterProject || p.proformas?.id === filterProject;
      const matchClient = !filterClient || p.proformas?.client_id === filterClient;
      const matchVis = filterVisibility === 'all' || (filterVisibility === 'public' ? p.is_public : !p.is_public);
      return matchSearch && matchProject && matchClient && matchVis;
    });
  }, [photos, search, filterProject, filterClient, filterVisibility]);

  const openLightbox = (photo: Photo) => {
    const idx = filtered.findIndex(p => p.id === photo.id);
    setLightboxIdx(idx >= 0 ? idx : 0);
    setLightbox(photo);
  };

  const navLightbox = (dir: 1 | -1) => {
    const next = (lightboxIdx + dir + filtered.length) % filtered.length;
    setLightboxIdx(next);
    setLightbox(filtered[next]);
  };

  const handleDelete = (id: string) => setPhotos(prev => prev.filter(p => p.id !== id));
  const handleUpdate = (id: string, updates: Partial<Photo>) =>
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Gallery</h1>
          <p className="text-muted-foreground text-sm mt-1">{photos.length} photos across {proformas.length} projects</p>
        </div>
        <PhotoUploadModal
          proformas={proformas}
          onUploaded={() => window.location.reload()}
          trigger={
            <Button size="lg" className="w-full md:w-auto h-11 md:h-10 bg-[#A28441] hover:bg-[#8B7137] text-white font-bold gap-2 rounded-xl shadow-lg shadow-[#A28441]/20 transition-all active:scale-[0.98]">
              <Camera className="h-5 w-5 md:h-4 md:w-4" />
              Add Photo
            </Button>
          }
        />
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-8">
        <div className="relative w-full sm:flex-1 sm:min-w-[240px] sm:max-w-sm group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by project, caption..."
            className="w-full pl-11 pr-4 h-11 sm:h-10 text-sm border border-border/60 rounded-xl bg-background outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary/50 shadow-sm"
          />
        </div>

        <div className="w-full sm:w-[220px]">
          <Combobox
            options={[
              { value: '', label: 'All Clients' },
              ...uniqueClients
            ]}
            value={filterClient}
            onValueChange={setFilterClient}
            placeholder="Filter by client..."
            searchPlaceholder="Search clients..."
            className="w-full h-11 sm:h-10 rounded-xl"
            modal={true}
          />
        </div>

        <div className="w-full sm:w-[240px]">
          <Combobox
            options={[
              { value: '', label: 'All Projects' },
              ...proformas.map(p => ({ value: p.id, label: `#${p.number} – ${p.project_name}` }))
            ]}
            value={filterProject}
            onValueChange={setFilterProject}
            placeholder="Filter by project..."
            searchPlaceholder="Search projects..."
            className="w-full h-11 sm:h-10 rounded-xl"
            modal={true}
          />
        </div>

        <div className="flex w-full sm:w-auto bg-muted/30 p-1 rounded-xl border border-border/40 shadow-sm shrink-0">
          {(['all', 'public', 'private'] as const).map(v => (
            <button
              key={v}
              onClick={() => setFilterVisibility(v)}
              className={cn(
                'flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 h-9 sm:h-8 text-xs font-bold transition-all rounded-lg',
                filterVisibility === v
                  ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                  : 'text-muted-foreground hover:bg-white/50 hover:text-foreground'
              )}
            >
              {v === 'public' && <Globe className="h-3.5 w-3.5" />}
              {v === 'private' && <Lock className="h-3.5 w-3.5" />}
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center">
            <Camera className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground font-medium">No photos yet</p>
          <PhotoUploadModal proformas={proformas} onUploaded={() => window.location.reload()} />
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {filtered.map(photo => (
            <div key={photo.id} className="break-inside-avoid">
              <PhotoCard
                photo={photo}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                onExpand={openLightbox}
              />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {filtered.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); navLightbox(-1); }}
                className="absolute left-4 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); navLightbox(1); }}
                className="absolute right-4 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          <div
            className="relative max-w-4xl max-h-[85vh] flex flex-col gap-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative">
              {lightbox.overlay_text && (
                <div className="absolute inset-x-0 top-0 bg-black/70 backdrop-blur-sm px-4 py-2 text-center z-10">
                  <p className="text-white font-bold text-sm">{lightbox.overlay_text}</p>
                </div>
              )}
              <img
                src={lightbox.url}
                alt={lightbox.caption || 'Photo'}
                className="max-h-[75vh] max-w-full object-contain rounded-xl"
              />
            </div>
            {lightbox.caption && (
              <div className="text-center">
                <p className="text-white/90 text-sm">{lightbox.caption}</p>
                {lightbox.proformas && (
                  <p className="text-white/50 text-xs mt-0.5">#{lightbox.proformas.number} – {lightbox.proformas.project_name}</p>
                )}
              </div>
            )}
          </div>

          <p className="absolute bottom-4 text-white/30 text-xs">
            {lightboxIdx + 1} / {filtered.length}
          </p>
        </div>
      )}
    </div>
  );
}
