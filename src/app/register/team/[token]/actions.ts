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

  // Create auth user via admin API (bypasses email confirmation, always returns user.id)
  const { data: adminAuthData, error: adminAuthError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: teamMemberName,
      display_name: teamMemberName,
    },
  });

  if (adminAuthError || !adminAuthData.user) {
    console.error('Admin signup error:', adminAuthError);
    redirect(
      '/register/team/' + token + '?error=' + encodeURIComponent(adminAuthError?.message || 'Failed to sign up')
    );
  }

  const newUserId = adminAuthData.user.id;

  // Set user_type = 2 (team member) in the users table
  // Try update first (in case the DB trigger already created the row)
  const { error: upsertError } = await adminClient
    .from('users')
    .upsert({
      id: newUserId,
      email: email,
      display_name: teamMemberName,
      user_type: 2, // 0=admin, 1=user, 2=team
    }, { onConflict: 'id' });

  if (upsertError) {
    console.error('Failed to set user_type:', upsertError);
  }

  // Link the new auth user to the team_members row
  const { error: updateError } = await adminClient
    .from('team_members')
    .update({ auth_user_id: newUserId })
    .eq('id', teamMemberId);

  if (updateError) {
    console.error('Failed to link auth_user_id to team member:', updateError);
  }

  // Mark invitation as used
  await adminClient
    .from('team_invitations')
    .update({ used: true })
    .eq('id', invitation.id);

  // Sign them in immediately
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    redirect('/login?message=Account+created!+Please+log+in.');
  }

  redirect('/team');
}
