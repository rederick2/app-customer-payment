-- Script para actualizar la tabla 'clients' con los nuevos campos de contacto y dirección

ALTER TABLE public.clients 
  ALTER COLUMN name DROP NOT NULL, -- Hacemos el nombre antiguo opcional
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS street_1 text,
  ADD COLUMN IF NOT EXISTS street_2 text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS province text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS country text;

-- Si deseamos, podemos hacer una función para llenar automáticamente el 'name' antiguo
-- como "title first_name last_name" para no romper compatibilidad hacia atrás en las vistas antiguas:
CREATE OR REPLACE FUNCTION public.update_client_legacy_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo actualizar si no hay nombre o si provienen de los nuevos campos
  new.name := trim(concat_ws(' ', new.title, new.first_name, new.last_name));
  
  -- Si después de concatenar está vacío, dejamos el name original por si fue creado a la antigua
  IF new.name = '' THEN
    new.name := old.name;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Creamos el trigger para antes de la inserción o actualización
DROP TRIGGER IF EXISTS on_client_update_name ON public.clients;
CREATE TRIGGER on_client_update_name
  BEFORE INSERT OR UPDATE OF title, first_name, last_name ON public.clients
  FOR EACH ROW EXECUTE PROCEDURE public.update_client_legacy_name();
