'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function startTimeEntry(teamMemberId: string, proformaId: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Need admin ID to save. This is a bit tricky: team members log in with their own auth_user_id.
  // Their associated `user_id` on `team_members` is the admin.
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('user_id')
    .eq('id', teamMemberId)
    .single();

  if (!teamMember) return { error: 'Team member not found' };

  const { data, error } = await supabase.from('time_entries').insert([{
    user_id: teamMember.user_id, // Admin's user ID
    team_member_id: teamMemberId,
    proforma_id: proformaId || null,
    start_time: new Date().toISOString(),
    status: 'active'
  }]).select().single();

  if (error) {
    console.error('Error starting time:', error);
    return { error: 'Failed to start time entry' };
  }

  revalidatePath('/team/tasks');
  return { success: true, data };
}

export async function stopTimeEntry(entryId: string) {
  const supabase = await createClient();
  
  // Get existing entry
  const { data: entry } = await supabase.from('time_entries').select('*').eq('id', entryId).single();
  if (!entry) return { error: 'Not found' };

  const endTime = new Date();
  const startTime = new Date(entry.start_time);
  const diffSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

  const { error } = await supabase.from('time_entries').update({
    end_time: endTime.toISOString(),
    duration_seconds: diffSeconds,
    status: 'completed',
    updated_at: new Date().toISOString()
  }).eq('id', entryId);

  if (error) {
    console.error('Error stopping time:', error);
    return { error: 'Failed' };
  }

  revalidatePath('/team/tasks');
  return { success: true };
}
