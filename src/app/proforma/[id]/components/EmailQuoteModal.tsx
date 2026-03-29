'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Loader2, X, FileText, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { sendProformaEmail } from './actions';
import { Checkbox } from '@/components/ui/checkbox';
import { Copy, ExternalLink } from 'lucide-react';

function ClientPortalCopyButton({ proformaId }: { proformaId: string }) {
  const portalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/p/${proformaId}`
    : `/p/${proformaId}`;
  return (
    <div className="flex gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="flex-1 text-xs h-7"
        onClick={() => {
          navigator.clipboard.writeText(portalUrl);
          toast.success('Copied!', { description: 'Client portal link copied to clipboard.' });
        }}
      >
        <Copy className="h-3 w-3 mr-1" /> Copy Link
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 px-2"
        onClick={() => window.open(portalUrl, '_blank')}
      >
        <ExternalLink className="h-3 w-3" />
      </Button>
    </div>
  );
}

interface EmailQuoteModalProps {
  proformaId: string;
  proformaNumber?: string;
  clientName: string;
  clientEmail: string;
  projectName: string;
  total: number;
  displayName: string;
  openOverride?: boolean;
  setOpenOverride?: (open: boolean) => void;
}

export default function EmailQuoteModal({
  proformaId,
  proformaNumber,
  clientName,
  clientEmail,
  projectName,
  total,
  displayName,
  openOverride,
  setOpenOverride
}: EmailQuoteModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openOverride ?? internalOpen;
  const setOpen = setOpenOverride ?? setInternalOpen;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailTo, setEmailTo] = useState(clientEmail || '');

  const defaultSubject = `Quote from ${displayName} - Project ${projectName}`;
  const defaultMessage = `Hi ${clientName},\n\nThank you for asking us to quote on your project.\n\nThe quote total is $${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}.\n\nYou can review the details in the link attached to this email or review the PDF.\n\nIf you have any questions or concerns regarding this quote, please don't hesitate to get in touch with us.\n\nSincerely,\n\n${displayName}`;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.set('to', emailTo); // since we might use a custom tag input for 'to' layer

    const result = await sendProformaEmail(proformaId, formData);

    setIsSubmitting(false);

    if (result.error) {
      toast.error('Error', { description: result.error });
    } else {
      toast.success('Email Sent', { description: 'The quote has been sent to the client.' });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!openOverride && (
        <DialogTrigger render={<Button variant="default" className="bg-[#306C3E] hover:bg-[#306C3E]/90 text-white" />}>
          <Mail className="mr-2 h-4 w-4" />
          Send Email
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-[#F8F9FA]">
        <DialogHeader className="p-6 pb-2 border-b bg-white border-border/50">
          <DialogTitle className="text-xl font-bold text-[#0D3B47]">
            Email quote #{String(proformaNumber || proformaId.split('-')[0]).toUpperCase()} to {clientName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row h-[550px]">
          {/* Left Form Area */}
          <div className="flex-1 p-6 overflow-y-auto bg-white">
            <div className="space-y-5">

              {/* To Field (Simulated chips) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">To</label>
                <div className="flex items-center min-h-[40px] px-3 border border-border/50 rounded-md bg-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                  {emailTo ? (
                    <div className="flex items-center gap-1 bg-muted/50 px-2.5 py-1 rounded-full text-sm font-medium border border-border/80">
                      {emailTo}
                      <button type="button" onClick={() => setEmailTo('')} className="text-muted-foreground hover:text-foreground ml-1">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <input
                      type="email"
                      placeholder="Enter an email..."
                      className="flex-1 outline-none bg-transparent text-sm min-w-[120px]"
                      onBlur={(e) => {
                        if (e.target.value) setEmailTo(e.target.value);
                        e.target.value = '';
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
                          e.preventDefault();
                          if (e.currentTarget.value) {
                            setEmailTo(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                  )}
                </div>
                <input type="hidden" name="to" value={emailTo} required />
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Subject</label>
                <Input
                  name="subject"
                  defaultValue={defaultSubject}
                  required
                  className="border-border/50 bg-white"
                />
              </div>

              {/* Message */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Message</label>
                <Textarea
                  name="message"
                  defaultValue={defaultMessage}
                  required
                  className="min-h-[250px] resize-none border-border/50 bg-white leading-relaxed"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="sendCopy" />
                <label htmlFor="sendCopy" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Send me a copy
                </label>
              </div>
            </div>
          </div>

          {/* Right Attachments Area */}
          <div className="w-full md:w-[300px] border-l border-border/50 bg-[#F8F9FA] p-6 flex flex-col">
            <h3 className="text-sm font-bold text-[#0D3B47] mb-4">Attachments</h3>

            <div className="border-2 border-dashed border-border/60 rounded-lg p-6 flex flex-col items-center justify-center bg-white hover:bg-muted/10 transition-colors cursor-pointer mb-6">
              <Button type="button" variant="outline" size="sm" className="mb-3 rounded-full font-semibold border-[#306C3E] text-[#306C3E] hover:bg-[#306C3E]/10">
                Upload Files
              </Button>
              <p className="text-xs text-muted-foreground text-center">Select or drag files here to upload</p>
            </div>

            {/* Automatic Quote PDF Attachment */}
            <div className="flex items-start gap-3 p-3 bg-white border border-border/50 rounded-lg shadow-sm">
              <Checkbox id="attachPdf" defaultChecked className="mt-1" />
              <div className="flex gap-3 items-center">
                <div className="bg-[#E7D6CB]/30 p-2 rounded flex items-center justify-center">
                  <FileText className="h-5 w-5 text-[#8D4A3A]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">quote_{String(proformaNumber || proformaId.split('-')[0]).toLowerCase()}.pdf</p>
                  <p className="text-xs text-muted-foreground">Automatically Generated</p>
                </div>
              </div>
            </div>

            {/* Client Portal Link */}
            <div className="mt-4">
              <h3 className="text-sm font-bold text-[#0D3B47] mb-2">Client Portal Link</h3>
              <div className="flex flex-col gap-2 p-3 bg-white border border-border/50 rounded-lg">
                <p className="text-xs text-muted-foreground break-all font-mono leading-relaxed">
                  /p/{proformaId}
                </p>
                <ClientPortalCopyButton proformaId={proformaId} />
              </div>
            </div>

          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-border/50 bg-white flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" onClick={(e) => {
            // Trigger form submission
            e.preventDefault();
            const form = (e.target as HTMLElement).closest('.p-0')?.querySelector('form');
            if (form) form.requestSubmit();
          }} className="bg-[#306C3E] hover:bg-[#306C3E]/90 text-white min-w-[120px]" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : 'Send Email'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
