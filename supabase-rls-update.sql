-- Crear tabla de usuarios (perfiles)
CREATE TABLE public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  phone text,
  address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Agregar user_id a clients (referenciando a nuestra nueva tabla)
ALTER TABLE public.clients ADD COLUMN user_id uuid references public.users(id) not null default auth.uid();

-- Agregar user_id a proformas
ALTER TABLE public.proformas ADD COLUMN user_id uuid references public.users(id) not null default auth.uid();

-- Habilitar RLS en tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proformas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proforma_items ENABLE ROW LEVEL SECURITY;

-- Crear políticas para tabla de usuarios (cada quien ve/actualiza su perfil)
CREATE POLICY "Users can manage their own profile" ON public.users
    FOR ALL USING (auth.uid() = id);

-- Crear políticas para select, insert, update, delete
CREATE POLICY "Users can manage their own clients" ON public.clients
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own proformas" ON public.proformas
    FOR ALL USING (auth.uid() = user_id);

-- Los proforma_items se aseguran indirectamente mediante el proforma al que pertenecen, o añadiendo una política dependiente.
CREATE POLICY "Users can manage their own proforma items" ON public.proforma_items
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.proformas
        WHERE proformas.id = proforma_items.proforma_id
        AND proformas.user_id = auth.uid()
      )
    );

-- Trigger para crear un registro en public.users cuando se registra alguien en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, phone, address)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'address'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparador después de la inserción en auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
