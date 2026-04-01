-- Add invoice_id to payments table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'invoice_id') THEN
        ALTER TABLE public.payments ADD COLUMN invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
    END IF;
END $$;
