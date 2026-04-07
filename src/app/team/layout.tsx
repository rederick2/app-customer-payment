import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Clock, CheckSquare, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function TeamLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if they are a team member
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  if (!teamMember) {
    // If not a team member, redirect to main app maybe they are admin
    redirect('/');
  }

  return (
    <div className="flex-1 h-screen flex flex-col min-w-0 overflow-hidden">
      {children}
    </div>
  );
}
