'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ZoomIn } from 'lucide-react';

interface LineItemImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function LineItemImage({ src, alt, className }: LineItemImageProps) {
  return (
    <Dialog>
      <DialogTrigger
        className={cn(
          "relative group cursor-zoom-in overflow-hidden rounded-lg border border-border/50 bg-muted/30 transition-all hover:border-primary/40 hover:shadow-sm",
          className
        )}
      >
        <img 
          src={src} 
          alt={alt} 
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
          <ZoomIn className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100 drop-shadow-md" />
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none sm:rounded-none">
        <div className="relative h-full w-full overflow-hidden rounded-lg">
          <img 
            src={src} 
            alt={alt} 
            className="max-h-[85vh] w-full object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
