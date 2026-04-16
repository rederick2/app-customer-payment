'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function assignTask(taskId: string, teamMemberId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('job_tasks')
    .update({ assigned_to: teamMemberId })
    .eq('id', taskId);

  if (error) {
    console.error('Error assigning task:', error);
    return { error: 'Failed to assign task' };
  }

  revalidatePath('/jobs/team-map');
  return { success: true };
}
