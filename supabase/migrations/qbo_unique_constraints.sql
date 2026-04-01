-- TABLE: clients
-- Add unique constraint for qbo_customer_id to enable upsert
alter table public.clients 
add constraint clients_qbo_customer_id_unique unique (qbo_customer_id);

-- TABLE: invoices
-- Add unique constraint for qbo_invoice_id to enable upsert
alter table public.invoices 
add constraint invoices_qbo_invoice_id_unique unique (qbo_invoice_id);

-- TABLE: payments
-- Add unique constraint for qbo_payment_id to enable upsert
alter table public.payments 
add constraint payments_qbo_payment_id_unique unique (qbo_payment_id);
