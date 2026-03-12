'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, MessageSquare, Check, CheckCheck } from 'lucide-react';
import { submitClientMessage, submitCompanyMessage, markMessagesAsRead } from '@/app/p/[id]/actions';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

type RequestMessage = {
  id: string;
  sender_type: string;
  message: string;
  created_at: string;
  read_at: string | null;
};

type ChatProps = {
  proformaId: string;
  messages: RequestMessage[];
  role: 'client' | 'company';
};

const OTHER_ROLE = { client: 'company', company: 'client' } as const;

export default function CommunicationChat({ proformaId, messages: initialMessages, role }: ChatProps) {
  const [messages, setMessages] = useState<RequestMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otherOnline, setOtherOnline] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof createClient>['channel'] extends (...args: any[]) => infer R ? R : never | null>(null as any);
  const router = useRouter();

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherTyping]);

  // Mark messages from the other party as read when chat opens / new messages arrive
  useEffect(() => {
    markMessagesAsRead(proformaId, role).then(() => {
      // Refresh server components so unread badge in sidebar updates
      router.refresh();
    });
    // Also update local state so read tick appears immediately
    setMessages(prev => prev.map(m =>
      m.sender_type !== role && !m.read_at
        ? { ...m, read_at: new Date().toISOString() }
        : m
    ));
  }, [proformaId, role]);

  // Supabase Realtime: messages + presence + typing
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase.channel(`chat-${proformaId}`, {
      config: { presence: { key: role } },
    });
    channelRef.current = channel;

    // --- 1. Listen for new messages ---
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'proforma_requests',
        filter: `proforma_id=eq.${proformaId}`,
      },
      (payload) => {
        const newMsg = payload.new as RequestMessage;
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          // If message is from the other side, mark as read and refresh layout badge
          if (newMsg.sender_type !== role) {
            markMessagesAsRead(proformaId, role).then(() => router.refresh());
            return [...prev, { ...newMsg, read_at: new Date().toISOString() }];
          }
          // Own message confirmed by server - refresh so sender-side badges stay in sync
          router.refresh();
          return [...prev, newMsg];
        });
      }
    );

    // --- 2. Listen for read_at updates (read receipts for my messages) ---
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'proforma_requests',
        filter: `proforma_id=eq.${proformaId}`,
      },
      (payload) => {
        const updated = payload.new as RequestMessage;
        setMessages(prev =>
          prev.map(m => m.id === updated.id ? { ...m, read_at: updated.read_at } : m)
        );
      }
    );

    // --- 3. Presence: online/offline ---
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const others = Object.keys(state).filter(k => k !== role);
      setOtherOnline(others.length > 0);
    });

    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      const left = leftPresences.map((p: any) => p.role);
      if (left.includes(OTHER_ROLE[role])) setOtherOnline(false);
    });

    // --- 4. Typing indicator via broadcast ---
    channel.on('broadcast', { event: 'typing' }, ({ payload }: any) => {
      if (payload.role !== role) {
        setOtherTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 3000);
      }
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ role, online_at: new Date().toISOString() });
      }
    });

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [proformaId, role]);

  // Broadcast typing event
  const broadcastTyping = useCallback(() => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { role },
    });
  }, [role]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    broadcastTyping();
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setIsSubmitting(true);
    const text = newMessage;
    setNewMessage('');

    let result;
    if (role === 'client') {
      result = await submitClientMessage(proformaId, text);
    } else {
      result = await submitCompanyMessage(proformaId, text);
    }

    if (!result.success) {
      setNewMessage(text);
      toast.error('Error', { description: result.error || 'No se pudo enviar el mensaje.' });
    }

    setIsSubmitting(false);
  };

  // Render read receipt tick for my own messages
  function ReadTick({ msg }: { msg: RequestMessage }) {
    if (msg.sender_type !== role) return null;
    if (msg.read_at) {
      return (
        <span title={`Seen ${new Date(msg.read_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}>
          <CheckCheck className="h-3.5 w-3.5 text-sky-400 inline-block" />
        </span>
      );
    }
    return (
      <span title="Sent">
        <Check className="h-3.5 w-3.5 text-white/50 inline-block" />
      </span>
    );
  }

  const otherLabel = role === 'client' ? 'Admin' : 'Client';

  return (
    <Card className="mt-4 md:mt-8 border-border/50 shadow-sm print:hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base md:text-lg font-medium">
          {/* Row 1: Icon + Title + Realtime badge */}
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
            <span className="truncate">Comentarios y Consultas</span>
            <span className="ml-auto text-xs font-normal text-emerald-600 flex items-center gap-1 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              <span className="hidden sm:inline">En tiempo real</span>
            </span>
          </div>
          {/* Row 2: Online/Offline status */}
          <div className="flex items-center gap-1.5 mt-1 text-xs font-normal">
            <span className={`w-2 h-2 rounded-full inline-block transition-colors ${otherOnline ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
            <span className={otherOnline ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}>
              {otherLabel} {otherOnline ? 'online' : 'offline'}
            </span>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 px-3 md:px-6">
        {/* Messages List */}
        <div className="space-y-4 max-h-[55vh] md:max-h-[400px] overflow-y-auto p-1 md:p-2">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No hay mensajes aún. ¡Sé el primero en escribir!</p>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_type === role;
              return (
                <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    isMine
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted text-foreground rounded-tl-sm border border-border/40'
                  }`}>
                    <p className="text-sm break-words whitespace-pre-wrap">{msg.message}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1 flex items-center gap-1">
                    {new Date(msg.created_at).toLocaleString('es-ES', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                    <ReadTick msg={msg} />
                  </span>
                </div>
              );
            })
          )}

          {/* Typing indicator */}
          {otherTyping && (
            <div className="flex items-start gap-2">
              <div className="bg-muted border border-border/40 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
              </div>
              <span className="text-[10px] text-muted-foreground self-end mb-0.5">{otherLabel} está escribiendo…</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="relative mt-4">
          <Textarea
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChange={handleInputChange}
            className="min-h-[80px] resize-none pr-12 pb-10"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline-block mr-2">
              Enter para enviar
            </span>
            <Button
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={handleSendMessage}
              disabled={isSubmitting || !newMessage.trim()}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
