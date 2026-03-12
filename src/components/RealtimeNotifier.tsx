'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Props = {
  /** Proforma IDs to watch, or 'all' to watch any incoming messages */
  proformaIds: string[];
  /** Which sender_type triggers the refresh */
  watchSenderType: 'client' | 'company';
};

/**
 * Invisible component — mounts in a layout to keep the unread badge count
 * up to date in real-time without the user needing to navigate or refresh.
 *
 * When a new message arrives from `watchSenderType`, it calls router.refresh()
 * which causes Next.js to re-fetch the server layout (and re-render the badge).
 */
export default function RealtimeNotifier({ proformaIds, watchSenderType }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (proformaIds.length === 0) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`notifier-${proformaIds.join('-').slice(0, 60)}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'proforma_requests',
        },
        (payload) => {
          const msg = payload.new as { proforma_id: string; sender_type: string };
          // Only refresh if it's for one of our proformas and from the watched sender
          if (
            proformaIds.includes(msg.proforma_id) &&
            msg.sender_type === watchSenderType
          ) {
            router.refresh();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'proforma_requests',
        },
        (payload) => {
          const msg = payload.new as { proforma_id: string };
          // Refresh when read_at changes so badges clear instantly
          if (proformaIds.includes(msg.proforma_id)) {
            router.refresh();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [proformaIds, watchSenderType, router]);

  return null; // Invisible — no UI
}
