'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function deleteJobVisit(visitId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autorizado' };
  }

  const { error } = await supabase
    .from('job_visits')
    .delete()
    .eq('id', visitId);

  if (error) {
    console.error('Error deleting visit:', error);
    return { error: 'Error al eliminar la visita' };
  }

  revalidatePath('/calendar');
  return { success: true };
}

export async function updateEventDate(type: 'job' | 'task' | 'request' | 'visit', id: string, start: string, end?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'No autorizado' };

  try {
    let error;
    if (type === 'job') {
      const { error: err } = await supabase.from('proformas').update({ job_start_at: start, job_end_at: end }).eq('id', id);
      error = err;
    } else if (type === 'task') {
      const { error: err } = await supabase.from('job_tasks').update({ due_date: start, end_date: end || start }).eq('id', id);
      error = err;
    } else if (type === 'request') {
      const { error: err } = await supabase.from('service_requests').update({ schedule_date: start.split('T')[0] }).eq('id', id);
      error = err;
    } else if (type === 'visit') {
      const { error: err } = await supabase.from('job_visits').update({ visit_date: start }).eq('id', id);
      error = err;
    }

    if (error) throw error;
    revalidatePath('/calendar');
    return { success: true };
  } catch (err: any) {
    console.error(`Error updating ${type} date:`, err);
    return { error: err.message || 'Error occurred' };
  }
}

export async function updateJobVisit(id: string, updates: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const { error } = await supabase.from('job_visits').update(updates).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/calendar');
  return { success: true };
}

export async function updateJobTask(id: string, updates: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const { error } = await supabase.from('job_tasks').update(updates).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/calendar');
  return { success: true };
}

export async function updateServiceRequest(id: string, updates: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const { error } = await supabase.from('service_requests').update(updates).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/calendar');
  return { success: true };
}
