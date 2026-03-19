'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Loader2, X, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { sendMaterialsEmail } from './actions';
import { Checkbox } from '@/components/ui/checkbox';

interface EmailMaterialsModalProps {
  proformaId: string;
  projectName: string;
  openOverride?: boolean;
  setOpenOverride?: (open: boolean) => void;
}

export default function EmailMaterialsModal({ 
  proformaId, 
  projectName, 
  openOverride,
  setOpenOverride
}: EmailMaterialsModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openOverride ?? internalOpen;
  const setOpen = setOpenOverride ?? setInternalOpen;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailTo, setEmailTo] = useState('');

  const defaultSubject = `Materials List - Project ${projectName}`;
  const defaultMessage = `Hi team,\n\nPlease find attached the Materials List for the project: ${projectName}.\n\nLet me know if you have any questions.\n\nBest,\n\nEstudioPro`;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!emailTo) {
      toast.error('Email required', { description: 'Please enter a recipient email address.' });
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.set('to', emailTo);

    const result = await sendMaterialsEmail(proformaId, formData);

    setIsSubmitting(false);

    if (result.error) {
      toast.error('Error', { description: result.error });
    } else {
      toast.success('Email Sent', { description: 'The materials list has been sent successfully.' });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!openOverride && (
        <DialogTrigger render={<Button variant="outline" size="sm" className="h-8 gap-1 font-bold border-blue-600 text-blue-700 hover:bg-blue-50" />}>
          <Mail className="h-4 w-4" /> Send Materials
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-[#F8F9FA]">
        <DialogHeader className="p-6 pb-2 border-b bg-white border-border/50">
          <DialogTitle className="text-xl font-bold text-[#0D3B47]">
            Email Materials List for {projectName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row h-[550px]">
           {/* Left Form Area */}
           <div className="flex-1 p-6 overflow-y-auto bg-white">
              <div className="space-y-5">
                
                {/* To Field */}
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
                          placeholder="Enter team member email..." 
                          className="flex-1 outline-none bg-transparent text-sm min-w-[120px]"
                          onBlur={(e) => {
                             if(e.target.value) setEmailTo(e.target.value);
                             e.target.value = '';
                          }}
                          onKeyDown={(e) => {
                             if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
                                e.preventDefault();
                                if(e.currentTarget.value) {
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
              
              {/* Automatic Materials PDF Attachment */}
              <div className="flex items-start gap-3 p-3 bg-white border border-border/50 rounded-lg shadow-sm">
                <Checkbox id="attachPdf" defaultChecked className="mt-1" />
                <div className="flex gap-3 items-center">
                  <div className="bg-[#E7D6CB]/30 p-2 rounded flex items-center justify-center">
                     <FileText className="h-5 w-5 text-[#8D4A3A]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">materials_{proformaId.split('-')[0]}.pdf</p>
                    <p className="text-xs text-muted-foreground">Automatically Generated</p>
                  </div>
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
