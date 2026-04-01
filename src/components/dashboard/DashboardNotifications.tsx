'use client';

import * as React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Bell, Eye, CheckCircle2, XCircle, MessageSquare, ArrowUpRight, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

type Notification = {
  id: string;
  created_at: string;
  proforma_id: string | null;
  client_id: string | null;
  type: string;
  message: string;
  is_read: boolean;
  proformas?: {
    project_name: string;
    clients?: {
      name: string;
    }
  }
};

export function DashboardNotifications() {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const supabase = createClient();

  React.useEffect(() => {
    let channel: ReturnType<typeof supabase.channel>;

    async function fetchNotifications() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Fetch last 10 notifications
        const { data, error } = await supabase
          .from('notifications')
          .select('*, proformas(project_name, clients(name))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!error && data) {
          setNotifications(data);
        }

        // Subscribe to real-time changes
        channel = supabase
          .channel('public:notifications')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              const newNotification = payload.new as Notification;
              setNotifications((prev) => {
                const updated = [newNotification, ...prev];
                return updated.slice(0, 10); // Keep only the latest 10
              });
            }
          )
          .subscribe();

      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchNotifications();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase]);

  const markAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return;

    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));

    // DB update
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

    // DB update
    try {
      await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'viewed': return <Eye className="h-4 w-4 text-blue-600" />;
      case 'approved': return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'request': return <MessageSquare className="h-4 w-4 text-amber-600" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getBgForType = (type: string) => {
    switch (type) {
      case 'viewed': return 'bg-blue-100';
      case 'approved': return 'bg-emerald-100';
      case 'rejected': return 'bg-red-100';
      case 'request': return 'bg-amber-100';
      default: return 'bg-muted';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Popover>
      <PopoverTrigger className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
        <Bell className="h-4.5 w-4.5 cursor-pointer" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white border-2 border-background animate-in zoom-in duration-300">
            {unreadCount}
          </Badge>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 mr-4 mt-2 shadow-xl border-border/50 rounded-xl" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/20 rounded-t-xl">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <>
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Mark all as read
                </button>
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {unreadCount} unread
                </span>
              </>
            )}
          </div>
        </div>

        <div className="max-h-[350px] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No recent notifications.
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={notif.proforma_id ? `/proforma/${notif.proforma_id}` : '#'}
                  onClick={() => markAsRead(notif.id, notif.is_read)}
                >
                  <div className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer group border-b border-border/20 last:border-0 ${!notif.is_read ? 'bg-primary/5' : ''}`}>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${getBgForType(notif.type)}`}>
                      {getIconForType(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-0.5">
                        {notif.proformas?.clients?.name && (
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary opacity-70">
                            {notif.proformas.clients.name}
                          </span>
                        )}
                        <p className={`text-sm leading-snug ${!notif.is_read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                          {notif.message}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 font-medium opacity-80">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {notif.proforma_id && (
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0 mt-1" />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
