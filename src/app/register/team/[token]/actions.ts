'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signupTeamMember(token: string, teamMemberId: string, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createClient();

  // Re-verify token
  const { data: invitation, error: invError } = await supabase
    .from('team_invitations')
    .select('*, team_members(name)')
    .eq('token', token)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (invError || !invitation) {
    redirect('/register?error=Invalid+Invitation');
  }

  const teamMemberName = invitation.team_members?.name || 'Team Member';

  // Register user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: teamMemberName,
        display_name: teamMemberName,
        role: 'team',
      }
    }
  });

  if (authError || !authData.user) {
    console.error('Signup error:', authError);
    redirect('/register/team/' + token + '?error=' + encodeURIComponent(authError?.message || 'Failed to sign up'));
  }

  // Update team member row with the new auth.user id
  await supabase
    .from('team_members')
    .update({ auth_user_id: authData.user.id })
    .eq('id', teamMemberId);

  // Attempt to update public.users if the trigger already created it
  await supabase
    .from('users')
    .update({ display_name: teamMemberName })
    .eq('id', authData.user.id);

  // Mark invitation as used
  await supabase
    .from('team_invitations')
    .update({ used: true })
    .eq('id', invitation.id);

  // Sign out in case signup automatically signs in but we want to let them login fresh,
  // Actually Next.js supabase auth helpers often don't log in on server signUp if confirmations enabled,
  // but if they do, we're good.
  
  redirect('/team');
}
