'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle, ArrowRightLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function IntegrationsSettings() {
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchIntegrations();
  }, []);

  async function fetchIntegrations() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id);
      setIntegrations(data || []);
    }
    setLoading(false);
  }

  const qbo = integrations.find(i => i.service_name === 'quickbooks');

  const handleConnectQBO = () => {
    // Redirect to our internal API route that initiates Intuit OAuth
    window.location.href = '/api/auth/quickbooks/login';
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl ">QuickBooks Online</CardTitle>
              <CardDescription>Sync your customers and invoices automatically.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">Status:</span>
                  {qbo?.is_active ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold">
                      <CheckCircle2 className="h-3 w-3" />
                      Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-bold">
                      <AlertCircle className="h-3 w-3" />
                      Not Connected
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground max-w-md">
                  Connect your QuickBooks account to synchronize all your project estimates and invoices.
                  Once connected, you can push data directly to your accounting software.
                </p>
                {qbo?.last_sync_at && (
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                    Last synced: {new Date(qbo.last_sync_at).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="shrink-0">
                {qbo?.is_active ? (
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" className="rounded-xl font-bold text-xs" onClick={handleConnectQBO}>
                      Reconnect / Refresh
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground italic">Connected to realm: {qbo.realm_id}</p>
                  </div>
                ) : (
                  <Button onClick={handleConnectQBO} className="rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 px-8 h-11">
                    Connect to QuickBooks
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm opacity-50 grayscale cursor-not-allowed">
        <CardHeader>
          <CardTitle className="text-lg">Stripe (Coming Soon)</CardTitle>
          <CardDescription>Accept online payments and sync transactions.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
