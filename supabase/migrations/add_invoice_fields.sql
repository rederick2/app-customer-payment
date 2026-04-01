-- TABLE: invoices
-- Add tax and discount decimal columns
alter table public.invoices 
add column if not exists tax_amount numeric(10, 2) default 0,
add column if not exists discount_amount numeric(10, 2) default 0;

-- Enable Realtime for invoices and payments
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
