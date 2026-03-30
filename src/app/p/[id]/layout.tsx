import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, ListTodo, FileText, Phone, LogOut, ThumbsUp, MessageSquare, DollarSign, Camera } from 'lucide-react';
import RealtimeNotifier from '@/components/RealtimeNotifier';
import PublicMobileNav from '@/components/PublicMobileNav';
import ContactUsModal from '@/components/ContactUsModal';

export default async function PublicProformaLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;

  // Verify proforma and fetch client
  const supabase = createAdminClient();
  const { data: proforma, error } = await supabase
    .from('proformas')
    .select(`
      id,
      clients (
        name,
        company_name,
        first_name,
        last_name
      ),
      users (
        phone,
        display_name,
        logo_url
      )
    `)
    .eq('id', id)
    .single();

  if (error || !proforma) {
    notFound();
  }

  // Count unread messages from company (messages the client hasn't read yet)
  const { count: unreadCount } = await supabase
    .from('proforma_requests')
    .select('id', { count: 'exact', head: true })
    .eq('proforma_id', id)
    .eq('sender_type', 'company')
    .is('read_at', null);

  // Normalize joined data which might come back as arrays from Supabase
  const userData = (Array.isArray(proforma.users) ? proforma.users[0] : proforma.users) as any;
  const clientData = (Array.isArray(proforma.clients) ? proforma.clients[0] : proforma.clients) as any;

  const clientName = clientData?.company_name ||
    [clientData?.first_name, clientData?.last_name].filter(Boolean).join(' ') ||
    clientData?.name ||
    'Cliente';

  return (
    <div className="flex bg-[#F4F2EC] min-h-screen">

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#E2E0D8] bg-[#EFECE5] h-screen sticky top-0 px-4 py-8">

        {/* Client Branding */}
        <div className="mb-8 px-2">
          {userData?.logo_url ? (
            <img src={userData.logo_url} alt="Logo" className="h-12 w-auto" />
          ) : (
            <h1 className="font-serif text-3xl font-bold tracking-tight uppercase text-primary">{userData?.display_name}</h1>
          )}
        </div>

        {/* New Request Button */}
        <div className="mb-8">
          <Link href={`/p/${id}/request`} className="block w-full">
            <Button variant="outline" className="w-full justify-center bg-white hover:bg-white/80 text-[#306C3E] border-[#D0CECB] rounded-lg shadow-sm font-semibold h-11">
              <Plus className="mr-2 h-5 w-5" />
              New Request
            </Button>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1">
          <Link href={`/p/${id}/requests`} className="flex items-center px-3 py-3 text-sm font-semibold text-[#0D3B47] rounded-md hover:bg-black/5 transition-colors">
            <ListTodo className="mr-3 h-5 w-5 text-[#0D3B47]" />
            Requests
          </Link>
          <Link href={`/p/${id}`} className="flex items-center px-3 py-3 text-sm font-semibold text-[#0D3B47] rounded-md hover:bg-black/5 transition-colors">
            <FileText className="mr-3 h-5 w-5 text-[#0D3B47]" />
            Quotes
          </Link>
          <Link href={`/p/${id}/messages`} className="flex items-center px-3 py-3 text-sm font-semibold text-[#0D3B47] rounded-md hover:bg-black/5 transition-colors">
            <MessageSquare className="mr-3 h-5 w-5 text-[#0D3B47]" />
            Messages
            {(unreadCount ?? 0) > 0 && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {(unreadCount ?? 0) > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <Link href={`/p/${id}/invoices`} className="flex items-center px-3 py-3 text-sm font-semibold text-[#0D3B47] rounded-md hover:bg-black/5 transition-colors">
            <DollarSign className="mr-3 h-5 w-5 text-[#0D3B47]" />
            Invoices
          </Link>
          <Link href={`/p/${id}/work-progress`} className="flex items-center px-3 py-3 text-sm font-semibold text-[#0D3B47] rounded-md hover:bg-black/5 transition-colors">
            <Camera className="mr-3 h-5 w-5 text-[#0D3B47]" />
            Work Progress
          </Link>
        </nav>

        {/* Bottom Links */}
        <div className="pt-4 space-y-1 border-t border-[#E2E0D8]">
          <ContactUsModal phoneNumber={userData?.phone} />
          {/*<div className="flex items-center px-3 py-3 text-sm font-semibold text-[#0D3B47] rounded-md hover:bg-black/5 transition-colors cursor-pointer">
            <LogOut className="mr-3 h-5 w-5 text-[#0D3B47]" />
            Log Out
          </div>*/}
        </div>

        {/*<div className="pt-4 mt-2 space-y-1 border-t border-[#E2E0D8]">
           <Link href="#" className="flex items-center px-3 py-3 text-sm font-semibold text-[#0D3B47] rounded-md hover:bg-black/5 transition-colors">
            <ThumbsUp className="mr-3 h-5 w-5 text-[#0D3B47]" />
            Refer a Friend
          </Link>
        </div>*/}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden p-0">
        {/* Mobile top header spacer */}
        <div className="md:hidden h-14" />
        <div className="bg-white min-h-screen min-w-full">
          {/* Add bottom padding on mobile for tab bar */}
          <div className="pb-20 md:pb-0">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Navigation (bottom tab bar + top header) */}
      <PublicMobileNav id={id} unreadCount={unreadCount ?? 0} phoneNumber={userData?.phone} companyName={userData?.display_name} />

      {/* Invisible realtime listener — keeps the badge count live for the client */}
      <RealtimeNotifier proformaIds={[id]} watchSenderType="company" />

    </div>
  );
}
