'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, CheckCircle2, FileText, Users, DollarSign, Settings, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TutorialDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TutorialDialog({ isOpen, onClose }: TutorialDialogProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const steps = [
    {
      title: "Welcome to Quotes",
      description: "Creating a quote is simple and fast. Follow this quick guide to understand the key steps.",
      icon: <FileText className="h-12 w-12 text-primary/80 mb-4" />,
      content: (
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>You can start a quote in three ways:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-foreground">Blank Quote:</strong> Start from scratch with an empty form.</li>
            <li><strong className="text-foreground">Use Template:</strong> Load a pre-saved layout with standard items.</li>
            <li><strong className="text-foreground">Clone Existing:</strong> Duplicate an old quote to save time.</li>
          </ul>
        </div>
      )
    },
    {
      title: "1. Assign a Client",
      description: "Every quote needs a recipient.",
      icon: <Users className="h-12 w-12 text-blue-500/80 mb-4" />,
      content: (
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>At the top of the form, you can search for an existing client or click <strong className="text-foreground">"+ New Client"</strong> to add one on the fly.</p>
          <p>Don't forget to fill in the <strong className="text-foreground">Project Name</strong> and <strong className="text-foreground">Validity Period</strong> so your client knows what the quote is for and how long the price is guaranteed.</p>
        </div>
      )
    },
    {
      title: "2. Add Line Items",
      description: "Detail your products or services.",
      icon: <DollarSign className="h-12 w-12 text-emerald-500/80 mb-4" />,
      content: (
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>Type in the item name. If you've used it before, it might pop up from your catalog!</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-foreground">Cost & Markup:</strong> Click inside the Unit Price field to see hidden Cost and Markup calculators. These are invisible to the client.</li>
            <li><strong className="text-foreground">Optional Items:</strong> Check "Mark as optional" if you want to let the client decide whether to include this item in their final total.</li>
          </ul>
        </div>
      )
    },
    {
      title: "3. Finalize & Save",
      description: "Review totals and apply taxes.",
      icon: <CheckCircle2 className="h-12 w-12 text-violet-500/80 mb-4" />,
      content: (
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>At the bottom of the form:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-foreground">Adjustments:</strong> Apply discounts or flat fees.</li>
            <li><strong className="text-foreground">Taxes:</strong> Select or create a tax rate (e.g., GST/HST).</li>
            <li><strong className="text-foreground">Deposit:</strong> Request an upfront deposit.</li>
          </ul>
          <p className="mt-4 font-medium text-foreground">You are now ready to create your first quote!</p>
        </div>
      )
    }
  ];

  const currentStep = steps[step - 1];

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFinish = () => {
    setStep(1);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setStep(1);
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl bg-card rounded-2xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="relative p-8 pb-6 bg-muted/30 border-b border-border/40 flex flex-col items-center text-center">
            {currentStep.icon}
            <DialogTitle className="text-2xl font-bold tracking-tight mb-2 font-['Archivo_Black']">
              {currentStep.title}
            </DialogTitle>
            <DialogDescription className="text-base">
              {currentStep.description}
            </DialogDescription>
          </div>

          {/* Body */}
          <div className="p-8 py-6 min-h-[180px] flex items-center">
            {currentStep.content}
          </div>

          {/* Footer */}
          <div className="p-6 pt-4 bg-muted/10 border-t border-border/40 flex items-center justify-between">
            <div className="flex gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2 w-2 rounded-full transition-all duration-300",
                    step === i + 1 ? "bg-primary w-6" : "bg-primary/20"
                  )}
                />
              ))}
            </div>
            <div className="flex gap-3">
              {step > 1 && (
                <Button variant="outline" onClick={handlePrev} className="rounded-xl">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              )}
              {step < totalSteps ? (
                <Button onClick={handleNext} className="rounded-xl font-bold">
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleFinish} className="rounded-xl font-bold">
                  Get Started <CheckCircle2 className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
