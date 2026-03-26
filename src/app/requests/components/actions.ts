'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateRequestStatus(requestId: string, newStatus: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autorizado' };
  }

  // Admin access to service_requests is handled via RLS policies 
  // (admins only see and update requests for their proformas).
  // But we still explicitly do an update here.
  const { data: request, error } = await supabase
    .from('service_requests')
    .update({ status: newStatus })
    .eq('id', requestId);

  console.log(error);

  if (error) {
    console.error('Error updating status:', error);
    return { error: 'Error al actualizar el estado de la solicitud' };
  }

  revalidatePath('/requests');
  revalidatePath(`/p/[id]/requests`, 'page');
  return { success: true };
}
