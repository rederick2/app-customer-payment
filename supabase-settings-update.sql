-- Extender tabla de usuarios con datos bancarios
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bank_name text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bank_account text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS display_name text;

-- Crear tabla de impuestos (taxes)
CREATE TABLE IF NOT EXISTS public.taxes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  percentage numeric(10, 2) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.taxes ENABLE ROW LEVEL SECURITY;

-- Políticas para taxes
CREATE POLICY "Users can manage their own taxes" ON public.taxes
    FOR ALL USING (auth.uid() = user_id);

-- Comentarios para documentación
COMMENT ON TABLE public.taxes IS 'Impuestos configurables por el usuario para ser usados en proformas';
COMMENT ON COLUMN public.users.bank_name IS 'Nombre del banco para recibir pagos';
COMMENT ON COLUMN public.users.bank_account IS 'Número de cuenta bancaria para recibir pagos';
COMMENT ON COLUMN public.users.display_name IS 'Nombre público del profesional/estudio';
