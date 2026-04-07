'use server';

import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';
import { revalidatePath } from 'next/cache';

export async function createTeamInvitation(teamMemberId: string, email: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Generate a secure token
  const token = crypto.randomBytes(32).toString('hex');

  const { data, error } = await supabase.from('team_invitations').insert([{
    admin_id: user.id,
    team_member_id: teamMemberId,
    email: email,
    token: token
  }]).select().single();

  if (error) {
    console.error('Error creating invitation:', error);
    return { error: 'Failed to create invitation' };
  }

  revalidatePath('/settings');
  return { token: data.token }; // Return the token to display the link to the admin
}

export async function deleteTeamInvitation(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { error } = await supabase.from('team_invitations')
    .delete()
    .eq('id', id)
    .eq('admin_id', user.id);

  if (error) {
    return { error: 'Failed to delete invitation' };
  }

  revalidatePath('/settings');
  return { success: true };
}
