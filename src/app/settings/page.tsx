import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile data
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch taxes
  const { data: taxes } = await supabase
    .from('taxes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  return <SettingsClient initialProfile={profile} initialTaxes={taxes || []} />;
}
