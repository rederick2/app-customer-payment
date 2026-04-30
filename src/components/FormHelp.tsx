'use client';

import { HelpCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface FormHelpProps {
  title: string;
  text: string;
}

export function FormHelp({ title, text }: FormHelpProps) {
  return (
    <Popover>
      <PopoverTrigger className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors ml-1 align-text-bottom focus:outline-none">
        <HelpCircle className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 text-sm z-[9999]" side="top">
        <div className="font-bold mb-1.5 font-archivo">{title}</div>
        <div className="text-muted-foreground leading-relaxed text-xs">{text}</div>
      </PopoverContent>
    </Popover>
  );
}
