'use client';

import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpandableTextProps {
  text: string;
  initialLines?: number; // Approximate lines to show
  className?: string;
}

export function ExpandableText({ text, initialLines = 4, className }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [shouldTruncate, setShouldTruncate] = React.useState(false);
  const textRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (textRef.current) {
      // If height is more than 5 lines (approx 24px per line), then allow truncation
      const lineHeight = 20; 
      const maxHeight = initialLines * lineHeight;
      if (textRef.current.scrollHeight > maxHeight + 10) {
        setShouldTruncate(true);
      }
    }
  }, [text, initialLines]);

  if (!text) return null;

  return (
    <div className={cn("group relative", className)}>
      <div 
        ref={textRef}
        className={cn(
          "whitespace-pre-wrap text-sm leading-relaxed transition-all duration-500 ease-in-out",
          !isExpanded && shouldTruncate ? "line-clamp-4 overflow-hidden" : ""
        )}
      >
        {text}
      </div>
      
      {shouldTruncate && (
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }}
          className="mt-2 text-[#ac8e68] hover:text-[#8a7253] font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-1.5 transition-colors print:hidden"
        >
          {isExpanded ? (
            <>View Less <ChevronUp className="w-3 h-3 stroke-[3px]" /></>
          ) : (
            <>View More <ChevronDown className="w-3 h-3 stroke-[3px]" /></>
          )}
        </button>
      )}

      {/* For print: always show full text */}
      <style jsx global>{`
        @media print {
          .line-clamp-4 {
            display: block !important;
            -webkit-line-clamp: initial !important;
            overflow: visible !important;
          }
        }
      `}</style>
    </div>
  );
}
