'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Loader2, X, FileText, Upload, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { sendProformaEmail } from './actions';
import { Checkbox } from '@/components/ui/checkbox';
import { Copy, ExternalLink } from 'lucide-react';
import { Label } from '@/components/ui/label';

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
        <DialogTrigger render={<Button variant="default" className="px-3.5 py-2 font-bold text-primary-foreground" />}>
          <Mail className="mr-2 h-4 w-4" />
          Send Email
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row h-[600px]">
          {/* Left Form Area */}
          <div className="flex-1 p-8 overflow-y-auto">
            <DialogHeader className="mb-6">
              <DialogTitle>SEND QUOTE EMAIL</DialogTitle>
              <DialogDescription>
                Quote #{String(proformaNumber || proformaId.split('-')[0]).toUpperCase()} for {clientName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* To Field */}
              <div className="space-y-2">
                <Label className="ml-1">To *</Label>
                <div className="flex items-center min-h-[48px] px-4 border border-border/60 rounded-xl bg-background focus-within:ring-2 focus-within:ring-primary/10 transition-all shadow-sm">
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
              <div className="space-y-2">
                <Label className="ml-1">Subject *</Label>
                <Input
                  name="subject"
                  defaultValue={defaultSubject}
                  required
                  className="font-bold"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label className="ml-1">Message *</Label>
                <Textarea
                  name="message"
                  defaultValue={defaultMessage}
                  required
                  className="min-h-[250px] resize-none leading-relaxed font-medium"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="sendCopy" />
                <Label htmlFor="sendCopy" className="normal-case tracking-normal text-sm font-medium ml-0">
                  Send me a copy
                </Label>
              </div>
            </div>
          </div>

          {/* Right Attachments Area */}
          <div className="w-full md:w-[320px] border-l border-border/40 bg-muted/5 p-8 flex flex-col">
            <Label className="mb-4 ml-1">Attachments</Label>

            <div className="border-2 border-dashed border-border/40 rounded-2xl p-8 flex flex-col items-center justify-center bg-background/50 hover:bg-background/80 transition-all cursor-pointer mb-6 group/upload">
              <Button type="button" variant="secondary" size="sm" className="mb-4 rounded-full px-6">
                <Upload className="h-4 w-4 mr-2" /> Upload Files
              </Button>
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground text-center">Drop files here</p>
            </div>

            {/* Automatic Quote PDF Attachment */}
            <div className="flex items-start gap-4 p-4 bg-background border border-border/40 rounded-2xl shadow-sm">
              <Checkbox id="attachPdf" defaultChecked className="mt-1" />
              <div className="flex gap-3 items-center">
                <div className="bg-primary/10 p-2 rounded flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-foreground">quote_{String(proformaNumber || proformaId.split('-')[0]).toLowerCase()}.pdf</p>
                  <p className="text-[10px] text-muted-foreground">Generated PDF</p>
                </div>
              </div>
            </div>

            {/* Client Portal Link */}
            <div className="mt-auto pt-8">
              <Label className="mb-4 ml-1">Client Portal Link</Label>
              <div className="flex flex-col gap-3 p-4 bg-background border border-border/40 rounded-2xl shadow-sm">
                <p className="text-[10px] text-muted-foreground break-all font-mono leading-relaxed bg-muted/20 p-2 rounded-lg border border-border/10">
                  /p/{proformaId}
                </p>
                <ClientPortalCopyButton proformaId={proformaId} />
              </div>
            </div>
          </div>
        </form>

        <DialogFooter className="mt-0 p-8 border-t border-border/40">
          <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" onClick={(e) => {
            // Trigger form submission
            e.preventDefault();
            const form = (e.target as HTMLElement).closest('.p-0')?.querySelector('form') || (e.target as HTMLElement).closest('[role="dialog"]')?.querySelector('form');
            if (form) form.requestSubmit();
          }} className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[150px] shadow-xl" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : 'Send Email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
