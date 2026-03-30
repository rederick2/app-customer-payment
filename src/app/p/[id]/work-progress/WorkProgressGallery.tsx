'use client';

import * as React from 'react';
import { Camera, Eye, FileDown, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MediaItem {
  id: string;
  url: string;
  type: string;
  caption?: string;
  created_at: string;
}

interface MediaGroup {
  taskTitle: string;
  items: MediaItem[];
}

interface WorkProgressGalleryProps {
  mediaByTask: Record<string, MediaGroup>;
}

export default function WorkProgressGallery({ mediaByTask }: WorkProgressGalleryProps) {
  const [selectedMedia, setSelectedMedia] = React.useState<MediaItem | null>(null);

  const groups = Object.values(mediaByTask);

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center opacity-60">
        <Camera className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-serif font-bold text-foreground mb-1">No progress photos yet</h2>
        <p className="text-sm text-muted-foreground">Photos and videos will appear here as tasks are completed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {groups.map((group) => (
        <div key={group.taskTitle} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              {group.taskTitle}
            </h3>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {group.items.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedMedia(m)}
                className="group relative aspect-square rounded-2xl overflow-hidden border border-[#E2E0D8] bg-[#F4F2EC] cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {m.type === 'video' ? (
                  <>
                    <video
                      src={m.url}
                      className="w-full h-full object-cover"
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </>
                ) : (
                  <img
                    src={m.url}
                    alt={m.caption || group.taskTitle}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <div className="flex items-center justify-between text-white">
                    <span className="text-[10px] font-bold uppercase tracking-wider truncate mr-2">
                      {m.caption || 'View Details'}
                    </span>
                    <ZoomInIcon className="h-4 w-4" />
                  </div>
                </div>

                {m.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm px-3 py-2 md:hidden">
                    <p className="text-white text-[10px] truncate font-medium">{m.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Media Lightbox Modal */}
      <Dialog open={!!selectedMedia} onOpenChange={(open) => !open && setSelectedMedia(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-none sm:rounded-3xl">
          {/* Header */}
          <div className="p-4 bg-black/40 backdrop-blur-xl absolute top-0 left-0 right-0 z-50 flex flex-row items-center justify-between border-b border-white/10">
            <DialogTitle className="text-white text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="p-1.5 bg-white/10 rounded-lg">
                <Eye className="h-4 w-4 text-emerald-400" />
              </div>
              {selectedMedia?.type === 'video' ? 'Video' : 'Photo'} Preview
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 h-9 px-4 gap-2 font-bold text-xs rounded-full border border-white/20 transition-all"
                onClick={() => {
                  if (selectedMedia) window.open(selectedMedia.url, '_blank');
                }}
              >
                <FileDown className="h-4 w-4" />
                Download
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 h-9 w-9 rounded-full border border-white/20 transition-all"
                onClick={() => setSelectedMedia(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Media Content */}
          <div className="flex items-center justify-center min-h-[50vh] max-h-[90vh] p-4 pt-20 animate-in zoom-in-95 duration-300">
            {selectedMedia ? (
              <div className="relative group/content w-full h-full flex items-center justify-center">
                {selectedMedia.type === 'video' ? (
                  <video
                    src={selectedMedia.url}
                    controls
                    autoPlay
                    className="max-w-full max-h-[75vh] rounded-xl shadow-2xl ring-1 ring-white/10"
                  />
                ) : (
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.caption || 'Progress photo'}
                    className="max-w-full max-h-[75vh] object-contain shadow-2xl rounded-xl ring-1 ring-white/10"
                  />
                )}
                
                {selectedMedia.caption && (
                  <div className="absolute -bottom-10 left-0 right-0 text-center">
                    <p className="text-white/80 text-sm italic font-medium">
                      "{selectedMedia.caption}"
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-white/40 flex flex-col items-center gap-2 py-20">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                <p className="text-[10px] uppercase font-black tracking-widest">Loading Media...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ZoomInIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}
