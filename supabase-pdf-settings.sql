-- Añadir columna para el tamaño de letra del PDF
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS pdf_font_size integer DEFAULT 10;
