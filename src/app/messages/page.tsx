import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const revalidate = 0;

export default async function AdminMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch proformas with messages (including read_at for unread count)
  const { data: proformas } = await supabase
    .from('proformas')
    .select(`
      id,
      project_name,
      status,
      clients (name, company_name, first_name, last_name),
      proforma_requests (id, sender_type, message, created_at, read_at)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Filter proformas that have messages and sort by latest message
  const proformasWithMessages = (proformas || [])
    .filter(p => (p.proforma_requests as any[]).length > 0)
    .sort((a, b) => {
      const lastA = (a.proforma_requests as any[]).at(-1)?.created_at || '';
      const lastB = (b.proforma_requests as any[]).at(-1)?.created_at || '';
      return lastB.localeCompare(lastA);
    });

  function getClientName(c: any) {
    return c?.company_name || [c?.first_name, c?.last_name].filter(Boolean).join(' ') || c?.name || 'Unknown Client';
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'approved': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'sent': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8 flex items-center gap-3">
        <MessageSquare className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-serif text-foreground">Messages</h1>
          <p className="text-sm text-muted-foreground mt-0.5">All client communications by quote</p>
        </div>
        {proformasWithMessages.length > 0 && (
          <span className="ml-auto text-xs font-medium text-emerald-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Live
          </span>
        )}
      </div>

      {proformasWithMessages.length === 0 ? (
        <div className="text-center py-16 rounded-lg border border-dashed border-border/50 bg-muted/20">
          <MessageSquare className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="font-medium text-foreground">No messages yet</p>
          <p className="text-sm text-muted-foreground mt-1">When clients send a message, you'll see it here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {proformasWithMessages.map((proforma) => {
            const messages = proforma.proforma_requests as any[];
            const lastMessage = messages.at(-1);
            const clientName = getClientName(proforma.clients);
            // Unread = messages FROM client that have NO read_at
            const unreadCount = messages.filter(m => m.sender_type === 'client' && !m.read_at).length;
            const hasUnread = unreadCount > 0;
            const isLastFromClient = lastMessage?.sender_type === 'client';

            return (
              <Link
                key={proforma.id}
                href={`/proforma/${proforma.id}/messages`}
                className={`group flex items-start gap-4 p-4 rounded-lg border bg-card hover:border-primary/30 hover:shadow-sm transition-all ${
                  hasUnread ? 'border-primary/40 shadow-sm bg-primary/[0.02]' : 'border-border/50'
                }`}
              >
                {/* Avatar with unread indicator */}
                <div className="relative flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    hasUnread ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                  }`}>
                    {clientName.charAt(0).toUpperCase()}
                  </div>
                  {hasUnread && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm ${hasUnread ? 'font-bold text-foreground' : 'font-semibold text-foreground'}`}>
                      {clientName}
                    </span>
                    <Badge className={`text-[10px] py-0 h-4 ${getStatusColor(proforma.status || 'draft')}`}>
                      {proforma.status || 'draft'}
                    </Badge>
                    {hasUnread && (
                      <span className="text-[10px] font-semibold text-white bg-red-500 rounded-full px-1.5 py-0.5 leading-none">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                    Quote #{proforma.id.split('-')[0].toUpperCase()} · {proforma.project_name}
                  </p>
                  <p className={`text-sm mt-1.5 truncate ${hasUnread && isLastFromClient ? 'font-semibold text-foreground' : 'text-foreground/70'}`}>
                    <span className="text-muted-foreground text-xs mr-1 font-normal">
                      {lastMessage.sender_type === 'client' ? 'Client:' : 'You:'}
                    </span>
                    {lastMessage.message}
                  </p>
                  <span className="text-[10px] text-muted-foreground mt-1 inline-block">
                    {new Date(lastMessage.created_at).toLocaleString('en-US', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                    {' · '}{messages.length} message{messages.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
