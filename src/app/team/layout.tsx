import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// user_type: 0 = admin, 1 = regular user, 2 = team member
const USER_TYPE_TEAM = 2;

export default async function TeamLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('user_type')
    .eq('id', user.id)
    .single();

  // If not a team member, send them to the main admin app
  if (profile?.user_type !== USER_TYPE_TEAM) {
    redirect('/');
  }

  return (
    <div className="flex-1 h-screen flex flex-col min-w-0 overflow-hidden">
      {children}
    </div>
  );
}
