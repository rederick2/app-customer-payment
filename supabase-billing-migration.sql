-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proforma_id uuid REFERENCES public.proformas(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10, 2) NOT NULL DEFAULT 0,
  payment_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  payment_method text, -- 'cash', 'transfer', 'card', 'check'
  type text NOT NULL, -- 'deposit', 'payment'
  status text NOT NULL DEFAULT 'completed', -- 'completed', 'cancelled'
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proforma_id uuid REFERENCES public.proformas(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  invoice_number text NOT NULL UNIQUE,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  total_amount numeric(10, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'cancelled'
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Add RLS policies (adjust as needed for admin/client access)
-- Assuming admin has full access and clients can see their own
CREATE POLICY "Enable all access for all users" ON public.payments FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON public.invoices FOR ALL USING (true);
