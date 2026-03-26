'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContactUsModalProps {
  phoneNumber?: string;
  trigger?: React.ReactElement;
}

export default function ContactUsModal({ phoneNumber, trigger }: ContactUsModalProps) {
  const defaultTrigger = (
    <Button variant="ghost" className="flex items-center px-3 py-3 text-sm font-semibold text-[#0D3B47] rounded-md hover:bg-black/5 transition-colors w-full justify-start h-auto">
      <Phone className="mr-3 h-5 w-5 text-[#0D3B47]" />
      Contact Us
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger render={trigger || defaultTrigger} />
      <DialogContent className="sm:max-w-md bg-[#FDFCFB] border-[#0D3B47]/10">
        <DialogHeader className="space-y-3 pt-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#306C3E]/10 flex items-center justify-center mb-2">
            <MessageCircle className="h-6 w-6 text-[#306C3E]" />
          </div>
          <DialogTitle className="text-2xl font-serif font-bold text-[#0D3B47] text-center">
            Thanks for working with us!
          </DialogTitle>
        </DialogHeader>
        <div className="py-6 text-center space-y-4">
          <p className="text-[#4A4844] leading-relaxed">
            We value your trust. For any questions or details regarding your job estimate, please don't hesitate to reach out to us.
          </p>
          
          {phoneNumber && (
            <div className="bg-[#F4F2EC] p-4 rounded-xl border border-[#E2E0D8] inline-block">
              <p className="text-xs font-bold uppercase tracking-widest text-[#0D3B47] mb-1">Direct Line</p>
              <a 
                href={`tel:${phoneNumber}`} 
                className="text-xl font-bold text-[#306C3E] hover:underline flex items-center justify-center gap-2"
              >
                <Phone className="h-5 w-5" />
                {phoneNumber}
              </a>
            </div>
          )}
          
          {!phoneNumber && (
            <p className="text-sm font-medium text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 italic">
              Our contact number is currently being updated. Please check back soon or use the messages section.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
