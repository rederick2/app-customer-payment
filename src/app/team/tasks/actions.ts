'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateTaskProgress(taskId: string, percentage: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('job_tasks')
    .update({ 
      percentage,
      status: percentage === 100 ? 'completed' : 'pending'
    })
    .eq('id', taskId);
  if (error) return { error: 'Failed to update progress' };
  revalidatePath('/team/tasks');
  return { success: true };
}

export async function startTimeEntry(teamMemberId: string, proformaId: string | null, taskId: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: teamMember } = await supabase
    .from('team_members')
    .select('user_id')
    .eq('id', teamMemberId)
    .single();

  if (!teamMember) return { error: 'Team member not found' };

  const { data, error } = await supabase.from('time_entries').insert([{
    user_id: teamMember.user_id,
    team_member_id: teamMemberId,
    proforma_id: proformaId || null,
    task_id: taskId || null,
    start_time: new Date().toISOString(),
    status: 'active'
  }]).select().single();

  if (error) {
    console.error('Error starting time:', error);
    return { error: 'Failed' };
  }

  revalidatePath('/team/tasks');
  return { success: true, data };
}

export async function stopTimeEntry(entryId: string) {
  const supabase = await createClient();

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
