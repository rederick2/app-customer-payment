-- 1. Agregar estado a la tabla de proformas
ALTER TABLE public.proformas
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected'));

-- 2. Crear tabla para los mensajes/comunicaciones (requests) entre empresa y cliente
CREATE TABLE IF NOT EXISTS public.proforma_requests (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    proforma_id uuid NOT NULL REFERENCES public.proformas(id) ON DELETE CASCADE,
    sender_type text NOT NULL CHECK (sender_type IN ('company', 'client')),
    message text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- 3. Políticas RLS para proforma_requests
ALTER TABLE public.proforma_requests ENABLE ROW LEVEL SECURITY;

-- Los usuarios autenticados (la empresa) pueden leer todos los mensajes relacionados con sus proformas.
CREATE POLICY "Users can view proforma requests for their proformas"
    ON public.proforma_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.proformas
            WHERE proformas.id = proforma_requests.proforma_id
            AND proformas.user_id = auth.uid()
        )
    );

-- Los usuarios autenticados pueden insertar mensajes en las proformas que les pertenecen.
CREATE POLICY "Users can insert proforma requests for their proformas"
    ON public.proforma_requests FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.proformas
            WHERE proformas.id = proforma_requests.proforma_id
            AND proformas.user_id = auth.uid()
        )
    );

-- Nota: Para el cliente (usuario no autenticado interactuando con la vista pública compartida),
-- las operaciones de inserción y lectura de proforma_requests se manejarán desde 
-- Server Actions de Next.js empleando la Service Role Key, la cual hace un bypass seguro 
-- de RLS, eliminando la necesidad de exponer políticas públicas peligrosas.
