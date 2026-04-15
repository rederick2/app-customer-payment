import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import CommunicationChat from '@/components/CommunicationChat';

export const revalidate = 0;

type Props = {
  params: Promise<{ id: string }>
}

export default async function AdminProformaMessagesPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: proforma, error } = await supabase
    .from('proformas')
    .select('id, number, project_name, clients(name, company_name, first_name, last_name)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !proforma) notFound();

  const { data: messages } = await supabase
    .from('proforma_requests')
    .select('*')
    .eq('proforma_id', id)
    .order('created_at', { ascending: true });

  const c = proforma.clients as any;
  const clientName = c?.company_name || [c?.first_name, c?.last_name].filter(Boolean).join(' ') || c?.name || 'Client';

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <Link href="/messages" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          All Messages
        </Link>
        <div>
          <h1 className="text-xl font-bold  text-foreground">{clientName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {proforma.project_name} - #{proforma.number}
          </p>
        </div>
      </div>

      <CommunicationChat
        proformaId={id}
        messages={messages || []}
        role="company"
      />
    </div>
  );
}
