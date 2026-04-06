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
