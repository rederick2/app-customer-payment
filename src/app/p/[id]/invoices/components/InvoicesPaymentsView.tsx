'use client';

import * as React from 'react';
import { FileText, Receipt, DollarSign, Info } from 'lucide-react';
import InvoiceCard from './InvoiceCard';
import PaymentReceiptCard from './PaymentReceiptCard';
import { pdf } from '@react-pdf/renderer';
import InvoicePDF from '@/lib/pdf/InvoicePDF';
import PaymentPDF from '@/lib/pdf/PaymentPDF';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface InvoicesPaymentsViewProps {
  invoices: any[];
  payments: any[];
  client: any;
  user: any;
  currentProforma: any;
  allProformas: any[];
}

export default function InvoicesPaymentsView({
  invoices,
  payments,
  client,
  user,
  currentProforma,
  allProformas
}: InvoicesPaymentsViewProps) {
  const [activeTab, setActiveTab] = React.useState<'invoices' | 'payments'>('invoices');

  const handleViewInvoicePDF = async (invoice: any) => {
    try {
      const proforma = allProformas.find(p => p.id === invoice.proforma_id) || currentProforma;
      const blob = await pdf(<InvoicePDF invoice={invoice} proforma={proforma} client={client} user={user} />).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error generating invoice PDF.');
    }
  };

  const handleViewReceiptPDF = async (payment: any) => {
    try {
      const proforma = allProformas.find(p => p.id === payment.proforma_id) || currentProforma;
      const blob = await pdf(<PaymentPDF payment={payment} proforma={proforma} client={client} user={user} />).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error generating receipt PDF.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Custom Tabs List */}
      <div className="flex w-full max-w-md mx-auto mb-8 h-12 p-1 bg-[#F4F2EC] border border-[#E2E0D8] rounded-2xl shadow-inner relative z-20">
        <button
          onClick={() => setActiveTab('invoices')}
          className={cn(
            "flex-1 flex items-center justify-center rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300",
            activeTab === 'invoices'
              ? "bg-white shadow-md text-primary scale-[1.02]"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText className="mr-2 h-4 w-4" />
          Invoices
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={cn(
            "flex-1 flex items-center justify-center rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300",
            activeTab === 'payments'
              ? "bg-white shadow-md text-primary scale-[1.02]"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Receipt className="mr-2 h-4 w-4" />
          Receipts
        </button>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'invoices' ? (
          <div className="space-y-6">
            {invoices && invoices.length > 0 ? (
              invoices.map((invoice) => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  currentProformaId={currentProforma.id}
                  onViewPDF={() => handleViewInvoicePDF(invoice)}
                />
              ))
            ) : (
              <EmptyState
                icon={<FileText className="h-16 w-16 text-muted-foreground/20" />}
                title="No invoices found"
                description="We haven't generated any invoices for this project yet."
              />
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {payments && payments.length > 0 ? (
              payments.map((payment) => (
                <PaymentReceiptCard
                  key={payment.id}
                  payment={payment}
                  onViewPDF={() => handleViewReceiptPDF(payment)}
                />
              ))
            ) : (
              <EmptyState
                icon={<Receipt className="h-16 w-16 text-muted-foreground/20" />}
                title="No receipts found"
                description="We haven't recorded any payments or deposits yet."
              />
            )}
          </div>
        )}
      </div>

      {/* Shared Footer Note */}
      <div className="mt-12 p-6 bg-amber-50/30 border border-amber-200/50 rounded-2xl flex items-start gap-4 shadow-sm border-dashed">
        <div className="bg-amber-100 p-2 rounded-lg">
          <Info className="h-5 w-5 text-amber-700" />
        </div>
        <div className="space-y-1 text-left">
          <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wider">Information for the Client</h4>
          <p className="text-sm text-amber-800/80 leading-relaxed font-semibold">
            {activeTab === 'invoices'
              ? "Here you can see all your completed invoices. Click 'View Details' to see the full breakdown or 'Download PDF' to get a formal copy."
              : "This is your payment and deposit history. You can download the official PDF receipt for each transaction by clicking 'Receipt PDF'."
            }
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="text-center py-20 bg-white border border-border/50 rounded-[2rem] shadow-sm flex flex-col items-center">
      <div className="bg-muted/30 p-6 rounded-full mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-serif font-black text-[#0D3B47] tracking-tight">{title}</h3>
      <p className="text-muted-foreground mt-2 max-w-sm text-center font-medium opacity-70 italic">
        {description}
      </p>
    </div>
  );
}
