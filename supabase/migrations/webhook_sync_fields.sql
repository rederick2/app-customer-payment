-- Actualización de la tabla INVOICES
alter table invoices 
add column if not exists notes text,
add column if not exists due_date date;

-- Actualización de la tabla PAYMENTS (Mapeo de datos financieros)
alter table payments 
add column if not exists notes text,
add column if not exists payment_method text,
add column if not exists reference_number text, -- Para el número de transacción (PaymentRefNum en QBO)
add column if not exists bank_name text,        -- Para el banco de depósito (DepositToAccountRef en QBO)
add column if not exists type text default 'payment',
add column if not exists status text default 'completed';
