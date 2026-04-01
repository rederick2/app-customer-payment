-- ALTER TABLE: proformas
-- =============================================
-- Adds QuickBooks-specific tracking columns to the proformas table.
-- =============================================

alter table proformas 
add column if not exists qbo_customer_id text,
add column if not exists qbo_invoice_id text,
add column if not exists last_qbo_sync_at timestamptz;
