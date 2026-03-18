'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, FileText, Check, X, Eye, Loader2, Link as LinkIcon, Printer, Calendar as CalendarIcon, Download } from 'lucide-react';
import { updateProformaStatus, scheduleJob } from './actions';
import { toast } from 'sonner';
import ScheduleJobModal from './ScheduleJobModal';
import QuotePreviewModal from './QuotePreviewModal';
import EmailQuoteModal from './EmailQuoteModal';
import React from 'react';

export default function ProformaDropdownActions({
  proformaId,
  currentStatus,
  projectName,
  proforma,
  items
}: {
  proformaId: string,
  currentStatus: string,
  projectName: string,
  proforma: any,
  items: any[]
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    const result = await updateProformaStatus(proformaId, newStatus);
    setIsUpdating(false);

    if (result.error) {
      toast.error('Error', { description: result.error });
    } else {
      toast.success('Status updated', { description: 'The quote status has been successfully updated.' });
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const copyClientLink = () => {
    const url = `${window.location.origin}/p/${proformaId}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied', { description: 'Client link copied to clipboard.' });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" className="flex items-center gap-2 border-border/50 bg-white shadow-sm" disabled={isUpdating} />}>
        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <MoreHorizontal className="h-4 w-4 text-primary" />}
        More
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">

        {/* Status Actions */}
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">Mark as...</div>
        {currentStatus !== 'approved' && (
          <DropdownMenuItem onClick={() => handleStatusUpdate('approved')} className="cursor-pointer text-green-700 focus:text-green-800">
            <Check className="mr-2 h-4 w-4" />
            Approved
          </DropdownMenuItem>
        )}
        {currentStatus !== 'rejected' && (
          <DropdownMenuItem onClick={() => handleStatusUpdate('rejected')} className="cursor-pointer text-red-700 focus:text-red-800">
            <X className="mr-2 h-4 w-4" />
            Rejected
          </DropdownMenuItem>
        )}

        {currentStatus === 'approved' && (
          <DropdownMenuItem onClick={() => setIsScheduleModalOpen(true)} className="cursor-pointer text-blue-700 focus:text-blue-800">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Convert to Job
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* General Actions */}
        <DropdownMenuItem onClick={copyClientLink} className="cursor-pointer">
          <LinkIcon className="mr-2 h-4 w-4" />
          Copy Client Link
        </DropdownMenuItem>

        <DropdownMenuItem>
          <a href={`/p/${proformaId}`} target="_blank" rel="noopener noreferrer" className="cursor-pointer w-full flex items-center">
            <Eye className="mr-2 h-4 w-4" />
            Preview as Client
          </a>
        </DropdownMenuItem>

      </DropdownMenuContent>

      <ScheduleJobModal
        proformaId={proformaId}
        projectName={projectName}
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
      />

      <QuotePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        proforma={proforma}
        items={items}
        onSendEmail={() => {
          setIsPreviewModalOpen(false);
          setIsEmailModalOpen(true);
        }}
      />

      {isEmailModalOpen && (
        <EmailQuoteModal
          proformaId={proformaId}
          clientName={(() => {
            const c = proforma.clients;
            return c?.company_name || [c?.first_name, c?.last_name].filter(Boolean).join(' ') || 'Cliente';
          })()}
          clientEmail={proforma.clients?.email || ''}
          projectName={proforma.project_name}
          total={proforma.total}
          openOverride={isEmailModalOpen}
          setOpenOverride={setIsEmailModalOpen}
        />
      )}
    </DropdownMenu>
  );
}
