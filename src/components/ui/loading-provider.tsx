'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface LoadingContextType {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

const LoadingContext = React.createContext<LoadingContextType | undefined>(undefined);

export function useLoading() {
  const context = React.useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = React.useState(false);
  const pathname = usePathname();
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLoading = React.useCallback(() => {
    setIsLoading(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Safety auto-clear timeout (10 seconds) to prevent getting stuck
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 10000);
  }, []);

  const stopLoading = React.useCallback(() => {
    setIsLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Automatically stop loading when the pathname changes (navigation complete)
  React.useEffect(() => {
    stopLoading();
  }, [pathname, stopLoading]);

  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
      {children}
      {isLoading && <LoadingOverlay />}
    </LoadingContext.Provider>
  );
}

function LoadingOverlay() {
  return (
    <>
      {/* Top Loading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-primary/10 z-[9999] overflow-hidden">
        <div 
          className="h-full bg-primary rounded-r-full animate-[loading-bar_1.5s_infinite_linear]"
          style={{
            width: '40%',
          }}
        />
      </div>

      {/* Glassmorphic Backdrop with Spinner Card */}
      <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-background/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in-0">
        <div className="relative flex flex-col items-center justify-center p-8 rounded-2xl bg-card border border-border/50 shadow-2xl max-w-[280px] w-full text-center scale-95 animate-in zoom-in-95 duration-200">
          <div className="relative flex items-center justify-center w-14 h-14 mb-4">
            {/* Outer pulse ring */}
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping duration-1000" />
            {/* Main spinning icon */}
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <h3 className="font-archivo font-bold text-xl text-foreground tracking-tight">Quickqi</h3>
          <p className="text-xs font-manrope text-muted-foreground mt-1.5 font-medium tracking-wide">
            Loading...
          </p>
        </div>
      </div>

      {/* CSS Animation Keyframes for Top Loading Progress Bar */}
      <style jsx global>{`
        @keyframes loading-bar {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(250%);
          }
        }
      `}</style>
    </>
  );
}
