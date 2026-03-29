-- 1. Actualizar el constraint de estado para incluir 'job_terminated'
ALTER TABLE public.proformas DROP CONSTRAINT IF EXISTS proformas_status_check;
ALTER TABLE public.proformas ADD CONSTRAINT proformas_status_check 
    CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'job', 'job_terminated'));

-- 2. Crear tabla para el historial de estados
CREATE TABLE IF NOT EXISTS public.proforma_status_history (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    proforma_id uuid NOT NULL REFERENCES public.proformas(id) ON DELETE CASCADE,
    old_status text,
    new_status text NOT NULL,
    changed_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- 3. Políticas RLS para proforma_status_history
ALTER TABLE public.proforma_status_history ENABLE ROW LEVEL SECURITY;

-- Los usuarios de la empresa pueden ver el historial de sus propias proformas
CREATE POLICY "Users can view status history for their proformas"
    ON public.proforma_status_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.proformas
            WHERE proformas.id = proforma_status_history.proforma_id
            AND proformas.user_id = auth.uid()
        )
    );

-- Permitir inserción mediante server actions (Service Role handled)
-- Nota: De forma similar a los mensajes, la inserción se manejará 
-- via admin client en las server actions para mayor seguridad.
