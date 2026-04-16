'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signupTeamMember(token: string, teamMemberId: string, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();
  const adminClient = createAdminClient();

  // Re-verify token using admin client to bypass RLS
  const { data: invitation, error: invError } = await adminClient
    .from('team_invitations')
    .select('*, team_members(name)')
    .eq('token', token)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (invError || !invitation) {
    redirect('/register?error=Invalid+Invitation');
  }

  const teamMemberName = (invitation.team_members as any)?.name || 'Team Member';

  // Use admin API to create the user — this bypasses email confirmation
  // and guarantees we get user.id back immediately even if email confirmation
  // is enabled in the Supabase project settings.
  const { data: adminAuthData, error: adminAuthError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // auto-confirm so they can log in right away
    user_metadata: {
      name: teamMemberName,
      display_name: teamMemberName,
      role: 'team',
    },
  });

  if (adminAuthError || !adminAuthData.user) {
    console.error('Admin signup error:', adminAuthError);
    redirect(
      '/register/team/' + token + '?error=' + encodeURIComponent(adminAuthError?.message || 'Failed to sign up')
    );
  }

  const newUserId = adminAuthData.user.id;

  // Link the new auth user to the team_members row (use admin to bypass RLS)
  const { error: updateError } = await adminClient
    .from('team_members')
    .update({ auth_user_id: newUserId })
    .eq('id', teamMemberId);

  if (updateError) {
    console.error('Failed to link auth_user_id to team member:', updateError);
  }

  // Update public.users display_name if the DB trigger already created the row
  await adminClient
    .from('users')
    .update({ display_name: teamMemberName })
    .eq('id', newUserId);

  // Mark invitation as used
  await adminClient
    .from('team_invitations')
    .update({ used: true })
    .eq('id', invitation.id);

  // Sign them in immediately so they land on /team already authenticated
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    // Fallback: send to login if sign-in fails
    redirect('/login?message=Account+created!+Please+log+in.');
  }

  redirect('/team');
}
