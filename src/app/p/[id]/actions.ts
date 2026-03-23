'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function markMessagesAsRead(proformaId: string, readerRole: 'client' | 'company') {
  // Mark all messages sent by the OTHER party as read
  const senderType = readerRole === 'client' ? 'company' : 'client';
  const supabase = createAdminClient();
  await supabase
    .from('proforma_requests')
    .update({ read_at: new Date().toISOString() })
    .eq('proforma_id', proformaId)
    .eq('sender_type', senderType)
    .is('read_at', null);
  return { success: true };
}


export async function approveProforma(proformaId: string, signatureData?: string, signatureName?: string) {
  const supabase = createAdminClient();

  const updatePayload: any = { status: 'approved', approved_at: new Date().toISOString() };
  if (signatureData) updatePayload.client_signature_data = signatureData;
  if (signatureName) updatePayload.client_signed_name = signatureName;

  const { error } = await supabase
    .from('proformas')
    .update(updatePayload)
    .eq('id', proformaId);

  if (error) {
    console.error('Error approving proforma:', error);
    return { success: false, error: 'No se pudo aprobar la proforma' };
  }

  // Actualizar la vista pública y la del administrador
  revalidatePath(`/p/${proformaId}`);
  revalidatePath(`/proforma/${proformaId}`);
  
  return { success: true };
}

export async function rejectProforma(proformaId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('proformas')
    .update({ status: 'rejected' })
    .eq('id', proformaId);

  if (error) {
    console.error('Error rejecting proforma:', error);
    return { success: false, error: 'No se pudo rechazar la proforma' };
  }

  // Actualizar la vista pública y la del administrador
  revalidatePath(`/p/${proformaId}`);
  revalidatePath(`/proforma/${proformaId}`);
  
  return { success: true };
}

export async function submitClientMessage(proformaId: string, message: string) {
  if (!message.trim()) return { success: false, error: 'El mensaje no puede estar vacío.' };

  const supabase = createAdminClient();

  const { error } = await supabase
    .from('proforma_requests')
    .insert({
      proforma_id: proformaId,
      sender_type: 'client',
      message: message.trim()
    });

  if (error) {
    console.error('Error submitting message:', error);
    return { success: false, error: 'No se pudo enviar el mensaje' };
  }

  revalidatePath(`/p/${proformaId}`);
  revalidatePath(`/proforma/${proformaId}`);
  
  return { success: true };
}

export async function submitCompanyMessage(proformaId: string, message: string) {
  if (!message.trim()) return { success: false, error: 'El mensaje no puede estar vacío.' };

  const supabase = createAdminClient();

  // As company, we verify later on the UI, but admin client bypasses RLS
  const { error } = await supabase
    .from('proforma_requests')
    .insert({
      proforma_id: proformaId,
      sender_type: 'company',
      message: message.trim()
    });

  if (error) {
    console.error('Error submitting message:', error);
    return { success: false, error: 'No se pudo enviar el mensaje' };
  }

  revalidatePath(`/proforma/${proformaId}`);
  revalidatePath(`/p/${proformaId}`);
  
  return { success: true };
}

export async function markProformaAsSent(proformaId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('proformas')
    .update({ status: 'sent' })
    .eq('id', proformaId)
    .eq('status', 'draft'); // Sólo si sigue en borrador

  if (error) {
    console.error('Error marking proforma as sent:', error);
    return { success: false, error: 'No se pudo marcar la proforma como enviada' };
  }

  revalidatePath(`/proforma/${proformaId}`);
  return { success: true };
}
