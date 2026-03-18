-- Agregar columna is_optional a los items de proforma
ALTER TABLE public.proforma_items ADD COLUMN IF NOT EXISTS is_optional boolean DEFAULT false;

-- Agregar columna applied_taxes a proformas para guardar el detalle de impuestos aplicados
-- Esto permite que la proforma sea inmutable respecto a cambios futuros en la configuración de taxes
ALTER TABLE public.proformas ADD COLUMN IF NOT EXISTS applied_taxes jsonb DEFAULT '[]'::jsonb;

-- Comentarios para documentación
COMMENT ON COLUMN public.proforma_items.is_optional IS 'Indica si el ítem es opcional y no debe sumarse al total';
COMMENT ON COLUMN public.proformas.applied_taxes IS 'Lista de impuestos (nombre y porcentaje) aplicados a esta proforma';
