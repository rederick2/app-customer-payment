'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { sendMaterialsEmail } from './actions';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Mail, Loader2, X, FileText, Check, ChevronsUpDown } from 'lucide-react';

interface EmailMaterialsModalProps {
  proformaId: string;
  proformaNumber?: string;
  projectName: string;
  teamMembers?: any[];
  openOverride?: boolean;
  setOpenOverride?: (open: boolean) => void;
}

export default function EmailMaterialsModal({ 
  proformaId, 
  proformaNumber,
  projectName, 
  teamMembers = [],
  openOverride,
  setOpenOverride
}: EmailMaterialsModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openOverride ?? internalOpen;
  const setOpen = setOpenOverride ?? setInternalOpen;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [comboboxOpen, setComboboxOpen] = useState(false);

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
          <DialogTitle className="text-xl font-bold text-primary">
            Email Materials List for {projectName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row h-[550px]">
           {/* Left Form Area */}
           <div className="flex-1 p-6 overflow-y-auto bg-white">
              <div className="space-y-5">
                
                {/* Recipient Selection (To) */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">To</label>
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                    <PopoverTrigger
                      role="combobox"
                      aria-expanded={comboboxOpen}
                      className="w-full justify-between h-auto py-3 font-normal bg-white border border-border/50 hover:bg-muted/5 text-left rounded-md px-3 flex items-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {(() => {
                        const selectedMember = selectedMemberId ? teamMembers.find(m => m.id === selectedMemberId) : null;
                        
                        if (selectedMember) {
                          return (
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-foreground truncate">{selectedMember.name}</span>
                              <span className="text-xs text-muted-foreground truncate">{selectedMember.email}</span>
                            </div>
                          );
                        }
                        
                        return emailTo ? (
                          <div className="flex items-center gap-1 bg-muted/50 px-2.5 py-1 rounded-full text-sm font-medium border border-border/80">
                             {emailTo}
                             <button type="button" onClick={(e) => { e.stopPropagation(); setEmailTo(''); setSelectedMemberId(null); }} className="text-muted-foreground hover:text-foreground ml-1">
                                <X className="h-3.5 w-3.5" />
                             </button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Select team member or enter email...</span>
                        );
                      })()}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput 
                          placeholder="Search team members or type email..." 
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const value = e.currentTarget.value;
                              if (value && value.includes('@')) {
                                setEmailTo(value);
                                setSelectedMemberId(null);
                                setComboboxOpen(false);
                              }
                            }
                          }}
                        />
                        <CommandList className="max-h-[250px] overflow-y-auto">
                          <CommandEmpty>
                            <p className="p-4 text-sm text-muted-foreground">No team members found. Press Enter to use manual email.</p>
                          </CommandEmpty>
                          <CommandGroup heading="Team Members">
                            {teamMembers.map((member) => (
                              <CommandItem
                                key={member.id}
                                value={`${member.name} ${member.email || ''} ${member.id}`}
                                onSelect={() => {
                                  setEmailTo(member.email || '');
                                  setSelectedMemberId(member.id);
                                  setComboboxOpen(false);
                                }}
                                className="flex flex-col items-start gap-1 py-3 px-4 cursor-pointer"
                              >
                                <div className="flex w-full items-center justify-between">
                                  <span className="font-bold">{member.name}</span>
                                  {selectedMemberId === member.id && <Check className="h-4 w-4 text-primary" />}
                                </div>
                                <div className="text-sm text-muted-foreground truncate w-full">
                                  {member.email || 'No email provided'}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
            <h3 className="text-sm font-bold text-primary mb-4">Attachments</h3>
              
              {/* Automatic Materials PDF Attachment */}
              <div className="flex items-start gap-3 p-3 bg-white border border-border/50 rounded-lg shadow-sm">
                <Checkbox id="attachPdf" defaultChecked className="mt-1" />
                <div className="flex gap-3 items-center">
                  <div className="bg-[#E7D6CB]/30 p-2 rounded flex items-center justify-center">
                     <FileText className="h-5 w-5 text-[#8D4A3A]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">materials_{String(proformaNumber || proformaId.split('-')[0]).toLowerCase()}.pdf</p>
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
          }} className="font-bold text-primary-foreground min-w-[120px]" disabled={isSubmitting}>
             {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : 'Send Email'}
           </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
