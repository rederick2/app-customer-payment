'use client';

import { LoadingLink as Link } from '@/components/ui/loading-link';
import { usePathname } from 'next/navigation';
import { ListTodo, FileText, MessageSquare, Plus, Phone, DollarSign, Camera } from 'lucide-react';
import ContactUsModal from '@/components/ContactUsModal';

type Props = {
  id: string;
  unreadCount: number;
  phoneNumber?: string;
  companyName?: string;
};

export default function PublicMobileNav({ id, unreadCount, phoneNumber, companyName }: Props) {
  const pathname = usePathname();

  const links = [
    { href: `/p/${id}`, icon: FileText, label: 'Quotes' },
    { href: `/p/${id}/invoices`, icon: DollarSign, label: 'Invoices' },
    { href: `/p/${id}/work-progress`, icon: Camera, label: 'Progress' },
    { href: `/p/${id}/requests`, icon: ListTodo, label: 'Requests' },
    { href: `/p/${id}/messages`, icon: MessageSquare, label: 'Messages', badge: unreadCount },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#EFECE5] border-b border-[#E2E0D8] flex items-center justify-between px-4 h-14 shadow-sm">
        <span className="font-serif font-bold text-base text-[#0D3B47]">{companyName}</span>
        <Link
          href={`/p/${id}/request`}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-card text-[#306C3E] border border-[#D0CECB] rounded-lg text-xs font-semibold shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          New Request
        </Link>
      </header>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#EFECE5] border-t border-[#E2E0D8] flex items-center justify-around h-16 px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        {links.map(({ href, icon: Icon, label, badge }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center gap-1 flex-1 py-1 rounded-lg transition-colors ${isActive ? 'text-[#0D3B47]' : 'text-[#0D3B47]/50 hover:text-[#0D3B47]/80'
                }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                {badge ? (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
                    {badge > 9 ? '9+' : badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[10px] font-semibold ${isActive ? 'text-[#0D3B47]' : 'text-[#0D3B47]/50'}`}>
                {label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-[#306C3E]" />
              )}
            </Link>
          );
        })}

        <ContactUsModal
          phoneNumber={phoneNumber}
          trigger={
            <button
              className="relative flex flex-col items-center gap-1 flex-1 py-1 rounded-lg transition-colors text-[#0D3B47]/50 hover:text-[#0D3B47]/80"
            >
              <div className="relative">
                <Phone className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-semibold text-[#0D3B47]/50">
                Contact
              </span>
            </button>
          }
        />
      </nav>
    </>
  );
}

