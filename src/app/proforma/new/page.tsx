'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProformaForm from '../components/ProformaForm';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Copy, LayoutTemplate, ArrowRight, Loader2, ArrowLeft, Search, HelpCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

function TemplateSelectorModal({
  isOpen,
  onClose,
  onSelect,
  mode,
  onCreateBlankTemplate
}: {
  isOpen: boolean,
  onClose: () => void,
  onSelect: (data: any) => void,
  mode: 'template' | 'quote',
  onCreateBlankTemplate: () => void
}) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const supabase = createClient();

  useEffect(() => {
    if (!isOpen) return;

    async function fetchItems() {
      setLoading(true);

      let query = supabase.from('proformas')
        .select(`id, project_name, created_at, number, clients(name)`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (mode === 'template') {
        query = query.eq('is_template', true);
      } else {
        query = query.eq('is_template', false);
      }

      if (search) {
        query = query.or(`project_name.ilike.%${search}%,number.ilike.%${search}%`);
      }

      const { data } = await query;
      setItems(data || []);
      setLoading(false);
    }

    const timer = setTimeout(() => {
      fetchItems();
    }, 300); // debounce

    return () => clearTimeout(timer);
  }, [isOpen, search, mode, supabase]);

  const handleSelect = async (id: string) => {
    setLoading(true);
    // Fetch full proforma and items
    const [proformaRes, itemsRes] = await Promise.all([
      supabase.from('proformas').select('*, clients(*), users(*)').eq('id', id).single(),
      supabase.from('proforma_items').select('*').eq('proforma_id', id).order('sort_order', { ascending: true })
    ]);

    if (proformaRes.data && itemsRes.data) {
      // Strip IDs and specific fields to make a clean clone
      const { id: _, created_at, updated_at, number, status, approved_at, client_signature_data, client_signed_name, ...cleanProforma } = proformaRes.data;

      const cleanItems = itemsRes.data.map((item: any) => {
        const { id, proforma_id, created_at, updated_at, ...cleanItem } = item;
        return cleanItem;
      });

      onSelect({
        proforma: cleanProforma,
        items: cleanItems,
        client: Array.isArray(proformaRes.data.clients) ? proformaRes.data.clients[0] : proformaRes.data.clients
      });
    }
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle>{mode === 'template' ? 'Select Template' : 'Select Quote to Clone'}</DialogTitle>
              <DialogDescription>
                {mode === 'template' ? 'Choose a saved template to start from.' : 'Search for an existing quote to copy its items and details.'}
              </DialogDescription>
            </div>
            {mode === 'template' && (
              <Button size="sm" onClick={() => { onClose(); onCreateBlankTemplate(); }}>
                Create New Template
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by project name or number..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground text-sm">No items found.</div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className="flex flex-col p-3 rounded-lg border border-border/40 hover:bg-muted/50 hover:border-primary/20 cursor-pointer transition-colors group"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-sm group-hover:text-primary transition-colors">{item.project_name}</span>
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">#{item.number}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{(item.clients as any)?.name || 'No Client'}</span>
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


function NewProformaContent() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');

  const [view, setView] = useState<'select' | 'form'>('select');
  const [initialData, setInitialData] = useState<any>(clientId ? { client: { id: clientId } } : undefined);

  const [modalMode, setModalMode] = useState<'template' | 'quote' | null>(null);

  const action = searchParams.get('action');

  // If clientId is provided in URL, we assume they want a blank quote for that client
  useEffect(() => {
    if (clientId) {
      setView('form');
    }

    if (action === 'blank') {
      handleStartBlank();
    } else if (action === 'template') {
      setModalMode('template');
    } else if (action === 'quote') {
      setModalMode('quote');
    }
  }, [clientId, action]);

  const handleStartBlank = () => {
    setInitialData({ proforma: { is_template: false } });
    setView('form');
  };

  const handleStartBlankTemplate = () => {
    setInitialData({ proforma: { is_template: true } });
    setView('form');
  };

  const handleSelectTemplateOrQuote = (data: any) => {
    // When cloning any quote or template, ensure it acts as a new regular quote by default
    const processedData = {
      ...data,
      proforma: {
        ...data.proforma,
        is_template: false,
      }
    };
    setInitialData(processedData);
    setView('form');
    setModalMode(null);
  };

  if (view === 'select') {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl animate-in fade-in duration-500">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Link href="/quotes" className="text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className=" text-3xl font-bold tracking-tight">Create Quote</h1>
          </div>
        </div>

        <div className="bg-card border border-border/40 rounded-xl p-8 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">How would you like to start?</h2>
          <p className="text-muted-foreground mb-8 text-sm">Choose a starting point for your new quote or proforma.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <Card className="hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group" onClick={handleStartBlank}>
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4 h-full pt-8">
                <div className="h-14 w-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Blank Quote</h3>
                  <p className="text-sm text-muted-foreground">Start completely from scratch.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group" onClick={() => setModalMode('template')}>
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4 h-full pt-8">
                <div className="h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <LayoutTemplate className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Use Template</h3>
                  <p className="text-sm text-muted-foreground">Start from a pre-saved template.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group" onClick={() => setModalMode('quote')}>
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4 h-full pt-8">
                <div className="h-14 w-14 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Copy className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Clone Existing</h3>
                  <p className="text-sm text-muted-foreground">Duplicate an old quote perfectly.</p>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        <TemplateSelectorModal
          isOpen={modalMode !== null}
          onClose={() => setModalMode(null)}
          onSelect={handleSelectTemplateOrQuote}
          mode={modalMode || 'template'}
          onCreateBlankTemplate={handleStartBlankTemplate}
        />
      </div>
    );
  }

  return (
    <ProformaForm
      mode="create"
      initialData={initialData}
      onBack={() => setView('select')}
    />
  );
}

export default function NewProforma() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Cargando...</div>}>
      <NewProformaContent />
    </Suspense>
  );
}
