-- Script para adaptar la tabla clients a los campos del CSV de importación (ej. Jobber)

ALTER TABLE clients
-- Campos de empresa y visualización
ADD COLUMN IF NOT EXISTS is_company BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT, -- Se puede guardar como texto separado por comas

-- Direcciones de Facturación (Billing)
ADD COLUMN IF NOT EXISTS billing_street_1 TEXT,
ADD COLUMN IF NOT EXISTS billing_street_2 TEXT,
ADD COLUMN IF NOT EXISTS billing_city TEXT,
ADD COLUMN IF NOT EXISTS billing_state TEXT,
ADD COLUMN IF NOT EXISTS billing_zip_code TEXT,
ADD COLUMN IF NOT EXISTS billing_country TEXT,

-- Teléfonos adicionales
ADD COLUMN IF NOT EXISTS work_phone TEXT,
ADD COLUMN IF NOT EXISTS mobile_phone TEXT,
ADD COLUMN IF NOT EXISTS home_phone TEXT,
ADD COLUMN IF NOT EXISTS fax_phone TEXT,
ADD COLUMN IF NOT EXISTS other_phones TEXT,
ADD COLUMN IF NOT EXISTS text_message_enabled_phone TEXT,

-- Preferencias (Automated follow-ups, etc.)
ADD COLUMN IF NOT EXISTS receives_automatic_visit_reminders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS receives_automatic_job_follow_ups BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS receives_automatic_quote_follow_ups BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS receives_automatic_invoice_follow_ups BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false,

-- Metadatos
ADD COLUMN IF NOT EXISTS lead_source TEXT,
ADD COLUMN IF NOT EXISTS import_id TEXT UNIQUE, -- J-ID para evitar duplicados en re-importaciones
ADD COLUMN IF NOT EXISTS custom_fields JSONB; -- Para guardar los campos CFT[...] y CFL[...]
