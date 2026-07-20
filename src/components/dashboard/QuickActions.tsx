'use client';

import * as React from 'react';
import { Users, FileText, Briefcase, TrendingUp, ArrowUpRight, Loader2, Camera } from 'lucide-react';
import { LoadingLink } from '@/components/ui/loading-link';
import { useRouter, usePathname } from 'next/navigation';
import ReceiptScanner from '@/components/ReceiptScanner';

interface LinkAction {
  href: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
}

interface ClickAction {
  onClick: () => void;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
}

type QuickActionItem = LinkAction | ClickAction;

export function QuickActions() {
  const [clickedHref, setClickedHref] = React.useState<string | null>(null);
  const [isScanning, setIsScanning] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Reset loading state when page navigates
  React.useEffect(() => {
    setClickedHref(null);
  }, [pathname]);

  const actions: QuickActionItem[] = [
    { href: '/clients/new', label: 'New Client', icon: Users, color: 'text-blue-500' },
    { href: '/proforma/new', label: 'New Quote', icon: FileText, color: 'text-blue-500' },
    { href: '/clients', label: 'Manage Clients', icon: Users, color: 'text-orange-500' },
    { href: '/jobs', label: 'View Jobs', icon: Briefcase, color: 'text-violet-500' },
    { href: '/quotes', label: 'All Quotes', icon: TrendingUp, color: 'text-emerald-500' },
    { onClick: () => setIsScanning(true), label: 'Scan Receipt', icon: Camera, color: 'text-sky-500' },
  ];

  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground mb-3 font-archivo">Quick Actions</h2>
      <div className="rounded-2xl border border-border/40 bg-background/60 backdrop-blur overflow-hidden font-manrope">
        {actions.map((action) => {
          const { label, icon: Icon, color } = action;

          const content = (
            <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer group border-b border-border/20 last:border-0 relative">
              <Icon className={`h-4 w-4 ${color} shrink-0 transition-transform group-hover:scale-110`} />
              <span className="text-sm font-medium flex-1 transition-colors">
                {label}
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          );

          if ('href' in action) {
            const linkAction = action as LinkAction;
            const isLoading = clickedHref === linkAction.href;
            return (
              <LoadingLink
                key={linkAction.href}
                href={linkAction.href}
                onClick={() => {
                  if (linkAction.href !== pathname) {
                    setClickedHref(linkAction.href);
                  }
                }}
              >
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer group border-b border-border/20 last:border-0 relative">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                  ) : (
                    <Icon className={`h-4 w-4 ${color} shrink-0 transition-transform group-hover:scale-110`} />
                  )}
                  <span className={`text-sm font-medium flex-1 transition-colors ${isLoading ? 'text-primary' : ''}`}>
                    {label}
                  </span>
                  {isLoading ? (
                    <span className="text-[10px] font-medium text-primary animate-pulse">Loading...</span>
                  ) : (
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  )}
                </div>
              </LoadingLink>
            );
          } else {
            const clickAction = action as ClickAction;
            return (
              <div
                key={label}
                onClick={clickAction.onClick}
                className="w-full text-left focus:outline-none"
              >
                {content}
              </div>
            );
          }
        })}
      </div>

      {isScanning && (
        <ReceiptScanner
          onClose={() => setIsScanning(false)}
          onSuccess={(proformaId) => {
            setIsScanning(false);
            if (proformaId) {
              router.push(`/proforma/${proformaId}`);
            }
          }}
        />
      )}
    </div>
  );
}
