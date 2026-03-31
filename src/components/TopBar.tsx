'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, Bell, Settings, HelpCircle, X,
  User, MapPin, FileText, CreditCard, Building2, ChevronRight,
  LogOut, Phone, Mail, Moon, Sun,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardNotifications } from './dashboard/DashboardNotifications';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTheme } from "next-themes";
import { logout } from '@/app/login/actions';

interface SearchResult {
  id: string;
  first_name: string | null;
  last_name: string | null;
  name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  street_1: string | null;
  city: string | null;
  province: string | null;
  proformas: Array<{
    id: string;
    project_name: string;
    status: string;
    number: number;
    total: number;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    type: string;
    payment_date: string;
  }>;
}

interface TopBarProps {
  userProfile?: {
    displayName: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  unreadCount?: number;
}

export function TopBar({ userProfile, unreadCount = 0 }: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 2) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        setResults(data.clients || []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
  };

  const clear = () => { setQuery(''); setResults([]); setOpen(false); inputRef.current?.focus(); };

  const clientName = (c: SearchResult) =>
    [c.first_name, c.last_name].filter(Boolean).join(' ') || c.name || c.company_name || 'Unknown';

  const address = (c: SearchResult) =>
    [c.street_1, c.city, c.province].filter(Boolean).join(', ');

  const statusColor: Record<string, string> = {
    quote: 'text-blue-600',
    job: 'text-emerald-600',
    approved: 'text-amber-600',
    completed: 'text-gray-500',
  };

  return (
    <header className="hidden md:flex h-14 items-center bg-background/95 backdrop-blur-sm border-b border-border/40 px-6 gap-4 print:hidden">

      {/* Search */}
      <div ref={containerRef} className="relative flex-1 max-w-xl">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Search clients, quotes, jobs..."
            className="w-full pl-9 pr-8 h-9 text-sm bg-muted/30 border border-border/40 rounded-xl outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground/60"
          />
          {query && (
            <button
              onClick={clear}
              className="absolute right-2.5 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {open && (
          <div className="absolute top-full mt-2 left-0 w-full bg-popover border border-border/40 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in-0 slide-in-from-top-2 duration-150">
            {loading ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground gap-2">
                <span className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Searching...
              </div>
            ) : results.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">No results found for &ldquo;{query}&rdquo;</div>
            ) : (
              <div>
                {results.map((client, idx) => (
                  <div key={client.id} className={cn('border-border/40', idx < results.length - 1 && 'border-b')}>
                    {/* Client row */}
                    <Link
                      href={`/clients/${client.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors group"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {client.company_name
                          ? <Building2 className="h-4 w-4 text-primary" />
                          : <User className="h-4 w-4 text-primary" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{clientName(client)}</p>
                        {client.company_name && client.first_name && (
                          <p className="text-xs text-muted-foreground truncate">{client.company_name}</p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </Link>

                    {/* Related items */}
                    <div className="pb-2">
                      {/* Address */}
                      {address(client) && (
                        <Link
                          href={`/clients/${client.id}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-3 px-4 py-1.5 hover:bg-muted/30 transition-colors"
                        >
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground truncate">{address(client)}</p>
                            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">{clientName(client)}</p>
                          </div>
                        </Link>
                      )}

                      {/* Quotes / Jobs */}
                      {client.proformas.map((p) => (
                        <Link
                          key={p.id}
                          href={`/proforma/${p.id}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-3 px-4 py-1.5 hover:bg-muted/30 transition-colors"
                        >
                          <FileText className={cn('h-3.5 w-3.5 shrink-0 ml-0.5', statusColor[p.status] || 'text-muted-foreground')} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground/80 truncate">{p.status === 'job' ? `Job #${p.number || '-'}` : `Quote #${p.number || '-'}`} — {p.project_name}</p>
                            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">{clientName(client)}</p>
                          </div>
                          <span className="text-xs font-bold text-foreground/70 shrink-0">${p.total?.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                        </Link>
                      ))}

                      {/* Payments / Deposits */}
                      {client.payments.map((pay) => (
                        <Link
                          key={pay.id}
                          href={`/clients/${client.id}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-3 px-4 py-1.5 hover:bg-muted/30 transition-colors"
                        >
                          <CreditCard className="h-3.5 w-3.5 text-emerald-600 shrink-0 ml-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground/80">{pay.type === 'deposit' ? 'Deposit' : 'Payment'} — ${pay.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">{clientName(client)}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Footer */}
                <div className="border-t border-border/40 px-4 py-2 bg-muted/10">
                  <button
                    onClick={() => { router.push(`/clients?q=${encodeURIComponent(query)}`); setOpen(false); }}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    See all results for &ldquo;{query}&rdquo; →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right icons */}
      <div className="flex items-center gap-1 ml-auto shrink-0">
        <DashboardNotifications />
        {/* Notifications 
        <Link
          href="/messages"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          title="Notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>*/}

        {/* Help */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          title="Help"
        >
          <HelpCircle className="h-4.5 w-4.5" />
        </button>

        {/* Settings */}
        <Link
          href="/settings"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          title="Settings"
        >
          <Settings className="h-4.5 w-4.5" />
        </Link>

        {/* Avatar & Profile Dropdown */}
        {userProfile && (
          <Popover>
            <PopoverTrigger render={
              <button className="ml-2 h-8.5 w-8.5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold select-none shrink-0 transition-transform hover:scale-105 active:scale-95">
                {userProfile.displayName?.charAt(0).toUpperCase()}
              </button>
            }>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 overflow-hidden rounded-2xl shadow-2xl border-border/40" align="end">
              {/* Header Profile Section */}
              <div className="bg-muted/30 p-6 flex flex-col items-center text-center gap-2 border-b border-border/40">
                <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold mb-1 shadow-inner">
                  {userProfile.displayName?.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-foreground leading-none">{userProfile.displayName}</p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{userProfile.email || 'No email'}</p>
                  </div>
                  {userProfile.phone && (
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">{userProfile.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Menu Options */}
              <div className="p-2 space-y-1">
                <Link
                  href="/messages"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-xl transition-all group"
                >
                  <MessageSquare className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  Messages
                  {unreadCount > 0 && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-muted/50 rounded-xl transition-all group"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      Switch to Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      Switch to Dark Mode
                    </>
                  )}
                </button>
              </div>

              {/* Logout Footer */}
              <div className="p-2 pt-0">
                <form action={logout}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-all group"
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </button>
                </form>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </header>
  );
}
