-- Actualización de la tabla proformas para soportar ajustes dinámicos y condiciones de pago
ALTER TABLE public.proformas 
ADD COLUMN IF NOT EXISTS adjustments JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS payment_terms TEXT,
ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10, 2) DEFAULT 0;

-- Asegurar que la tabla de impuestos para el catálogo del usuario exista
CREATE TABLE IF NOT EXISTS public.taxes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  percentage NUMERIC(5, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en la tabla de impuestos
ALTER TABLE public.taxes ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para impuestos (solo el dueño puede ver/editar sus impuestos)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'taxes' AND policyname = 'Users can manage their own taxes'
    ) THEN
        CREATE POLICY "Users can manage their own taxes" ON public.taxes
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;
