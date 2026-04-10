'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/mail';

async function logStatusChange(proformaId: string, newStatus: string, oldStatus?: string, userId?: string) {
  const supabase = createAdminClient();
  await supabase
    .from('proforma_status_history')
    .insert({
      proforma_id: proformaId,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: userId
    });
}

export async function insertNotification(proformaId: string, type: string, message: string) {
  const supabase = createAdminClient();
  const { data: proforma } = await supabase
    .from('proformas')
    .select('user_id, client_id')
    .eq('id', proformaId)
    .single();

  if (proforma?.user_id) {
    await supabase.from('notifications').insert({
      user_id: proforma.user_id,
      proforma_id: proformaId,
      client_id: proforma.client_id,
      type,
      message,
    });
  }
}

export async function trackProformaView(proformaId: string) {
  const supabase = createAdminClient();
  const { data: proforma } = await supabase
    .from('proformas')
    .select('user_id, client_id, project_name')
    .eq('id', proformaId)
    .single();

  if (!proforma || !proforma.user_id) return { success: false };

  // Only track the very first time the client views this quote
  const { data: existingView } = await supabase
    .from('notifications')
    .select('id')
    .eq('proforma_id', proformaId)
    .eq('type', 'viewed')
    .limit(1)
    .single();

  if (existingView) {
    return { success: true };
  }

  await supabase.from('notifications').insert({
    user_id: proforma.user_id,
    proforma_id: proformaId,
    client_id: proforma.client_id,
    type: 'viewed',
    message: `Client viewed the quote: ${proforma.project_name}.`
  });

  return { success: true };
}

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

  // 1. Fetch proforma details and user email
  const { data: proforma, error: fetchError } = await supabase
    .from('proformas')
    .select('project_name, user_id, number, status, users(display_name)')
    .eq('id', proformaId)
    .single();

  if (fetchError || !proforma) {
    console.error('Error fetching proforma for approval notification:', fetchError);
    return { success: false, error: 'Proforma not found' };
  }

  // Fetch the user's email from auth/profiles
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(proforma.user_id);
  const userEmail = userData?.user?.email;

  if (userError || !userEmail) {
    console.error('Error fetching user email for notification:', userError);
    // Continue anyway, but log the error
  }

  // 2. Perform the update
  const status = proforma.status === 'job' ? 'job' : 'approved';
  const updatePayload: any = { status, approved_at: new Date().toISOString() };
  if (signatureData) updatePayload.client_signature_data = signatureData;
  if (signatureName) updatePayload.client_signed_name = signatureName;

  const { error: updateError } = await supabase
    .from('proformas')
    .update(updatePayload)
    .eq('id', proformaId);

  if (updateError) {
    console.error('Error approving proforma:', updateError);
    return { success: false, error: 'No se pudo aprobar la proforma' };
  }


  if (status === 'approved') {

    await logStatusChange(proformaId, 'approved', proforma.status);

    await insertNotification(proformaId, 'approved', `Client approved the quote: ${proforma.project_name}.`);
  }

  // 3. Send notification email if user email is available
  if (userEmail && status === 'approved') {
    try {
      const proformaNumber = String(proforma.number || proformaId.split('-')[0]).toUpperCase();
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const jobLink = `${baseUrl}/proforma/${proformaId}`;

      await sendEmail({
        displayName: 'Notify',
        to: [userEmail],
        subject: `Job Approved: ${proforma.project_name} (#${proformaNumber})`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; rounded: 12px;">
            <h1 style="color: #059669; font-size: 24px; margin-bottom: 16px;">Good news! 🎉</h1>
            <p style="font-size: 16px; color: #374151; line-height: 1.5;">
              The client has just approved and signed the quote for <strong>${proforma.project_name}</strong>.
            </p>
            <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 24px 0;">
              <p style="margin: 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-weight: bold;">Project</p>
              <p style="margin: 4px 0 16px 0; font-size: 18px; font-weight: bold; color: #111827;">${proforma.project_name}</p>
              
              ${signatureName ? `
                <p style="margin: 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-weight: bold;">Approved by</p>
                <p style="margin: 4px 0 16px 0; font-size: 18px; font-weight: bold; color: #111827;">${signatureName}</p>
              ` : ''}

              <p style="margin: 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-weight: bold;">Quote Number</p>
              <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: bold; color: #111827;">#${proformaNumber}</p>
            </div>
            <a href="${jobLink}" style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">
              View Job Details
            </a>
            <hr style="margin: 32px 0; border: 0; border-top: 1px solid #e5e7eb;" />
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              This is an automatic notification from Quickqi.
            </p>
          </div>
        `
      });
    } catch (emailErr) {
      console.error('Error sending approval notification email:', emailErr);
      // Don't fail the whole action if only email fails
    }
  }

  // Actualizar la vista pública y la del administrador
  revalidatePath(`/p/${proformaId}`);
  revalidatePath(`/proforma/${proformaId}`);

  return { success: true };
}

export async function rejectProforma(proformaId: string) {
  const supabase = createAdminClient();

  const { data: proforma } = await supabase
    .from('proformas')
    .select('status')
    .eq('id', proformaId)
    .single();

  const { error } = await supabase
    .from('proformas')
    .update({ status: 'rejected' })
    .eq('id', proformaId);

  if (error) {
    console.error('Error rejecting proforma:', error);
    return { success: false, error: 'Could not reject the quote' };
  }

  await logStatusChange(proformaId, 'rejected', proforma?.status);

  // Insert notification
  await insertNotification(proformaId, 'rejected', `Client rejected the quote.`);


  // Actualizar la vista pública y la del administrador
  revalidatePath(`/p/${proformaId}`);
  revalidatePath(`/proforma/${proformaId}`);

  return { success: true };
}

export async function submitClientMessage(proformaId: string, message: string) {
  if (!message.trim()) return { success: false, error: 'The message cannot be empty.' };

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
    return { success: false, error: 'Could not send the message' };
  }

  // Insert notification
  await insertNotification(proformaId, 'request', `Client sent a new message regarding the quote.`);

  revalidatePath(`/p/${proformaId}`);
  revalidatePath(`/proforma/${proformaId}`);

  return { success: true };
}

export async function submitCompanyMessage(proformaId: string, message: string) {
  if (!message.trim()) return { success: false, error: 'The message cannot be empty.' };

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
    return { success: false, error: 'Could not send the message' };
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
    return { success: false, error: 'Could not mark the quote as sent' };
  }

  await logStatusChange(proformaId, 'sent', 'draft');

  revalidatePath(`/proforma/${proformaId}`);
  return { success: true };
}
