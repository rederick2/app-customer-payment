import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import GalleryClient from './GalleryClient';

export const metadata = { title: 'Gallery | Project Photos' };

export default async function GalleryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: photos } = await supabase
    .from('project_photos')
    .select('*, proformas(id, project_name, number, client_id, clients(name, company_name, first_name, last_name))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const { data: proformas } = await supabase
    .from('proformas')
    .select('id, project_name, number, client_id, clients(name, company_name, first_name, last_name)')
    .eq('user_id', user.id)
    .in('status', ['job', 'approved', 'completed'])
    .order('created_at', { ascending: false });

  return (
    <GalleryClient
      initialPhotos={photos || []}
      proformas={proformas || []}
    />
  );
}
