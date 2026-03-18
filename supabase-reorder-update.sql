-- Add sort_order to proforma_items
ALTER TABLE public.proforma_items ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Add is_excluded to proforma_items (calculation state)
-- Renaming/clarifying: is_optional means "can be optional", is_excluded means "currently not in total"
ALTER TABLE public.proforma_items ADD COLUMN IF NOT EXISTS is_excluded boolean DEFAULT false;

-- Add comments for clarity
COMMENT ON COLUMN public.proforma_items.sort_order IS 'The display order of the item in the proforma';
COMMENT ON COLUMN public.proforma_items.is_optional IS 'Indicates if the item is MARKED as optional (nature)';
COMMENT ON COLUMN public.proforma_items.is_excluded IS 'Indicates if the item is currently EXCLUDED from the total calculation (state)';

-- Initialize is_excluded with current is_optional values to preserve state
-- and keep is_optional as true if it was already used as such (since old logic used is_optional for both)
UPDATE public.proforma_items SET is_excluded = is_optional;
