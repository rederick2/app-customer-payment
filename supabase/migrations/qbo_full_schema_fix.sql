-- TABLE: clients
-- =============================================
alter table clients add column if not exists qbo_customer_id text;

-- TABLE: invoices
-- =============================================
alter table invoices add column if not exists qbo_invoice_id text;
alter table invoices add column if not exists last_qbo_sync_at timestamptz;

-- TABLE: payments
-- =============================================
alter table payments add column if not exists qbo_payment_id text;
alter table payments add column if not exists last_qbo_sync_at timestamptz;

-- CLEANUP: proformas
-- =============================================
-- Migration of data:
-- 1. Move qbo_customer_id from proforma to client (using the relationship)
do $$
begin
  update clients c
  set qbo_customer_id = p.qbo_customer_id
  from proformas p
  where p.client_id = c.id and p.qbo_customer_id is not null and c.qbo_customer_id is null;

  -- 2. Move qbo_invoice_id from proforma to invoice (using the relationship)
  update invoices i
  set qbo_invoice_id = p.qbo_invoice_id,
      last_qbo_sync_at = p.last_qbo_sync_at
  from proformas p
  where i.proforma_id = p.id and p.qbo_invoice_id is not null and i.qbo_invoice_id is null;
end $$;

-- 3. Drop columns from proformas
alter table proformas drop column if exists qbo_customer_id;
alter table proformas drop column if exists qbo_invoice_id;
alter table proformas drop column if exists last_qbo_sync_at;
